import { get, set } from 'idb-keyval';
const STORE_KEY = 'sk-studio-designs-v1';
let pending = Promise.resolve();
export async function listDesigns() {
  const data = await get(STORE_KEY);
  return Array.isArray(data) ? data : [];
}
export async function getDesign(id) {
  return (await listDesigns()).find(d=>d.id===id) || null;
}
export async function putDesign(design) {
  pending = pending.catch(()=>{}).then(async()=>{
    const designs = await listDesigns();
    const index=designs.findIndex(d=>d.id===design.id);
    const safe={...design,updatedAt:new Date().toISOString()};
    if(index===-1) designs.unshift(safe); else designs[index]=safe;
    await set(STORE_KEY,designs);
    return safe;
  });
  return pending;
}
export async function removeDesign(id) {
  pending = pending.catch(()=>{}).then(async()=>set(STORE_KEY,(await listDesigns()).filter(d=>d.id!==id)));
  return pending;
}
export async function duplicateDesign(doc,uid) {
  const copy=structuredClone(doc);
  copy.id=uid('design'); copy.title=doc.title+' (copy)';
  copy.pages=copy.pages.map(p=>({...p,id:uid('page')}));
  copy.versions=[];copy.createdAt=new Date().toISOString();
  return putDesign(copy);
}
