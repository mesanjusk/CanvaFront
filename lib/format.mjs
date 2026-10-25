export const PRESETS = [
  { id: 'invitation', label: 'Wedding invitation', width: 396, height: 612, unit: 'in', physical: '5.5 × 8.5 in' },
  { id: 'square', label: 'Square card', width: 360, height: 360, unit: 'in', physical: '5 × 5 in' },
  { id: 'instagram', label: 'Instagram post', width: 360, height: 360, unit: 'px', physical: '1080 × 1080 px' },
  { id: 'story', label: 'Social story', width: 360, height: 640, unit: 'px', physical: '1080 × 1920 px' },
  { id: 'a4', label: 'A4 poster', width: 595.28, height: 841.89, unit: 'mm', physical: '210 × 297 mm' },
  { id: 'business', label: 'Business card', width: 252, height: 144, unit: 'in', physical: '3.5 × 2 in' },
  { id: 'banner', label: 'Landscape banner', width: 720, height: 288, unit: 'in', physical: '10 × 4 in' }
];

export const TEMPLATES = [
  { id: 'royal', name: 'Royal Heritage Wedding', category: 'Wedding', preset: 'invitation', tone: 'royal', bg: '#fbf4e9', accent: '#8f4b38', desc: 'Traditional serif invitation with copper details' },
  { id: 'flora', name: 'Garden Mehendi', category: 'Wedding', preset: 'invitation', tone: 'flora', bg: '#edf4e6', accent: '#3e7656', desc: 'Soft floral festive invitation' },
  { id: 'modern', name: 'Modern Minimal Wedding', category: 'Wedding', preset: 'invitation', tone: 'minimal', bg: '#f7f0ef', accent: '#7b4653', desc: 'Elegant restrained typography' },
  { id: 'social', name: 'Seasonal Sale', category: 'Social', preset: 'instagram', tone: 'social', bg: '#ece5fb', accent: '#5b3bbf', desc: 'Editable Instagram campaign' },
  { id: 'certificate', name: 'Achievement Certificate', category: 'Certificate', preset: 'a4', tone: 'certificate', bg: '#f9f6ee', accent: '#a58241', desc: 'Awards and recognition' },
  { id: 'business', name: 'Premium Business Card', category: 'Business', preset: 'business', tone: 'business', bg: '#1d293a', accent: '#dfbc78', desc: 'Modern brand identity' },
  { id: 'label', name: 'Artisan Product Label', category: 'Labels', preset: 'square', tone: 'label', bg: '#fff6e9', accent: '#9c583f', desc: 'Packaging and labels' },
  { id: 'blank', name: 'Blank Design', category: 'Blank', preset: 'invitation', tone: 'blank', bg: '#ffffff', accent: '#6955d6', desc: 'Start with a fresh canvas' }
];

export function uid(prefix = 'id') {
  const r = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return prefix + '_' + r;
}

export function blankPage(width, height, bg = '#ffffff') {
  return { id: uid('page'), width, height, background: bg, objects: null, seed: [] };
}

export function newDesign(templateId = 'blank', preferredPreset) {
  const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[TEMPLATES.length - 1];
  const preset = PRESETS.find(p => p.id === (preferredPreset || template.preset)) || PRESETS[0];
  const now = new Date().toISOString();
  const page = blankPage(preset.width, preset.height, template.bg);
  page.seed = templateId === 'blank' ? [] : createSeed(template, preset.width, preset.height);
  return { id: uid('design'), title: templateId === 'blank' ? 'Untitled design' : template.name,
    templateId, presetId: preset.id, width: preset.width, height: preset.height,
    pages: [page], activePage: 0, createdAt: now, updatedAt: now, versions: [],
    settings: { showBleed: false, showMargin: true, bleedMm: 3, dpi: 300 } };
}

const text = (value, x, y, width, size, color, options = {}) =>
  ({ type: 'text', value, x, y, width, size, color, font: options.font || 'Georgia',
    align: options.align || 'center', weight: options.weight || 'normal',
    italic: options.italic || false });
const rect = (x,y,w,h,color,stroke,rx=0) =>
  ({ type:'rect',x,y,w,h,color,stroke:stroke||null,rx });
const circle = (x,y,r,color,stroke) =>
  ({ type:'circle',x,y,r,color,stroke:stroke||null });

