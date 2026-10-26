"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutTemplate, Shapes, Type, Upload, Layers3, Sparkles, FolderOpen, Search,
  Download, ChevronLeft, Plus, Undo2, Redo2, Copy, Trash2, Settings2,
  FilePlus2, Grid2X2, X, Palette, ZoomIn, ZoomOut, MoveUp, MoveDown, FileText,
  AlignCenter, AlignVerticalJustifyCenter, PenTool, RotateCcw, Check, Menu,
  ImagePlus, Printer, Database, Save, MoreHorizontal, FileUp, Eye, Pencil,
  WandSparkles, ArrowRight, ChevronDown, ShieldCheck
} from 'lucide-react';
import { EditorCanvas } from '@/components/EditorCanvas';
import { TEMPLATES, PRESETS, blankPage, newDesign, uid, parseCsv, fillPlaceholders, formatDate } from '@/lib/format.mjs';
import { listDesigns, getDesign, putDesign, removeDesign, duplicateDesign } from '@/lib/storage';
import { exportDocument, downloadBlob } from '@/lib/exporter';
import { listCustomTemplates, addCustomTemplates } from '@/lib/template-storage';
import { templateFromDesign, designFromTemplate, findDuplicateTemplates, TEMPLATE_CATEGORIES } from '@/lib/template-library.mjs';
import { generateThumbnail } from '@/lib/template-import.mjs';

const tools=[
  {id:'templates',icon:LayoutTemplate,label:'Templates'},
  {id:'text',icon:Type,label:'Text'},
  {id:'elements',icon:Shapes,label:'Elements'},
  {id:'uploads',icon:Upload,label:'Uploads'},
  {id:'layers',icon:Layers3,label:'Layers'},
  {id:'bulk',icon:WandSparkles,label:'Bulk Create'}
];
const baseCategories=['All','Wedding','Social','Certificate','Business','Labels','Blank'];

function getPreset(id){return PRESETS.find(p=>p.id===id)||PRESETS[0];}
function initials(title){return (title||'SK').split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase();}
function TemplateArt({template,compact=false}){
  if(template.thumbnail)return <div className={'template-art uploaded-thumbnail '+(compact?'compact':'')}>
    <img src={template.thumbnail} alt={template.name+' preview'}/></div>;
  return <div className={`template-art template-${template.tone} ${compact?'compact':''}`}
    style={{'--template-bg':template.bg,'--template-accent':template.accent}}>
    <div className="template-frame">
      <span className="template-decoration">✦</span>
      {template.tone==='royal'&&<small>THE WEDDING OF</small>}
      {template.tone==='flora'&&<small>A JOYFUL CELEBRATION</small>}
      {template.tone==='certificate'&&<small>CERTIFICATE OF</small>}
      {template.tone==='business'&&<small>SK DIGITAL</small>}
      {template.tone==='social'&&<small>SK DIGITAL SALE</small>}
      <strong>{template.tone==='royal'?'Anaya & Aarav':template.tone==='flora'?'Mehendi':template.tone==='minimal'?'Love, Always':template.tone==='social'?'BIG SALE':template.tone==='certificate'?'Achievement':template.tone==='business'?'Design & Print':template.tone==='label'?'Artisan': 'Your design'}</strong>
      <span className="template-ornament">◆ ─ ◆</span>
      <small>{template.tone==='social'?'SHOP NOW':'MADE WITH LOVE'}</small>
    </div>
  </div>;
}
function Modal({title,onClose,children,wide=false}){
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
    <section className={'modal '+(wide?'modal-wide':'')} role="dialog" aria-modal="true" aria-label={title}>
      <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19}/></button></header>
      {children}
    </section>
  </div>;
}
function StarterButton({icon:Icon,label,onClick}){return <button className="starter-btn" onClick={onClick}><Icon size={18}/>{label}</button>;}

