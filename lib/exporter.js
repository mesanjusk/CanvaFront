function safeName(name) {
  return (name||'design').trim().replace(/[^a-z0-9\-_ ]/gi,'').replace(/\s+/g,'-').slice(0,75)||'design';
}
export function downloadBlob(blob,filename) {
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);
}
export function downloadDataUrl(url,filename) {
  const a=document.createElement('a');a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
}
async function loadPage(page) {
  const { fabric }=await import('fabric');
  const node=document.createElement('canvas');
  const c=new fabric.StaticCanvas(node,{width:page.width,height:page.height,
    backgroundColor:page.background||'#ffffff',enableRetinaScaling:false});
  if(page.objects) await new Promise((resolve,reject)=>{
    try {c.loadFromJSON(page.objects,()=>{c.renderAll();resolve();});}
    catch(e){reject(e);}
  });
  c.backgroundColor=page.background||'#ffffff';
  c.renderAll();
  return c;
}
export async function exportDocument(doc,format='png',dpi=300,pageScope='all',transparent=false) {
  const all=pageScope==='current'?[doc.pages[doc.activePage||0]]:doc.pages;
  if(!all.length)throw new Error('There are no pages to export');
  const pages=format==='pdf'?all:[all[0]];
  const maxDpi=Math.min(Math.max(Number(dpi)||300,72),864);
  const { jsPDF }=format==='pdf'?await import('jspdf'):{};
  let pdf;
  for(let i=0;i<pages.length;i++){
    const page=pages[i];
    const pixels=page.width*page.height*(maxDpi/72)**2;
    if(pixels>49000000)throw new Error('This export is too large for safe browser rendering. Choose 300 DPI or smaller.');
    const canvas=await loadPage(page);
    if(transparent && format==='png')canvas.backgroundColor=null;
    if(format==='svg'){
      downloadBlob(new Blob([canvas.toSVG()],{type:'image/svg+xml'}),safeName(doc.title)+'.svg');
    }else if(format==='png'||format==='jpg'){
      const data=canvas.toDataURL({format:format==='jpg'?'jpeg':'png',
        quality:.96,multiplier:maxDpi/72});
      downloadDataUrl(data,safeName(doc.title)+(pages.length>1?'-page-'+(i+1):'')+'.'+format);
    }else if(format==='pdf'){
      const pW=page.width,pH=page.height;
      if(!pdf) pdf=new jsPDF({orientation:pW>pH?'landscape':'portrait',unit:'pt',format:[pW,pH],compress:true});
      else pdf.addPage([pW,pH],pW>pH?'landscape':'portrait');
      const data=canvas.toDataURL({format:'jpeg',quality:.94,multiplier:maxDpi/72});
      pdf.addImage(data,'JPEG',0,0,pW,pH,undefined,'FAST');
    }
    canvas.dispose();
  }
  if(pdf)pdf.save(safeName(doc.title)+'.pdf');
}
