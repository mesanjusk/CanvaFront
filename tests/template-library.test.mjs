import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTemplate, designFromTemplate, findDuplicateTemplates, templateFromDesign,
  sanitizePreview, hashContent } from '../lib/template-library.mjs';
import { newDesign } from '../lib/format.mjs';

function editableText(id='one') {
  return {title:'Wedding invite',pages:[{width:396,height:612,background:'#ffffff',
    objects:{version:'5.5.2',objects:[{type:'textbox',id,text:'Welcome',left:40,top:50,fontSize:25}]}}]};
}
test('normalizes editable project and metadata',()=>{
  const t=normalizeTemplate(editableText(),{name:'Wedding elegant',category:'Wedding',published:false});
  assert.equal(t.name,'Wedding elegant');
  assert.equal(t.category,'Wedding');
  assert.equal(t.pages[0].objects.objects[0].text,'Welcome');
  assert.equal(t.published,false);
  assert.equal(t.fingerprint.length,16);
});
test('layout fingerprint ignores instance IDs and duplicate import is skipped',()=>{
  const a=normalizeTemplate(editableText('a'));
  const b=normalizeTemplate(editableText('b'),{name:'Different title'});
  assert.equal(a.fingerprint,b.fingerprint);
  const result=findDuplicateTemplates([a],[b]);
  assert.equal(result.unique.length,0);
  assert.equal(result.duplicates.length,1);
});
test('creates editable copies without modifying source template',()=>{
  const t=normalizeTemplate(editableText());
  const design=designFromTemplate(t);
  assert.notEqual(design.id,t.id);
  assert.notEqual(design.pages[0].id,t.pages[0].id);
  design.pages[0].objects.objects[0].text='Modified';
  assert.equal(t.pages[0].objects.objects[0].text,'Welcome');
});
test('seed-based projects can become editable templates',()=>{
  const t=templateFromDesign(newDesign('royal'),{category:'Wedding'});
  assert.ok(t.pages[0].seed.length>0);
});
test('invalid layouts and external images are rejected',()=>{
  assert.throws(()=>normalizeTemplate({name:'Image only',pages:[{width:300,height:400}]}));
  assert.throws(()=>normalizeTemplate({pages:[{width:6000,height:4000,objects:{objects:[]}}]}));
  const bad=editableText();bad.pages[0].objects.objects.push({type:'image',src:'https://example.com/pixel.jpg'});
  assert.throws(()=>normalizeTemplate(bad),/External/);
});
test('preview data is restricted to safe raster image data',()=>{
  assert.equal(sanitizePreview('data:image/svg+xml;base64,PHN2Zz4='),'');
  assert.equal(sanitizePreview('https://example.com/x.jpg'),'');
  assert.equal(sanitizePreview('data:image/png;base64,aGVsbG8='),'data:image/png;base64,aGVsbG8=');
});
test('hashContent is stable',()=>assert.equal(hashContent('hello'),hashContent('hello')));
