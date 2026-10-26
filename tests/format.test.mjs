import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, fillPlaceholders, newDesign, PRESETS } from '../lib/format.mjs';

test('CSV supports quoted commas and escaped quotes',()=>{
  assert.deepEqual(parseCsv('Name,Venue\n"Ram, Jr.","Hall ""A"""\n'),[{Name:'Ram, Jr.',Venue:'Hall "A"'}]);
});
test('CSV rejects unclosed quotes',()=>assert.throws(()=>parseCsv('a\n"oops')));
test('template personalization updates intended fields only',()=>{
  const input={text:'{{Name}}',nested:[{value:'Hi {{Name}}'},{other:'{{Name}}'}]};
  const output=fillPlaceholders(input,{Name:'Asha'});
  assert.equal(output.text,'Asha');assert.equal(output.nested[0].value,'Hi Asha');
  assert.equal(output.nested[1].other,'{{Name}}');
});
test('design has valid pages and print dimensions',()=>{
  const doc=newDesign('royal');
  assert.equal(doc.pages.length,1);
  assert.equal(doc.width,396);
  assert.equal(doc.height,612);
  assert.ok(doc.pages[0].seed.length>0);
  assert.ok(PRESETS.length>=5);
});