function createSeed(t,w,h) {
  const center = w/2; const a=t.accent;
  if (t.tone === 'royal') return [
    rect(18,18,w-36,h-36,'transparent',a),
    rect(25,25,w-50,h-50,'transparent','#d7b99b'),
    text('✦  SHREE GANESHAY NAMAH  ✦',center-150,56,300,11,a,{font:'Georgia'}),
    text('The Wedding of',center-150,h*.25,300,22,a,{italic:true}),
    text('{{Groom}}',center-160,h*.34,320,39,'#753c2e'),
    text('&',center-50,h*.45,100,20,'#bc916d'),
    text('{{Bride}}',center-160,h*.51,320,39,'#753c2e'),
    text('REQUEST THE PLEASURE OF YOUR COMPANY',center-160,h*.7,320,11,a),
    text('{{Date}}  ·  {{Venue}}',center-165,h*.76,330,13,a)
  ];
  if(t.tone === 'flora') return [
    circle(25,24,20,'#d2e4b6'),circle(w-54,50,35,'#b3cfaa'),
    circle(24,h-80,46,'#bed9b9'),circle(w-70,h-60,27,'#d9e9c7'),
    text('MEHENDI CELEBRATION',center-155,h*.22,310,16,a),
    text('{{Bride}}',center-155,h*.36,310,42,'#2f5f46',{italic:true}),
    text('a day of music, colors & joy',center-155,h*.49,310,15,a,{italic:true}),
    text('{{Date}}',center-155,h*.67,310,20,a),
    text('{{Venue}}',center-155,h*.74,310,14,a)
  ];
  if(t.tone === 'minimal') return [
    rect(28,28,w-56,h-56,'transparent','#cfafaf'),
    text('TOGETHER WITH THEIR FAMILIES',center-150,h*.17,300,11,a),
    text('{{Bride}}',center-150,h*.31,300,38,a),
    text('AND',center-100,h*.42,200,12,'#ae8a8f'),
    text('{{Groom}}',center-150,h*.49,300,38,a),
    text('joyfully invite you',center-150,h*.66,300,17,a,{italic:true}),
    text('{{Date}}  |  {{Venue}}',center-170,h*.76,340,13,a)
  ];
  if(t.tone === 'social') return [
    circle(w*.70,40,100,'#d1befb'),
    rect(18,18,w-36,h-36,'transparent','#ab8ce8'),
    text('SK DIGITAL',25,42,w-50,18,a,{weight:'bold'}),
    text('THE BIG',25,h*.26,w-50,29,'#372866',{weight:'bold'}),
    text('SALE',25,h*.37,w-50,62,a,{weight:'bold'}),
    text('{{Discount}} OFF',25,h*.6,w-50,28,'#372866'),
    text('Limited period • Shop now',25,h*.79,w-50,16,a)
  ];
  if(t.tone === 'certificate') return [
    rect(28,28,w-56,h-56,'transparent',a),
    rect(37,37,w-74,h-74,'transparent','#d8c6a5'),
    text('CERTIFICATE',50,h*.2,w-100,37,a,{weight:'bold'}),
    text('OF ACHIEVEMENT',50,h*.29,w-100,19,'#826f4e'),
    text('This is proudly presented to',50,h*.43,w-100,17,'#716453',{italic:true}),
    text('{{Name}}',50,h*.51,w-100,35,a,{italic:true}),
    text('For outstanding work and dedication',50,h*.64,w-100,18,'#716453'),
    text('{{Date}}',50,h*.77,w-100,14,a)
  ];
  if(t.tone === 'business') return [
    circle(w-65,-35,90,'#354358'),rect(15,15,w-30,h-30,'transparent','#b8985e'),
    text('SK DIGITAL',20,38,w-40,25,a,{weight:'bold'}),
    text('PRINT  •  DESIGN  •  CREATE',20,78,w-40,11,'#f5e5c2'),
    text('{{Phone}}  |  {{Website}}',20,h-40,w-40,11,'#f5e5c2')
  ];
  if(t.tone === 'label') return [
    rect(17,17,w-34,h-34,'transparent',a),
    circle(w/2-47,42,47,'#f0dac4'),
    text('ARTISAN COLLECTION',26,h*.32,w-52,14,a),
    text('{{Product}}',26,h*.45,w-52,39,'#73422f'),
    text('Made with love',26,h*.64,w-52,17,a,{italic:true}),
    text('SK DIGITAL',26,h*.78,w-52,13,a)
  ];
  return [];
}

export function parseCsv(csv) {
  const rows = []; let row=[], cell='', quoted=false;
  for(let i=0;i<csv.length;i++) {
    const c=csv[i];
    if(c==='"') { if(quoted && csv[i+1]==='"'){cell+='"';i++;}else quoted=!quoted; }
    else if(c===',' && !quoted) { row.push(cell);cell=''; }
    else if((c==='\n'||c==='\r') && !quoted) {
      if(c==='\r'&&csv[i+1]==='\n') i++;
      row.push(cell); cell='';
      if(row.some(x=>x.trim())) rows.push(row);
      row=[];
    } else cell+=c;
  }
  if(quoted) throw new Error('CSV has an unclosed quoted field');
  row.push(cell); if(row.some(x=>x.trim())) rows.push(row);
  if(!rows.length) return [];
  const header=rows.shift().map((x,i)=>i===0?x.replace(/^\uFEFF/,'').trim():x.trim());
  if(header.some(x=>!x)) throw new Error('Every CSV header needs a field name');
  return rows.map(values=>Object.fromEntries(header.map((name,i)=>[name,(values[i]||'').trim()])));
}

export function fillPlaceholders(node, data) {
  if(Array.isArray(node)) return node.map(x=>fillPlaceholders(x,data));
  if(node && typeof node==='object') return Object.fromEntries(
    Object.entries(node).map(([key,val])=>[key,(key==='text'||key==='value') && typeof val==='string'
      ? val.replace(/\{\{\s*([^}]+?)\s*\}\}/g,(match,k)=>Object.prototype.hasOwnProperty.call(data,k)?data[k]:match)
      :fillPlaceholders(val,data)])
  );
  return node;
}

export function formatDate(value) {
  if(!value) return 'Just now';
  try { return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value)); }
  catch { return 'Recently'; }
}