export default function Studio({initialDesignId}){
  const router=useRouter();
  const canvasRef=useRef(null);
  const uploadInput=useRef(null);const projectInput=useRef(null);const bulkInput=useRef(null);
  const [docs,setDocs]=useState([]);
  const [customTemplates,setCustomTemplates]=useState([]);
  const [doc,setDoc]=useState(null);
  const [busy,setBusy]=useState(true);
  const [saveStatus,setSaveStatus]=useState('Saved');
  const [category,setCategory]=useState('All');
  const [search,setSearch]=useState('');
  const [tool,setTool]=useState('templates');
  const [panelVisible,setPanelVisible]=useState(true);
  const [selection,setSelection]=useState(null);
  const [historyState,setHistoryState]=useState({canUndo:false,canRedo:false});
  const [zoom,setZoom]=useState(.88);
  const [modal,setModal]=useState('');
  const [exportFormat,setExportFormat]=useState('pdf');
  const [exportDpi,setExportDpi]=useState(300);
  const [exportScope,setExportScope]=useState('all');
  const [exportTransparent,setExportTransparent]=useState(false);
  const [notification,setNotification]=useState('');
  const [drawing,setDrawing]=useState(false);
  const [customWidth,setCustomWidth]=useState(5.5);
  const [customHeight,setCustomHeight]=useState(8.5);
  const [menuOpen,setMenuOpen]=useState(false);
  const [templateName,setTemplateName]=useState('');
  const [templateCategory,setTemplateCategory]=useState('Wedding');
  const [templateDescription,setTemplateDescription]=useState('');
  const [templatePublished,setTemplatePublished]=useState(false);

  const refresh=useCallback(async()=>{
    try{
      const [designs,templates]=await Promise.all([listDesigns(),listCustomTemplates()]);
      setDocs(designs.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)));
      setCustomTemplates(templates);
    }catch{setNotification('Browser storage is unavailable. Check private browsing settings.');}
  },[]);
  useEffect(()=>{
    let mounted=true;
    (async()=>{
      await refresh();
      if(initialDesignId){
        try{
          const found=await getDesign(initialDesignId);
          if(mounted){if(found)setDoc(found);else setNotification('Design not found on this device.');}
        }catch{if(mounted)setNotification('Unable to read saved design.');}
      } else if(mounted)setDoc(null);
      if(mounted)setBusy(false);
    })();
    return()=>{mounted=false;};
  },[initialDesignId,refresh]);

  useEffect(()=>{
    if(!doc)return;
    setSaveStatus('Saving…');
    const timer=setTimeout(()=>{
      putDesign(doc).then(()=>setSaveStatus('All changes saved')).catch(()=>{
        setSaveStatus('Save failed');setNotification('Could not save. Export a project backup before leaving.');
      });
    },650);
    return()=>clearTimeout(timer);
  },[doc]);

  useEffect(()=>{
    if(!notification)return;
    const timer=setTimeout(()=>setNotification(''),5000);
    return()=>clearTimeout(timer);
  },[notification]);

  const updateDoc=useCallback((fn)=>{
    setDoc(previous=>{
      if(!previous)return previous;
      const next=fn(previous);
      return {...next,updatedAt:new Date().toISOString()};
    });
  },[]);

  const page=doc?.pages?.[doc.activePage||0];
  const applyCurrentCanvas=(draft)=>{
    if(!draft)return draft;
    const json=canvasRef.current?.serialize();
    if(!json)return draft;
    const pages=draft.pages.map((p,i)=>i===draft.activePage?{...p,objects:json,seed:[]}:p);
    return {...draft,pages};
  };
  const pageChanged=useCallback((json)=>{
    updateDoc(previous=>({
      ...previous,pages:previous.pages.map((p,i)=>i===previous.activePage?{...p,objects:json,seed:[]}:p)
    }));
  },[updateDoc]);

  async function create(template='blank',preset){
    try{
      const custom=customTemplates.find(t=>t.id===template);
      const next=custom?designFromTemplate(custom):newDesign(template,preset);
      await putDesign(next);
      router.push('/editor/'+next.id);
    }catch{setNotification('Failed to create design. Please check browser storage.');}
  }
  async function openDesign(id){
    if(doc)await putDesign(applyCurrentCanvas(doc));
    router.push('/editor/'+id);
  }
  async function backToProjects(){
    if(doc)await putDesign(applyCurrentCanvas(doc));
    setDoc(null);await refresh();router.push('/');
  }
  async function deleteDesign(target){
    if(!window.confirm('Delete this design from this browser? This cannot be undone.'))return;
    await removeDesign(target.id);await refresh();
    if(doc?.id===target.id)await backToProjects();
    setNotification('Design deleted');
  }
  async function duplicate(target){
    const clone=await duplicateDesign(target,uid);await refresh();setNotification('Design duplicated');
    if(doc?.id===target.id)router.push('/editor/'+clone.id);
  }
  async function importProject(e){
    const file=e.target.files?.[0];if(!file)return;
    try{
      const json=JSON.parse(await file.text());
      if(!Array.isArray(json.pages)||!json.pages.length||typeof json.title!=='string')throw new Error('Invalid project');
      const clean={...json,id:uid('design'),title:json.title+' (imported)',createdAt:new Date().toISOString(),
        pages:json.pages.map(p=>({...p,id:uid('page')})),versions:[]};
      await putDesign(clean);await refresh();router.push('/editor/'+clean.id);
      setNotification('Project imported');
    }catch{setNotification('Invalid design JSON. Choose a SK Design Studio project backup.');}
    e.target.value='';
  }
  function backupProject(){
    if(!doc)return;
    const active=applyCurrentCanvas(doc);
    downloadBlob(new Blob([JSON.stringify(active,null,2)],{type:'application/json'}),doc.title.replace(/[^a-z0-9 ]/gi,'')+'.skdesign.json');
    setNotification('Editable project backup downloaded');
  }
  async function exportNow(){
    if(!doc)return;
    const active=applyCurrentCanvas(doc);
    setModal('working');
    try{
      await exportDocument(active,exportFormat,exportDpi,exportScope,exportTransparent);
      setNotification('Export ready — check your downloads');
      setModal('');
    }catch(error){setNotification(error.message||'Export failed');setModal('export');}
  }
  function selectPage(index){
    updateDoc(d=>({...applyCurrentCanvas(d),activePage:index}));
    setSelection(null);setHistoryState({canUndo:false,canRedo:false});
  }
  function addPage(){
    updateDoc(d=>{
      const saved=applyCurrentCanvas(d);
      return {...saved,pages:[...saved.pages,blankPage(d.width,d.height,d.pages[d.activePage]?.background||'#ffffff')],
        activePage:saved.pages.length};
    });
  }
  function duplicatePage(){
    updateDoc(d=>{
      const saved=applyCurrentCanvas(d);
      const target=structuredClone(saved.pages[saved.activePage]);
      target.id=uid('page');const pages=[...saved.pages];
      pages.splice(saved.activePage+1,0,target);
      return {...saved,pages,activePage:saved.activePage+1};
    });
  }
  function removePage(){
    if(doc.pages.length<2){setNotification('Keep at least one page');return;}
    updateDoc(d=>{
      const saved=applyCurrentCanvas(d);const pages=[...saved.pages];
      pages.splice(saved.activePage,1);
      return {...saved,pages,activePage:Math.max(0,Math.min(saved.activePage,pages.length-1))};
    });
  }
  function movePage(direction){
    updateDoc(d=>{
      const saved=applyCurrentCanvas(d);const from=saved.activePage,to=from+direction;
      if(to<0||to>=saved.pages.length)return saved;
      const pages=[...saved.pages];[pages[from],pages[to]]=[pages[to],pages[from]];
      return {...saved,pages,activePage:to};
    });
  }
  function makeVersion(){
    updateDoc(d=>{
      const saved=applyCurrentCanvas(d);
      const versions=[...(saved.versions||[]),{id:uid('version'),title:'Manual checkpoint',
        date:new Date().toISOString(),pages:structuredClone(saved.pages)}].slice(-20);
      return {...saved,versions};
    });
    setNotification('Version saved');
  }
  function restoreVersion(version){
    if(!window.confirm('Restore this version? Save a backup first if you need current changes.'))return;
    updateDoc(d=>({...d,pages:structuredClone(version.pages),activePage:0}));
    setModal('');setNotification('Version restored');
  }
  async function bulkGenerate(e){
    const file=e.target.files?.[0];if(!file||!doc)return;
    try{
      const rows=parseCsv(await file.text());
      if(!rows.length)throw new Error('CSV has no data rows');
      if(rows.length>300)throw new Error('Maximum 300 rows per batch');
      const base=applyCurrentCanvas(doc);
      for(let i=0;i<rows.length;i++){
        const copy=structuredClone(base);
        copy.id=uid('design');copy.title=base.title+' — '+(rows[i].Name||rows[i].name||i+1);
        copy.createdAt=new Date().toISOString();copy.updatedAt=copy.createdAt;copy.versions=[];
        copy.pages=copy.pages.map(p=>({...p,id:uid('page'),
          objects:fillPlaceholders(p.objects,rows[i]),seed:fillPlaceholders(p.seed,rows[i])}));
        await putDesign(copy);
      }
      setNotification(rows.length+' personalized designs created. Find them in Projects.');
    }catch(error){setNotification(error.message||'Bulk create failed');}
    e.target.value='';
  }
  function changePageBackground(color){
    updateDoc(d=>({...d,pages:d.pages.map((p,i)=>i===d.activePage?{...p,background:color}:p)}));
    const c=canvasRef.current?.getCanvas();if(c){c.setBackgroundColor(color,()=>c.renderAll());}
  }
  function changePreset(preset){
    updateDoc(d=>{
      const saved=applyCurrentCanvas(d);
      return {...saved,presetId:preset.id,width:preset.width,height:preset.height,
        pages:saved.pages.map(p=>({...p,width:preset.width,height:preset.height}))};
    });
    setModal('');
    setNotification('Page size updated. Existing elements keep their positions.');
  }

  function openSaveTemplate(){
    const linked=customTemplates.find(t=>t.id===doc?.templateId);
    const starter=TEMPLATES.find(t=>t.id===doc?.templateId);
    setTemplateName(linked?.name||doc?.title||'Untitled template');
    setTemplateCategory(linked?.category||starter?.category||'Wedding');
    setTemplateDescription(linked?.description||'');
    setTemplatePublished(!!linked?.published);
    setModal('save-template');
  }
  async function saveTemplate(){
    if(!templateName.trim())return setNotification('Enter a template name.');
    setModal('saving-template');
    try{
      const snapshot=applyCurrentCanvas(doc);
      const template=templateFromDesign(snapshot,{name:templateName,category:templateCategory,
        description:templateDescription,published:templatePublished});
      const linked=customTemplates.find(t=>t.id===doc.templateId);
      if(linked){
        template.id=linked.id;
        template.createdAt=linked.createdAt;
      }else{
        const {duplicates}=findDuplicateTemplates(customTemplates,[template]);
        if(duplicates.length)throw new Error('This layout is already in your template library.');
      }
      template.thumbnail=await generateThumbnail(template);
      await addCustomTemplates([template]);
      await refresh();
      if(!linked)updateDoc(d=>({...d,templateId:template.id}));
      setNotification(linked?'Template updated successfully.':'Editable template saved to your local library.');
      setModal('');
    }catch(error){
      setModal('save-template');
      setNotification(error.message||'Unable to save template.');
    }
  }

  const availableTemplates=[...TEMPLATES,...customTemplates.filter(t=>t.published).map(t=>({
    ...t,desc:t.description||'Editable uploaded template',tone:'custom',bg:t.pages?.[0]?.background||'#f5f0ff',accent:'#7158c1'
  }))];
  const categories=[...new Set([...baseCategories,...availableTemplates.map(t=>t.category)])];
  const selectedTemplates=availableTemplates.filter(t=>(category==='All'||t.category===category) &&
    (t.name+' '+(t.desc||'')).toLowerCase().includes(search.toLowerCase()));
  const selectedDocs=docs.filter(d=>d.title.toLowerCase().includes(search.toLowerCase()));

  if(busy)return <div className="app-loading"><div className="loading-orbit"/><span>Preparing your studio…</span></div>;

  if(!doc){
    return <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="brand"><span className="brand-mark">S</span><span><strong>SK Design Studio</strong><small>Creative workspace</small></span></div>
        <div className="dash-side-links">
          <button className="active"><Grid2X2 size={19}/> Home</button>
          <button onClick={()=>document.querySelector('#projects')?.scrollIntoView({behavior:'smooth'})}><FolderOpen size={19}/> Your projects</button>
          <button onClick={()=>document.querySelector('#templates')?.scrollIntoView({behavior:'smooth'})}><LayoutTemplate size={19}/> Templates</button>
          <button onClick={()=>projectInput.current?.click()}><FileUp size={19}/> Import project</button>
          <button onClick={()=>router.push('/admin/templates')}><LayoutTemplate size={19}/> Template Manager</button>
        </div>
        <div className="sidebar-info"><ShieldCheck size={18}/><div><strong>Local-first privacy</strong><p>Designs stay in this browser. Export backups for safekeeping.</p></div></div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="search-box"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates and your designs…" aria-label="Search designs"/></div>
          <span className="workspace-tag"><span className="online-dot"/> My workspace</span>
        </header>
        <section className="hero">
          <div className="hero-copy"><span className="eyebrow">YOUR CREATIVE SPACE</span><h1>What will you <em>create</em> today?</h1>
            <p>Beautiful designs for life's big moments, your growing brand, and everything in between.</p>
            <button className="primary-btn" onClick={()=>setModal('create')}><Plus size={19}/> Create a design</button></div>
          <div className="hero-art"><div className="hero-card card-back"><span>✺</span><strong>CREATE</strong></div>
            <div className="hero-card card-front"><span>✦</span><strong>Made with love</strong><small>INVITATIONS • PRINT • DIGITAL</small></div></div>
        </section>
        <section id="projects" className="content-section">
          <div className="section-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Recent designs</h2></div>
            <button className="text-button" onClick={()=>projectInput.current?.click()}><FileUp size={16}/> Import backup</button></div>
          {selectedDocs.length?<div className="project-grid">
            {selectedDocs.slice(0,16).map(item=><div className="project-card" key={item.id}>
              <button className="project-preview" onClick={()=>openDesign(item.id)}>
                <div className="project-cover"><span className="project-monogram">{initials(item.title)}</span><span className="project-mini-line"/><span className="project-mini-line short"/></div>
                <span className="project-badge">{item.pages.length} page{item.pages.length!==1?'s':''}</span></button>
              <div className="project-details"><div><strong title={item.title}>{item.title}</strong><small>Edited {formatDate(item.updatedAt)}</small></div>
                <div className="project-actions"><button className="icon-btn" onClick={()=>duplicate(item)} title="Duplicate"><Copy size={17}/></button>
                  <button className="icon-btn danger-hover" onClick={()=>deleteDesign(item)} title="Delete"><Trash2 size={17}/></button></div></div>
            </div>)}
          </div>:<div className="empty-state"><FolderOpen size={35}/><strong>No saved designs yet</strong><p>Start from a template or create a blank canvas.</p>
            <button className="secondary-btn" onClick={()=>setModal('create')}><Plus size={17}/> New design</button></div>}
        </section>
        <section id="templates" className="content-section">
          <div className="section-heading"><div><span className="eyebrow">MADE TO INSPIRE</span><h2>Explore templates</h2></div>
            <button className="text-button" onClick={()=>router.push('/admin/templates')}><FileUp size={16}/> Bulk upload templates</button></div>
          <div className="category-tabs">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
          <div className="template-grid">{selectedTemplates.map(t=><button className="template-card" key={t.id} onClick={()=>create(t.id)}>
            <TemplateArt template={t}/><strong>{t.name}</strong><small>{t.desc}</small></button>)}</div>
        </section>
        <footer className="dashboard-footer">SK Design Studio · Original design workspace for SK Digital</footer>
      </main>
      <input ref={projectInput} hidden type="file" accept=".json" onChange={importProject}/>
      {modal==='create'&&<Modal title="Create a new design" onClose={()=>setModal('')}>
        <p className="modal-description">Choose a popular size or start with a custom canvas.</p>
        <div className="preset-grid">{PRESETS.map(p=><button className="preset-option" key={p.id} onClick={()=>create('blank',p.id)}><FileText size={20}/><strong>{p.label}</strong><small>{p.physical}</small></button>)}</div>
        <div className="custom-size"><strong>Custom size (inches)</strong><input type="number" min=".5" max="60" step=".25" value={customWidth} onChange={e=>setCustomWidth(e.target.value)}/>
          <span>×</span><input type="number" min=".5" max="60" step=".25" value={customHeight} onChange={e=>setCustomHeight(e.target.value)}/>
          <button className="secondary-btn" onClick={async()=>{
            const w=Number(customWidth)*72,h=Number(customHeight)*72;
            if(!(w>0&&h>0&&w<=5000&&h<=5000)){setNotification('Enter dimensions between 0.5 and 60 inches.');return;}
            const next=newDesign('blank');next.width=w;next.height=h;next.presetId='custom';
            next.pages=[blankPage(w,h)];await putDesign(next);router.push('/editor/'+next.id);
          }}>Create</button></div>
      </Modal>}
      {notification&&<div className="toast"><Check size={17}/>{notification}</div>}
    </div>;
  }

  return <div className="studio-shell">
    <header className="editor-topbar">
      <div className="editor-brandline"><button className="icon-btn" title="Back to projects" onClick={backToProjects}><ChevronLeft size={21}/></button>
        <span className="brand-mark small">S</span><div className="title-input-wrap"><input value={doc.title} onChange={e=>updateDoc(d=>({...d,title:e.target.value}))} aria-label="Design title"/><small>{saveStatus}</small></div></div>
      <div className="editor-actions"><button className="icon-btn" title="Undo" disabled={!historyState.canUndo} onClick={()=>canvasRef.current?.action('undo')}><Undo2 size={19}/></button>
        <button className="icon-btn" title="Redo" disabled={!historyState.canRedo} onClick={()=>canvasRef.current?.action('redo')}><Redo2 size={19}/></button>
        <span className="topbar-separator"/><button className="topbar-text-btn" onClick={()=>openSaveTemplate()}><FilePlus2 size={17}/><span>Save template</span></button>
        <button className="topbar-text-btn" onClick={makeVersion}><Save size={17}/><span>Save version</span></button>
        <button className="topbar-text-btn" onClick={()=>setModal('versions')}><RotateCcw size={17}/><span>History</span></button>
        <button className="primary-btn export-trigger" onClick={()=>setModal('export')}><Download size={17}/> Export</button></div>
    </header>
    <div className="studio-layout">
      <nav className="editor-rail" aria-label="Design tools">
        {tools.map(t=><button key={t.id} className={tool===t.id&&panelVisible?'active':''} onClick={()=>{setTool(t.id);setPanelVisible(true);}} title={t.label}>
          <t.icon size={21}/><span>{t.label}</span></button>)}
        <button className="rail-bottom" title="Project settings" onClick={()=>setModal('settings')}><Settings2 size={20}/><span>Settings</span></button>
      </nav>
      {panelVisible&&<aside className="tool-panel">
        <div className="panel-heading"><h3>{tools.find(t=>t.id===tool)?.label}</h3><button className="icon-btn" title="Close panel" onClick={()=>setPanelVisible(false)}><X size={17}/></button></div>
        {tool==='templates'&&<div className="panel-scroll">
          <p className="panel-subtitle">Change the visual starting point. Your current design stays safe in your saved project.</p>
          <div className="sidebar-template-grid">{availableTemplates.filter(t=>t.id!=='blank').map(t=><button key={t.id} className="sidebar-template" onClick={()=>setModal('replace-template')}>
            <TemplateArt template={t} compact/><span>{t.name}</span></button>)}</div>
          <button className="sidebar-outline-btn" onClick={()=>{setModal('replace-template');}}>Use another template</button>
        </div>}
        {tool==='text'&&<div className="panel-scroll">
          <button className="panel-add-heading" onClick={()=>canvasRef.current?.addText('Add a heading')}>Add a heading</button>
          <button className="panel-add-subheading" onClick={()=>canvasRef.current?.addText('Add a subheading')}>Add a subheading</button>
          <button className="panel-add-body" onClick={()=>canvasRef.current?.addText('Add your body text')}>Add a little bit of body text</button>
          <p className="panel-hint">Double-click any text on the page to edit it directly.</p>
        </div>}
        {tool==='elements'&&<div className="panel-scroll"><p className="panel-subtitle">Shapes and drawing</p>
          <div className="elements-grid">
            <button onClick={()=>canvasRef.current?.addShape('rect')}><span className="shape-preview rectangle"/>Rectangle</button>
            <button onClick={()=>canvasRef.current?.addShape('circle')}><span className="shape-preview circle"/>Circle</button>
            <button onClick={()=>canvasRef.current?.addShape('triangle')}><span className="shape-preview triangle"/>Triangle</button>
            <button onClick={()=>canvasRef.current?.addShape('line')}><span className="shape-preview line"/>Line</button>
          </div>
          <button className={'sidebar-outline-btn '+(drawing?'selected':'')} onClick={()=>{const next=!drawing;setDrawing(next);canvasRef.current?.toggleDraw(next);}}>
            <PenTool size={17}/>{drawing?'Stop drawing':'Freehand draw'}</button>
          <p className="panel-hint">Drag the corners to resize. Shift-click to select multiple objects.</p>
        </div>}
        {tool==='uploads'&&<div className="panel-scroll"><div className="upload-drop"><ImagePlus size={32}/><strong>Your images, your designs</strong>
          <p>Upload PNG, JPEG, WebP and other browser-supported images.</p>
          <button className="secondary-btn" onClick={()=>uploadInput.current?.click()}><Upload size={16}/> Upload image</button></div>
          <p className="panel-hint">Uploads are embedded in your local project. Keep backups of large print files.</p></div>}
        {tool==='layers'&&<div className="panel-scroll">
          <p className="panel-subtitle">Front-to-back order</p>
          {(selection?.layers||[]).length?(selection.layers.map((l,i)=><button className={'layer-row '+(selection.id===l.id?'active':'')} key={l.id||i} onClick={()=>canvasRef.current?.selectById(l.id)}>
            <Layers3 size={16}/><span>{l.name||l.type}</span>{selection.id===l.id&&<Check size={14}/>}</button>)):
            <p className="panel-hint">Add objects to see the layer stack.</p>}
        </div>}
        {tool==='bulk'&&<div className="panel-scroll"><div className="bulk-explainer"><WandSparkles size={27}/><h4>One design. Hundreds of names.</h4>
          <p>Add placeholders like <code>{'{{Name}}'}</code> or <code>{'{{Venue}}'}</code> to text, then upload a CSV file with matching columns.</p>
          <p>Every CSV row becomes a separate, editable design in Projects.</p>
          <button className="primary-btn" onClick={()=>bulkInput.current?.click()}><FileUp size={17}/> Upload CSV</button>
          <small>Up to 300 rows per batch. Data stays on this device.</small></div></div>}
      </aside>}
      <main className="editor-main">
        <div className="editor-contextbar">
          <div className="context-left"><button className="context-pill" onClick={()=>setModal('settings')}><FileText size={16}/>{getPreset(doc.presetId).physical} <ChevronDown size={14}/></button>
            <button className="context-pill" onClick={()=>updateDoc(d=>({...d,settings:{...d.settings,showMargin:!d.settings?.showMargin}}))}>
              <Eye size={16}/> Guides {doc.settings?.showMargin?'on':'off'}</button></div>
          <div className="context-right"><button className="icon-btn" onClick={()=>setZoom(z=>Math.max(.3,Math.round((z-.1)*10)/10))} title="Zoom out"><ZoomOut size={18}/></button>
            <span className="zoom-number">{Math.round(zoom*100)}%</span>
            <button className="icon-btn" onClick={()=>setZoom(z=>Math.min(2,Math.round((z+.1)*10)/10))} title="Zoom in"><ZoomIn size={18}/></button></div>
        </div>
        <div className="canvas-workspace"><div className="canvas-stage">
          {page&&<EditorCanvas key={page.id+'-'+page.width+'-'+page.height} ref={canvasRef}
            page={page} scale={zoom} showMargin={!!doc.settings?.showMargin} showBleed={!!doc.settings?.showBleed}
            onPageChange={pageChanged} onSelection={setSelection} onHistory={setHistoryState}/>}
          <span className="page-indicator">Page {(doc.activePage||0)+1} of {doc.pages.length}</span></div></div>
        <div className="pages-strip"><div className="pages-strip-heading"><span>Pages</span><div>
          <button className="icon-btn" onClick={()=>movePage(-1)} title="Move page left"><MoveUp size={16}/></button>
          <button className="icon-btn" onClick={()=>movePage(1)} title="Move page right"><MoveDown size={16}/></button>
          <button className="icon-btn" onClick={duplicatePage} title="Duplicate page"><Copy size={16}/></button>
          <button className="icon-btn" onClick={removePage} title="Delete page"><Trash2 size={16}/></button></div></div>
          <div className="page-thumbnails">{doc.pages.map((p,i)=><button key={p.id} className={'page-thumb '+(i===doc.activePage?'active':'')}
            onClick={()=>selectPage(i)}><span className="thumb-paper" style={{background:p.background}}><span>{i+1}</span></span><small>{i+1}</small></button>)}
            <button className="add-page-btn" onClick={addPage}><Plus size={19}/><span>Add page</span></button></div>
        </div>
      </main>
      <aside className="inspector"><div className="panel-heading"><h3>{selection?.id?'Edit element':'Design settings'}</h3><Palette size={18}/></div>
        <div className="inspector-content">
          {selection?.id?<><div className="form-field"><label>Element</label><span className="selected-name">{selection.name||selection.type}</span></div>
            {(selection.type==='i-text'||selection.type==='textbox'||selection.type==='text')&&<>
              <div className="form-field"><label>Text</label><textarea rows={3} value={selection.text} onChange={e=>canvasRef.current?.setProperty('text',e.target.value)}/></div>
              <div className="form-field"><label>Font</label><select value={selection.fontFamily} onChange={e=>canvasRef.current?.setProperty('fontFamily',e.target.value)}>
                {['Georgia','Arial','Times New Roman','Verdana','Trebuchet MS','Courier New','Impact'].map(f=><option key={f}>{f}</option>)}</select></div>
              <div className="form-field"><label>Font size</label><input type="number" min="5" max="300" value={Math.round(selection.fontSize)} onChange={e=>canvasRef.current?.setProperty('fontSize',e.target.value)}/></div>
            </>}
            {typeof selection.fill==='string'&&<div className="form-field"><label>Fill color</label><div className="color-row"><input type="color" value={/^#[0-9A-F]{6}$/i.test(selection.fill)?selection.fill:'#ffffff'} onChange={e=>canvasRef.current?.setProperty('fill',e.target.value)}/><span>{selection.fill}</span></div></div>}
            <div className="form-field"><label>Opacity <span>{Math.round(selection.opacity*100)}%</span></label><input type="range" min="0" max="1" step=".05" value={selection.opacity} onChange={e=>canvasRef.current?.setProperty('opacity',e.target.value)}/></div>
            <div className="form-field"><label>Rotation (degrees)</label><input type="number" min="-360" max="360" value={Math.round(selection.angle)} onChange={e=>canvasRef.current?.setProperty('angle',e.target.value)}/></div>
            <div className="form-field"><label>Arrange</label><div className="inspector-btn-grid">
              <button onClick={()=>canvasRef.current?.action('forward')}><MoveUp size={16}/> Forward</button>
              <button onClick={()=>canvasRef.current?.action('backward')}><MoveDown size={16}/> Backward</button>
              <button onClick={()=>canvasRef.current?.action('centerH')}><AlignCenter size={16}/> Center H</button>
              <button onClick={()=>canvasRef.current?.action('centerV')}><AlignVerticalJustifyCenter size={16}/> Center V</button>
              <button onClick={()=>canvasRef.current?.action('duplicate')}><Copy size={16}/> Duplicate</button>
              <button className="danger-hover" onClick={()=>canvasRef.current?.action('delete')}><Trash2 size={16}/> Delete</button>
            </div></div>
          </>:<>
            <div className="form-field"><label>Page background</label><div className="color-row"><input type="color" value={page.background||'#ffffff'} onChange={e=>changePageBackground(e.target.value)}/><span>{page.background||'#ffffff'}</span></div></div>
            <div className="form-field"><label>Page size</label><button className="settings-choice" onClick={()=>setModal('settings')}><FileText size={17}/>{getPreset(doc.presetId).physical}<ChevronDown size={15}/></button></div>
            <div className="inspector-hint"><Printer size={19}/><strong>Print ready workspace</strong><p>Use guides to protect important text from trims. Choose 300 DPI PDF for print proofs.</p></div>
            <StarterButton icon={Download} label="Download editable backup" onClick={backupProject}/>
          </>}
        </div>
      </aside>
    </div>
    <input ref={uploadInput} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0];if(f){canvasRef.current?.uploadImage(f);setTool('uploads');}e.target.value='';}}/>
    <input ref={bulkInput} type="file" accept=".csv,text/csv" hidden onChange={bulkGenerate}/>
    {modal==='export'&&<Modal title="Export your design" onClose={()=>setModal('')}>
      <p className="modal-description">Download a high-quality file. PDFs support all pages; PNG/JPG/SVG export the first selected page.</p>
      <div className="form-field"><label>File type</label><select value={exportFormat} onChange={e=>setExportFormat(e.target.value)}>
        <option value="pdf">PDF Print</option><option value="png">PNG image</option><option value="jpg">JPG image</option><option value="svg">SVG vector</option></select></div>
      {exportFormat!=='svg'&&<div className="form-field"><label>Effective export DPI</label><select value={exportDpi} onChange={e=>setExportDpi(Number(e.target.value))}>
        <option value="150">150 DPI — proof / digital</option><option value="300">300 DPI — recommended print</option><option value="864">864 DPI — specialist use, large files</option></select></div>}
      {doc.pages.length>1&&<div className="form-field"><label>Pages</label><select value={exportScope} onChange={e=>setExportScope(e.target.value)}>
        <option value="all">All pages</option><option value="current">Current page</option></select></div>}
      {exportFormat==='png'&&<label className="checkbox-field"><input type="checkbox" checked={exportTransparent} onChange={e=>setExportTransparent(e.target.checked)}/>Transparent background</label>}
      <div className="export-note"><Printer size={18}/>PDF export is currently rasterized RGB, not CMYK/PDF-X. Check print output before production.</div>
      <button className="primary-btn modal-primary" onClick={exportNow}><Download size={18}/> Download {exportFormat.toUpperCase()}</button>
      <button className="secondary-btn modal-secondary" onClick={backupProject}><Save size={17}/> Download editable project JSON</button>
    </Modal>}
    {modal==='working'&&<Modal title="Preparing export" onClose={()=>{}}><div className="working"><div className="loading-orbit"/><span>Rendering your file…</span></div></Modal>}
    {modal==='settings'&&<Modal title="Design settings" onClose={()=>setModal('')}>
      <div className="form-field"><label>Page size</label><div className="preset-grid">{PRESETS.map(p=><button className={'preset-option '+(doc.presetId===p.id?'active':'')}
        key={p.id} onClick={()=>changePreset(p)}><FileText size={17}/><strong>{p.label}</strong><small>{p.physical}</small></button>)}</div></div>
      <div className="settings-toggle"><div><strong>Safe margin guides</strong><p>Show text-safe guides while editing</p></div>
        <input type="checkbox" checked={!!doc.settings?.showMargin} onChange={e=>updateDoc(d=>({...d,settings:{...d.settings,showMargin:e.target.checked}}))}/></div>
      <div className="settings-toggle"><div><strong>Bleed guides</strong><p>Show approximately 3 mm trim reference</p></div>
        <input type="checkbox" checked={!!doc.settings?.showBleed} onChange={e=>updateDoc(d=>({...d,settings:{...d.settings,showBleed:e.target.checked}}))}/></div>
      <div className="modal-divider"/><StarterButton icon={FilePlus2} label="Save design as template" onClick={openSaveTemplate}/>
      <StarterButton icon={Download} label="Download project backup" onClick={backupProject}/>
    </Modal>}
    {modal==='versions'&&<Modal title="Version history" onClose={()=>setModal('')}>
      <p className="modal-description">Manually saved checkpoints on this device. Up to 20 versions per project.</p>
      <button className="secondary-btn" onClick={makeVersion}><Save size={17}/> Save current version</button>
      <div className="version-list">{(doc.versions||[]).length?
        [...doc.versions].reverse().map(v=><div key={v.id} className="version-item"><div><strong>{v.title}</strong><small>{formatDate(v.date)}</small></div>
          <button className="secondary-btn" onClick={()=>restoreVersion(v)}><RotateCcw size={16}/> Restore</button></div>):
        <p className="panel-hint">No checkpoints yet. Use “Save current version” to start.</p>}</div>
    </Modal>}
    {modal==='save-template'&&<Modal title="Save editable template" onClose={()=>setModal('')}>
      <p className="modal-description">Save the current pages as a reusable template. You can manage it in Template Manager.</p>
      <div className="form-field"><label>Template name</label><input value={templateName} maxLength={100} onChange={e=>setTemplateName(e.target.value)}/></div>
      <div className="form-field"><label>Category</label><select value={templateCategory} onChange={e=>setTemplateCategory(e.target.value)}>
        {[...new Set([...TEMPLATE_CATEGORIES,...categories.filter(c=>c!=='All')])].map(c=><option key={c}>{c}</option>)}</select></div>
      <div className="form-field"><label>Description</label><textarea value={templateDescription} onChange={e=>setTemplateDescription(e.target.value)} rows={3}/></div>
      <label className="checkbox-field"><input type="checkbox" checked={templatePublished} onChange={e=>setTemplatePublished(e.target.checked)}/>Publish in this browser's template gallery</label>
      <button className="primary-btn modal-primary" onClick={saveTemplate}><Save size={18}/> Save template</button>
      <p className="panel-hint">Cloud sharing between devices is not enabled. Download a ZIP backup in Template Manager.</p>
    </Modal>}
    {modal==='saving-template'&&<Modal title="Saving template" onClose={()=>{}}><div className="working"><div className="loading-orbit"/><span>Generating editable template preview…</span></div></Modal>}
    {modal==='replace-template'&&<Modal title="Choose a new starting design" onClose={()=>setModal('')}>
      <p className="modal-description">A new design will be created from the selected template. The existing design stays saved.</p>
      <div className="replace-grid">{availableTemplates.filter(t=>t.id!=='blank').map(t=><button key={t.id} onClick={()=>{setModal('');create(t.id);}}>
        <TemplateArt template={t} compact/><strong>{t.name}</strong></button>)}</div>
    </Modal>}
    {notification&&<div className="toast"><Check size={17}/>{notification}</div>}
  </div>;
}
