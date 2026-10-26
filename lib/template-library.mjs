import { uid, blankPage } from './format.mjs';

export const MAX_TEMPLATES_PER_BATCH = 500;
export const TEMPLATE_CATEGORIES = [
  'Wedding','Birthday & Events','Business','Social','Labels','Certificate',
  'Festival','Flex & Posters','Blank','Other'
];

const cleanText=(value,max=120)=>String(value||'').trim().replace(/[\u0000-\u001f]/g,' ').slice(0,max);
const now=()=>new Date().toISOString();

export function sanitizeCategory(value) {
  return cleanText(value||'Other',40)||'Other';
}
export function sanitizePreview(value) {
  if(typeof value!=='string'||value.length>1400000)return '';
  return /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)?value:'';
}
export function validateScene(scene) {
  if(!scene||typeof scene!=='object'||Array.isArray(scene)||!Array.isArray(scene.objects))
    throw new Error('The template needs editable Fabric canvas objects.');
  if(scene.objects.length>2000)throw new Error('Too many elements on a single page.');
  const check=(value)=>{
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(check);return;}
    for(const [key,item] of Object.entries(value)){
      if(key==='src'&&typeof item==='string'&&
        !/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(item))
        throw new Error('External or unsupported embedded image sources are not allowed.');
      if(key==='clipPath'||key==='objects')check(item);
    }
  };
  check(scene.objects);
  return scene;
}
export function normalizeTemplate(input, metadata={}) {
  if(!input||typeof input!=='object'||Array.isArray(input))
    throw new Error('Invalid design JSON.');
  const originalPages=Array.isArray(input.pages)?input.pages:
    input.layout&&Array.isArray(input.layout.pages)?input.layout.pages:
    (input.objects&&Array.isArray(input.objects)?[{width:input.width,height:input.height,objects:input}]:null);
  if(!originalPages?.length||originalPages.length>30)
    throw new Error('Templates must contain between 1 and 30 editable pages.');
  const width=Number(originalPages[0].width||input.width||396);
  const height=Number(originalPages[0].height||input.height||612);
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<36||height<36||
     width>5000||height>5000||width*height>8000000)
    throw new Error('Unsupported canvas size. Use 36–5000 units and under 8 million pixels.');
  const pages=originalPages.map((p,i)=>{
    const w=Number(p.width||width), h=Number(p.height||height);
    if(!Number.isFinite(w)||!Number.isFinite(h)||w<36||h<36||w>5000||h>5000||w*h>8000000)
      throw new Error('Page '+(i+1)+' has an invalid size.');
    const objects=p.objects?.objects?p.objects:
      (Array.isArray(p.objects)?{version:'5.5.2',objects:p.objects}:null);
    if(!objects && !(Array.isArray(p.seed)&&p.seed.length))
      throw new Error('Page '+(i+1)+' has no editable layout. Upload project JSON, not a flat image.');
    if(objects)validateScene(objects);
    return {id:uid('page'),width:w,height:h,background:
      /^#[0-9a-f]{6}$/i.test(p.background||'')?p.background:'#ffffff',
      objects:objects?structuredClone(objects):null,seed:Array.isArray(p.seed)?structuredClone(p.seed):[]};
  });
  const name=cleanText(metadata.name||input.name||input.title||'Imported template',100);
  const category=sanitizeCategory(metadata.category||input.category||'Other');
  const description=cleanText(metadata.description||input.description||'',200);
  const signature=pages.map(p=>({
    width:p.width,height:p.height,background:p.background,
    objects:stripInstanceIds(p.objects),seed:stripInstanceIds(p.seed)
  }));
  const fingerprint=hashContent(JSON.stringify(signature));
  return {
    id:uid('template'),name,category,description,
    keywords:cleanText(metadata.keywords||input.keywords||'',200),
    published:metadata.published===true||metadata.published==='true',
    pages,width,height,fingerprint,thumbnail:sanitizePreview(metadata.thumbnail||input.thumbnail||''),
    sourceName:cleanText(metadata.sourceName||'',100),createdAt:now(),updatedAt:now()
  };
}
function stripInstanceIds(value){
  if(Array.isArray(value))return value.map(stripInstanceIds);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value)
    .filter(([key])=>key!=='id'&&key!=='name')
    .map(([key,item])=>[key,stripInstanceIds(item)]));
  return value;
}
export function hashContent(value){
  let hash=0xcbf29ce484222325n;
  for(let i=0;i<value.length;i++){
    hash^=BigInt(value.charCodeAt(i));
    hash=BigInt.asUintN(64,hash*0x100000001b3n);
  }
  return hash.toString(16).padStart(16,'0');
}
export function designFromTemplate(template) {
  const date=now();
  const pages=structuredClone(template.pages).map(p=>({...p,id:uid('page')}));
  return {id:uid('design'),title:template.name,templateId:template.id,presetId:'custom',
    width:template.width,height:template.height,pages,activePage:0,
    createdAt:date,updatedAt:date,versions:[],settings:{showBleed:false,showMargin:true,dpi:300}};
}
export function templateFromDesign(design,metadata={}) {
  if(!design?.pages?.length)throw new Error('Open a design before saving it as a template.');
  return normalizeTemplate({...design,name:design.title},metadata);
}
export function findDuplicateTemplates(existing,incoming) {
  const known=new Set(existing.map(x=>x.fingerprint));
  const unique=[],duplicates=[];
  for(const template of incoming){
    if(known.has(template.fingerprint))duplicates.push(template);
    else {known.add(template.fingerprint);unique.push(template);}
  }
  return {unique,duplicates};
}
