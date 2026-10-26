"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
 ArrowLeft, UploadCloud, Download, CheckCircle2, AlertTriangle, Search, FileArchive,
 Layers3, Eye, EyeOff, Trash2, Pencil, Check, X, FolderOpen, Images, CopyCheck,
 FileJson, CloudOff
} from 'lucide-react';
import { listCustomTemplates,addCustomTemplates,updateCustomTemplates,removeCustomTemplates } from '@/lib/template-storage';
import { findDuplicateTemplates,TEMPLATE_CATEGORIES,designFromTemplate,sanitizeCategory } from '@/lib/template-library.mjs';
import { importTemplateFiles,exportTemplateZip,downloadSampleTemplateZip } from '@/lib/template-import.mjs';
import { putDesign } from '@/lib/storage';

export default function TemplateManager(){
  const router=useRouter();
  const picker=useRef(null);
  const [templates,setTemplates]=useState([]);
  const [loading,setLoading]=useState(true);
  const [importing,setImporting]=useState(false);
  const [progress,setProgress]=useState('');
  const [notice,setNotice]=useState('');
  const [report,setReport]=useState(null);
  const [selected,setSelected]=useState([]);
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('All');
  const [visibility,setVisibility]=useState('All');
  const [bulkCategory,setBulkCategory]=useState('Wedding');
  const [editing,setEditing]=useState(null);

  useEffect(()=>{listCustomTemplates().then(setTemplates).catch(()=>setNotice('Browser storage is unavailable.')).finally(()=>setLoading(false));},[]);
  const categories=useMemo(()=>['All',...new Set([...TEMPLATE_CATEGORIES,...templates.map(t=>t.category)])],[templates]);
  const filtered=useMemo(()=>templates.filter(t=>
    (category==='All'||t.category===category)&&
    (visibility==='All'||(visibility==='Published')===t.published)&&
    (t.name+' '+t.description+' '+t.category).toLowerCase().includes(search.toLowerCase())
  ).sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)),[templates,category,visibility,search]);
  const chosen=new Set(selected);
  const allSelected=filtered.length>0&&filtered.every(t=>chosen.has(t.id));
  const notify=(value)=>{setNotice(value);setTimeout(()=>setNotice(''),6000);};
  const toggle=(id)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const selectAll=()=>setSelected(allSelected?selected.filter(id=>!filtered.some(t=>t.id===id)):
    [...new Set([...selected,...filtered.map(t=>t.id)])]);

  async function upload(files){
    if(!files?.length)return;
    setImporting(true);setReport(null);setProgress('Reading template package…');
    try{
      const {templates:incoming,skipped}=await importTemplateFiles(files,(current,total)=>{
        setProgress('Reading editable layouts '+current+' / '+total+'…');
      });
      const {unique,duplicates}=findDuplicateTemplates(templates,incoming);
      if(unique.length)setTemplates(await addCustomTemplates(unique));
      setReport({imported:unique.length,duplicates:duplicates.length,skipped});
      setProgress('');
      notify(unique.length+' templates added as drafts. Review and publish them.');
    }catch(error){
      setReport({error:error.message||'Template import failed'});
      notify('Import failed. Please check the template package.');
    }finally{setImporting(false);if(picker.current)picker.current.value='';}
  }
  async function change(ids,update){
    if(!ids.length)return notify('Select one or more templates first.');
    try{setTemplates(await updateCustomTemplates(ids,update));
      notify(ids.length+' template'+(ids.length===1?'':'s')+' updated.');
    }catch{notify('Unable to update. Check browser storage.');}
  }
  async function deleteSelected(){
    if(!selected.length)return notify('Select templates to delete.');
    if(!window.confirm('Delete '+selected.length+' template(s) from this browser? Export a ZIP backup first.'))return;
    try{setTemplates(await removeCustomTemplates(selected));notify(selected.length+' templates removed.');setSelected([]);}
    catch{notify('Unable to delete templates.');}
  }
  async function editDesign(template){
    try{
      const design=designFromTemplate(template);
      await putDesign(design);
      router.push('/editor/'+design.id);
    }catch{notify('Unable to open template for editing.');}
  }
  async function downloadPack(items,name){
    if(!items.length)return notify('No templates selected to export.');
    try{await exportTemplateZip(items,name);notify('Editable ZIP template pack downloaded.');}
    catch{notify('ZIP export failed. Try fewer templates at once.');}
  }
  async function saveMetadata(){
    if(!editing?.name?.trim())return notify('Template name is required.');
    const id=editing.id;
    await change([id],{name:editing.name.trim().slice(0,100),description:(editing.description||'').slice(0,200),
      category:sanitizeCategory(editing.category),keywords:(editing.keywords||'').slice(0,200)});
    setEditing(null);
  }
  return <div className="manager-shell">
    <header className="manager-topbar">
      <div className="manager-brand">
        <button className="icon-btn" title="Back to studio" onClick={()=>router.push('/')}><ArrowLeft size={21}/></button>
        <span className="brand-mark small">S</span>
        <div><strong>Template Manager</strong><small>SK Design Studio · Local library</small></div>
      </div>
      <div className="manager-top-actions">
        <button className="secondary-btn" disabled={importing} onClick={downloadSampleTemplateZip}><FileArchive size={16}/> Sample ZIP</button>
        <button className="secondary-btn" disabled={!templates.length||importing} onClick={()=>downloadPack(templates,'sk-templates-backup.zip')}><Download size={16}/> Export all</button>
        <button className="primary-btn" disabled={importing} onClick={()=>picker.current?.click()}><UploadCloud size={17}/> Bulk upload</button>
      </div>
    </header>
    <main className="manager-main">
      <div className="manager-heading"><div><span className="eyebrow">YOUR CREATIVE LIBRARY</span>
        <h1>Manage templates</h1><p>Import editable template packs, review previews, organize categories and publish them to your local gallery.</p></div>
        <div className="manager-metrics">
          <div><strong>{templates.length}</strong><span>Templates</span></div>
          <div><strong>{templates.filter(t=>t.published).length}</strong><span>Published</span></div>
          <div><strong>{templates.filter(t=>!t.published).length}</strong><span>Drafts</span></div>
        </div>
      </div>
      <div className="manager-local-warning"><CloudOff size={20}/>
        <div><strong>This is a local template library.</strong> Published templates appear in the gallery on this device only. To distribute them to another device, export the editable ZIP and import it there. Site-wide publishing needs a secured cloud database and admin login.</div>
      </div>
      <section className={'manager-drop '+(importing?'busy':'')} onDragOver={e=>e.preventDefault()}
        onDrop={e=>{e.preventDefault();if(!importing)upload(e.dataTransfer.files);}}>
        <div className="manager-drop-icon"><UploadCloud size={31}/></div>
        <div><h3>{importing?'Importing…':'Bulk template import'}</h3>
          <p>{importing?progress:'Drop ZIP packages or editable SK Design Studio JSON files here.'}</p>
          <small>Up to 500 layouts per ZIP · JSON + optional manifest.csv and PNG/JPG previews</small></div>
        <button className="secondary-btn" disabled={importing} onClick={()=>picker.current?.click()}>{importing?'Please wait':'Choose files'}</button>
      </section>
      {report&&<div className={'manager-report '+(report.error?'error':'')}>
        {report.error?<><AlertTriangle size={19}/><strong>{report.error}</strong></>:
          <><CheckCircle2 size={19}/><div><strong>{report.imported} imported · {report.duplicates} duplicates skipped · {report.skipped.length} invalid layouts skipped</strong>
            {report.skipped.slice(0,5).map((message,i)=><small key={i}>{message}</small>)}</div></>}
        <button className="icon-btn" onClick={()=>setReport(null)}><X size={17}/></button>
      </div>}
      <section className="manager-collection">
        <div className="manager-collection-top"><div><span className="eyebrow">TEMPLATE CATALOGUE</span><h2>My templates</h2></div>
          <div className="manager-search"><Search size={17}/><input aria-label="Search imported templates" placeholder="Search templates…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
        <div className="manager-filters"><select aria-label="Filter category" value={category} onChange={e=>setCategory(e.target.value)}>
          {categories.map(c=><option key={c}>{c}</option>)}</select>
          <select aria-label="Filter status" value={visibility} onChange={e=>setVisibility(e.target.value)}>
            {['All','Published','Draft'].map(v=><option key={v}>{v}</option>)}</select>
          <label className="manager-select-all"><input type="checkbox" checked={allSelected} onChange={selectAll}/> Select all visible</label>
          <span>{filtered.length} shown</span></div>
        {selected.length>0&&<div className="manager-bulkbar"><strong>{selected.length} selected</strong>
          <button onClick={()=>change(selected,{published:true})}><Eye size={16}/> Publish</button>
          <button onClick={()=>change(selected,{published:false})}><EyeOff size={16}/> Draft</button>
          <select aria-label="Bulk category" value={bulkCategory} onChange={e=>setBulkCategory(e.target.value)}>
            {categories.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select>
          <button onClick={()=>change(selected,{category:bulkCategory})}><Check size={16}/> Set category</button>
          <button onClick={()=>downloadPack(templates.filter(t=>chosen.has(t.id)),'sk-selected-templates.zip')}><Download size={16}/> ZIP</button>
          <button className="danger" onClick={deleteSelected}><Trash2 size={16}/> Delete</button>
          <button onClick={()=>setSelected([])}><X size={16}/></button>
        </div>}
        {loading?<div className="manager-empty">Loading your templates…</div>:
          filtered.length?<div className="manager-grid">{filtered.map(t=><article className="manager-card" key={t.id}>
            <div className="manager-card-preview">
              {t.thumbnail?<img src={t.thumbnail} alt={t.name+' preview'}/>:<div className="manager-placeholder"><Images size={28}/><strong>{t.name}</strong></div>}
              <label className="manager-card-check"><input type="checkbox" checked={chosen.has(t.id)} onChange={()=>toggle(t.id)} aria-label={'Select '+t.name}/></label>
              <span className={'manager-status '+(t.published?'published':'')}>{t.published?'Published':'Draft'}</span>
            </div>
            <div className="manager-card-info"><strong title={t.name}>{t.name}</strong>
              <small>{t.category} · {t.pages.length} page{t.pages.length!==1?'s':''}</small>
              <div className="manager-card-actions">
                <button onClick={()=>editDesign(t)}><Pencil size={15}/> Edit design</button>
                <button title="Edit metadata" onClick={()=>setEditing({...t})}><Layers3 size={16}/></button>
                <button title={t.published?'Unpublish':'Publish'} onClick={()=>change([t.id],{published:!t.published})}>
                  {t.published?<EyeOff size={16}/>:<Eye size={16}/>}</button>
              </div>
            </div></article>)}</div>:
            <div className="manager-empty"><FolderOpen size={31}/><strong>No templates found</strong>
              <p>Import your first ZIP pack, or change your search and filters.</p>
              <button className="secondary-btn" onClick={downloadSampleTemplateZip}><Download size={16}/> Download sample ZIP</button></div>}
      </section>
    </main>
    <input ref={picker} hidden multiple type="file" accept=".zip,.json,application/zip,application/json"
      onChange={e=>upload(e.target.files)}/>
    {editing&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null);}}>
      <section className="modal" role="dialog" aria-modal="true" aria-label="Edit template details">
        <header><h2>Edit template details</h2><button className="icon-btn" onClick={()=>setEditing(null)}><X size={17}/></button></header>
        <div className="form-field"><label>Name</label><input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></div>
        <div className="form-field"><label>Description</label><textarea value={editing.description||''} onChange={e=>setEditing({...editing,description:e.target.value})}/></div>
        <div className="form-field"><label>Category</label><input list="manager-categories" value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}/>
          <datalist id="manager-categories">{categories.filter(c=>c!=='All').map(c=><option value={c} key={c}/>)}</datalist></div>
        <div className="form-field"><label>Keywords</label><input value={editing.keywords||''} onChange={e=>setEditing({...editing,keywords:e.target.value})}/></div>
        <button className="primary-btn modal-primary" onClick={saveMetadata}><Check size={18}/> Save changes</button>
      </section></div>}
    {notice&&<div className="toast"><CopyCheck size={16}/>{notice}</div>}
  </div>;
}
