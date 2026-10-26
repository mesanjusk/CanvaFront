import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { importTemplateFiles } from '../lib/template-import.mjs';

function archive(name='Wedding Example',manifest=true){
  const zip=new JSZip();
  zip.file('templates/one.json',JSON.stringify({
    title:name,pages:[{width:396,height:612,background:'#ffffff',
      objects:{objects:[{type:'textbox',text:'Hello',left:30,top:40}]}}]}));
  if(manifest)zip.file('manifest.csv','file,name,category,description\n'+
    'templates/one.json,"'+name+'",Wedding,Printable invitation\n');
  return zip;
}
async function namedBuffer(zip,name='pack.zip'){
  const buffer=await zip.generateAsync({type:'nodebuffer'});
  buffer.name=name;buffer.size=buffer.length;
  return buffer;
}
test('ZIP manifest imports editable layout with category',async()=>{
  const file=await namedBuffer(archive());
  const result=await importTemplateFiles([file]);
  assert.equal(result.templates.length,1);
  assert.equal(result.templates[0].category,'Wedding');
  assert.equal(result.templates[0].name,'Wedding Example');
  assert.equal(result.templates[0].pages[0].objects.objects[0].text,'Hello');
});
test('without manifest, JSON files become templates',async()=>{
  const result=await importTemplateFiles([await namedBuffer(archive('Unlisted',false))]);
  assert.equal(result.templates[0].name,'Unlisted');
});
test('invalid layout is skipped with a clear report',async()=>{
  const zip=archive();
  zip.file('templates/invalid.json',JSON.stringify({pages:[]}));
  zip.file('manifest.csv','file,name\n'+'templates/one.json,Valid\n'+'templates/invalid.json,Invalid\n');
  const result=await importTemplateFiles([await namedBuffer(zip)]);
  assert.equal(result.templates.length,1);
  assert.equal(result.skipped.length,1);
});
test('rejects unsupported file extensions',async()=>{
  const file=Buffer.from('not editable');file.name='flat.png';file.size=file.length;
  await assert.rejects(()=>importTemplateFiles([file]),/Only editable/);
});
