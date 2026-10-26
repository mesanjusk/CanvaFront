import JSZip from 'jszip';
import { parseCsv, newDesign } from './format.mjs';
import { normalizeTemplate, sanitizePreview, MAX_TEMPLATES_PER_BATCH } from './template-library.mjs';

const MAX_ZIP_BYTES=75000000;
const MAX_JSON_BYTES=18000000;
const MAX_TOTAL_UNCOMPRESSED=180000000;
const MAX_ENTRY_BYTES=22000000;
const MAX_PREVIEW_BYTES=1000000;

function safePath(value){
  const path=String(value||'').replace(/\\/g,'/').replace(/^\.\/+/,'');
  if(!path||path.startsWith('/')||path.split('/').includes('..')||
      /[\u0000-\u001f]/.test(path))throw new Error('Unsafe ZIP file path.');
  return path;
}
function toMeta(record) {
  const values=Object.fromEntries(Object.entries(record||{}).map(([k,v])=>[k.toLowerCase().trim(),v]));
  return {
    name:values.name||values.title,
    category:values.category,
    description:values.description||values.desc,
    keywords:values.keywords||values.tags,
    published:false
  };
}
const sourcePath=(record)=>record.file||record.layout||record.json||record.designfile||record.template;
function csvCell(value){
  const s=String(value??'');
  return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
}
function dataUriFromBytes(bytes,ext) {
  const mime=/\.webp$/i.test(ext)?'image/webp':/\.png$/i.test(ext)?'image/png':'image/jpeg';
  let binary='';
  for(let i=0;i<bytes.length;i+=8192)
    binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return 'data:'+mime+';base64,'+btoa(binary);
}
export async function importTemplateFiles(files,onProgress=()=>{}) {
  const selected=Array.from(files||[]);
  if(!selected.length)throw new Error('Choose a ZIP or JSON file.');
  let parsed=[],processed=0,skipped=[];
  for(const file of selected){
    const lower=String(file.name||'').toLowerCase();
    let kind=lower.endsWith('.json')?'json':lower.endsWith('.zip')?'zip':'';
    if(!kind&&typeof file.slice==='function'){
      const head=file.slice(0,4);
      const bytes=typeof head.arrayBuffer==='function'?
        new Uint8Array(await head.arrayBuffer()):head instanceof Uint8Array?head:null;
      if(bytes?.[0]===0x50&&bytes?.[1]===0x4b)kind='zip';
      else if(bytes?.[0]===0x7b||bytes?.[0]===0x5b)kind='json';
    }
    if(kind==='json'){
      if(file.size>MAX_JSON_BYTES)throw new Error(file.name+' exceeds the 18 MB JSON limit.');
      const data=JSON.parse(await file.text());
      parsed.push(normalizeTemplate(data,{sourceName:file.name}));
      onProgress(++processed,selected.length);
    }else if(kind==='zip'){
      if(file.size>MAX_ZIP_BYTES)throw new Error(file.name+' exceeds the 75 MB ZIP limit.');
      const zip=await JSZip.loadAsync(typeof file.arrayBuffer==='function'?await file.arrayBuffer():file);
      const entries=Object.entries(zip.files).filter(([,entry])=>!entry.dir);
      if(entries.length>2000)throw new Error('ZIP contains too many files.');
      let total=0;
      for(const [path,entry] of entries){
        safePath(path);
        const size=Number(entry._data?.uncompressedSize||0);
        if(size>MAX_ENTRY_BYTES)throw new Error(path+' exceeds the 22 MB file limit.');
        total+=size;
      }
      if(total>MAX_TOTAL_UNCOMPRESSED)throw new Error('ZIP expands beyond the 180 MB safety limit.');
      const lookup=new Map(entries.map(([path,entry])=>[path.toLowerCase(),entry]));
      const find=(path)=>lookup.get(safePath(path).toLowerCase());
      const jsonManifest=lookup.get('manifest.json');
      const csvManifest=lookup.get('manifest.csv');
      let manifest=[];
      if(jsonManifest){
        const content=JSON.parse(await jsonManifest.async('string'));
        manifest=Array.isArray(content)?content:Array.isArray(content.templates)?content.templates:[];
      }else if(csvManifest){
        manifest=parseCsv(await csvManifest.async('string'));
      }
      if(!manifest.length)manifest=entries.filter(([name])=>/\.json$/i.test(name)&&
        !/(^|\/)manifest\.json$/i.test(name)).map(([name])=>({file:name}));
      if(manifest.length>MAX_TEMPLATES_PER_BATCH)throw new Error('Maximum 500 templates in one ZIP.');
      for(const raw of manifest){
        const record=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k.toLowerCase().trim(),v]));
        const path=sourcePath(record);
        try{
          if(!path)throw new Error('Missing file path in manifest.');
          const item=find(path);
          if(!item)throw new Error('Layout file not found: '+path);
          const size=Number(item._data?.uncompressedSize||0);
          if(size>MAX_JSON_BYTES)throw new Error('Layout JSON too large.');
          const json=JSON.parse(await item.async('string'));
          let preview='';
          const thumbPath=record.preview||record.thumbnail;
          if(thumbPath&&/\.(png|jpg|jpeg|webp)$/i.test(thumbPath)){
            const thumb=find(thumbPath);
            if(thumb && Number(thumb._data?.uncompressedSize||0)<=MAX_PREVIEW_BYTES){
              preview=sanitizePreview(dataUriFromBytes(await thumb.async('uint8array'),thumbPath));
            }
          }
          const template=normalizeTemplate(json,{...toMeta(record),thumbnail:preview,sourceName:path});
          parsed.push(template);
        }catch(error){
          skipped.push(String(path||'(unnamed)')+': '+error.message);
        }
        onProgress(++processed,manifest.length);
      }
    }else throw new Error('Only editable .json files and .zip template packs are supported.');
    if(parsed.length>MAX_TEMPLATES_PER_BATCH)
      throw new Error('Maximum 500 templates per import.');
  }
  if(!parsed.length)throw new Error('No valid editable templates found. '+skipped.slice(0,2).join(' '));
  for(let i=0;i<parsed.length;i++){
    if(!parsed[i].thumbnail){
      try{parsed[i].thumbnail=await generateThumbnail(parsed[i]);}
      catch{parsed[i].thumbnail='';}
    }
  }
  return {templates:parsed,skipped};
}
export async function generateThumbnail(template) {
  if(typeof document==='undefined')return '';
  const page=template.pages?.[0];
  if(!page)return '';
  const maxSide=320;
  const zoom=Math.min(maxSide/page.width,maxSide/page.height);
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(page.width*zoom));
  canvas.height=Math.max(1,Math.round(page.height*zoom));
  const ctx=canvas.getContext('2d');
  if(!ctx)return '';
  ctx.fillStyle=page.background||'#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const item of (page.objects?.objects||page.seed||[])){
    ctx.save();
    ctx.scale(zoom,zoom);
    const left=Number(item.left??item.x??0),top=Number(item.top??item.y??0);
    ctx.translate(left,top);
    ctx.rotate((Number(item.angle)||0)*Math.PI/180);
    ctx.scale(Number(item.scaleX)||1,Number(item.scaleY)||1);
    ctx.globalAlpha=Number.isFinite(item.opacity)?Math.max(0,Math.min(1,item.opacity)):1;
    const fill=item.fill??item.color??'#493b51';
    if(typeof fill==='string')ctx.fillStyle=fill;
    const width=Number(item.width??item.w??100),height=Number(item.height??item.h??60);
    const radius=Number(item.radius??item.r??0);
    const type=item.type;
    if(type==='rect'||type==='triangle'){
      ctx.beginPath();
      if(type==='triangle'){ctx.moveTo(width/2,0);ctx.lineTo(width,height);ctx.lineTo(0,height);}
      else ctx.rect(0,0,width,height);
      ctx.closePath();
      if(fill!=='transparent')ctx.fill();
      if(item.stroke){ctx.strokeStyle=item.stroke;ctx.lineWidth=Number(item.strokeWidth)||1;ctx.stroke();}
    }else if(type==='circle'){
      ctx.beginPath();ctx.arc(radius,radius,radius,0,Math.PI*2);
      if(fill!=='transparent')ctx.fill();
    }else if(type==='i-text'||type==='textbox'||type==='text'){
      const val=String(item.text??item.value??'').slice(0,400);
      const size=Number(item.fontSize??item.size??18);
      ctx.font=(item.fontStyle==='italic'||item.italic?'italic ':'')+
        (item.fontWeight||item.weight||'normal')+' '+size+'px '+(item.fontFamily||item.font||'Georgia');
      ctx.textAlign=item.textAlign||item.align||'left';
      const x=ctx.textAlign==='center'?width/2:ctx.textAlign==='right'?width:0;
      val.split('\n').slice(0,10).forEach((line,index)=>ctx.fillText(line,x,size+index*size*1.25,width||undefined));
    }else if(type==='image'){
      ctx.fillStyle='#eee9ef';ctx.fillRect(0,0,width,height);
    }
    ctx.restore();
  }
  return canvas.toDataURL('image/jpeg',.72);
}
export async function exportTemplateZip(templates,filename='sk-template-library.zip') {
  const zip=new JSZip();const rows=[['file','name','category','description','keywords','preview'].join(',')];
  for(const [index,t] of templates.entries()){
    const id=String(t.id||index).replace(/[^a-z0-9_-]/gi,'').slice(0,45)||String(index);
    const file='templates/'+id+'.json';
    const design={name:t.name,category:t.category,description:t.description,pages:t.pages};
    zip.file(file,JSON.stringify(design));
    let preview='';
    if(sanitizePreview(t.thumbnail)){
      const kind=t.thumbnail.slice(11,t.thumbnail.indexOf(';'));
      const extension=kind==='png'?'png':kind==='webp'?'webp':'jpg';
      preview='previews/'+id+'.'+extension;
      zip.file(preview,t.thumbnail.split(',')[1],{base64:true});
    }
    rows.push([file,t.name,t.category,t.description||'',t.keywords||'',preview].map(csvCell).join(','));
  }
  zip.file('manifest.csv',rows.join('\n'));
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:4}});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
}
export async function downloadSampleTemplateZip(){
  const examples=[newDesign('royal'),newDesign('social')].map(d=>({
    id:d.id,name:d.title,category:d.title.includes('Wedding')?'Wedding':'Social',
    description:'Starter example',keywords:'',pages:d.pages,thumbnail:''
  }));
  return exportTemplateZip(examples,'sk-template-sample.zip');
}
