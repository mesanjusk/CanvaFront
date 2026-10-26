import { get, set } from 'idb-keyval';
const KEY='sk-studio-custom-templates-v1';
let queue=Promise.resolve();
const serialize=(work)=>{
  queue=queue.catch(()=>{}).then(work);
  return queue;
};
export async function listCustomTemplates(){
  const value=await get(KEY);
  return Array.isArray(value)?value:[];
}
export async function addCustomTemplates(items){
  return serialize(async()=>{
    const existing=await listCustomTemplates();
    const byId=new Map(existing.map(t=>[t.id,t]));
    for(const item of items)byId.set(item.id,item);
    const result=[...byId.values()];
    await set(KEY,result);
    return result;
  });
}
export async function updateCustomTemplates(ids,change){
  const wanted=new Set(ids);
  return serialize(async()=>{
    const updated=(await listCustomTemplates()).map(item=>
      wanted.has(item.id)?{...item,...change,id:item.id,updatedAt:new Date().toISOString()}:item);
    await set(KEY,updated);
    return updated;
  });
}
export async function removeCustomTemplates(ids){
  const wanted=new Set(ids);
  return serialize(async()=>{
    const updated=(await listCustomTemplates()).filter(item=>!wanted.has(item.id));
    await set(KEY,updated);
    return updated;
  });
}
