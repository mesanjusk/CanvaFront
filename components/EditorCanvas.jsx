"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { uid } from '@/lib/format.mjs';

const SERIALIZE_PROPS = ['id', 'name', 'selectable'];

export const EditorCanvas = forwardRef(function EditorCanvas(
  { page, scale, showMargin, showBleed, onPageChange, onSelection, onHistory }, ref
) {
  const canvasElement = useRef(null);
  const canvasInstance = useRef(null);
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const loading = useRef(false);
  const callbacks = useRef({onPageChange,onSelection,onHistory});
  callbacks.current = {onPageChange,onSelection,onHistory};

  useImperativeHandle(ref,()=>({
    getCanvas:()=>canvasInstance.current,
    serialize:()=>canvasInstance.current?.toJSON(SERIALIZE_PROPS) || null,
    addText(value='Double click to edit') {
      const c=canvasInstance.current; const f=window.__skFabric;
      if(!c||!f) return;
      const item=new f.IText(value,{left:60,top:75,fontFamily:'Georgia',fontSize:28,fill:'#22283b',
        width:280,editable:true,id:uid('text'),name:'Text'});
      c.add(item);c.setActiveObject(item);c.requestRenderAll();notifySelection(c);
    },
    addShape(type='rect') {
      const c=canvasInstance.current;const f=window.__skFabric;
      if(!c||!f)return;
      let item;
      if(type==='circle') item=new f.Circle({left:70,top:80,radius:52,fill:'#e9d9fb',stroke:'#8b65cb',strokeWidth:1});
      else if(type==='triangle') item=new f.Triangle({left:65,top:70,width:120,height:120,fill:'#dbf0e8',stroke:'#4f9a86',strokeWidth:1});
      else if(type==='line') item=new f.Line([70,100,220,100],{stroke:'#7055c8',strokeWidth:4});
      else item=new f.Rect({left:65,top:75,width:150,height:105,rx:8,ry:8,fill:'#e9d9fb',stroke:'#8b65cb',strokeWidth:1});
      item.set({id:uid('shape'),name:type[0].toUpperCase()+type.slice(1)});
      c.add(item);c.setActiveObject(item);c.requestRenderAll();notifySelection(c);
    },
    uploadImage(file) {
      const c=canvasInstance.current;const f=window.__skFabric;
      if(!c||!f||!file)return;
      const reader=new FileReader();
      reader.onload=()=>f.Image.fromURL(reader.result,img=>{
        if(!img)return;
        const maxW=page.width*.7,maxH=page.height*.6;
        const factor=Math.min(maxW/(img.width||1),maxH/(img.height||1),1);
        img.set({left:(page.width-(img.width||0)*factor)/2,top:80,scaleX:factor,scaleY:factor,
          id:uid('image'),name:file.name||'Image'});
        c.add(img);c.setActiveObject(img);c.requestRenderAll();notifySelection(c);
      },{crossOrigin:'anonymous'});
      reader.readAsDataURL(file);
    },
    setProperty(property,value) {
      const c=canvasInstance.current;const obj=c?.getActiveObject();
      if(!obj)return;
      const numberProps=['fontSize','opacity','angle','strokeWidth','left','top'];
      obj.set(property,numberProps.includes(property)?Number(value):value);
      if(property==='fontFamily' && obj.type==='i-text') obj.dirty=true;
      obj.setCoords();c.requestRenderAll();c.fire('object:modified',{target:obj});notifySelection(c);
    },
    selectById(id) {
      const c=canvasInstance.current;if(!c)return;
      const o=c.getObjects().find(x=>x.id===id);
      if(o){c.setActiveObject(o);c.requestRenderAll();notifySelection(c);}
    },
    action(action) {
      const c=canvasInstance.current;const f=window.__skFabric;if(!c)return;
      const obj=c.getActiveObject();
      if(action==='undo') return restoreHistory(-1);
      if(action==='redo') return restoreHistory(1);
      if(!obj)return;
      if(action==='delete') c.remove(obj);
      if(action==='duplicate') {
        obj.clone(copy=>{
          copy.set({left:obj.left+18,top:obj.top+18,id:uid('copy')});
          c.add(copy);c.setActiveObject(copy);c.requestRenderAll();
        },SERIALIZE_PROPS);
      }
      if(action==='forward')c.bringForward(obj);
      if(action==='backward')c.sendBackwards(obj);
      if(action==='front')c.bringToFront(obj);
      if(action==='back')c.sendToBack(obj);
      if(action==='centerH'){obj.set({left:(page.width-obj.getScaledWidth())/2});obj.setCoords();}
      if(action==='centerV'){obj.set({top:(page.height-obj.getScaledHeight())/2});obj.setCoords();}
      c.requestRenderAll();c.fire('object:modified',{target:obj});notifySelection(c);
    },
    toggleDraw(enabled,color='#7055c8') {
      const c=canvasInstance.current;if(!c)return;
      c.isDrawingMode=enabled;
      if(c.freeDrawingBrush){c.freeDrawingBrush.width=3;c.freeDrawingBrush.color=color;}
    },
    exportData(type='png',dpi=300) {
      const c=canvasInstance.current;if(!c)return null;
      if(type==='svg')return c.toSVG();
      return c.toDataURL({format:type==='jpg'?'jpeg':'png',quality:.96,multiplier:dpi/72});
    },
    historyState:()=>({index:historyIndex.current,length:history.current.length})
  }),[page.id,page.width,page.height]);

  function notifySelection(c) {
    const o=c?.getActiveObject();
    callbacks.current.onSelection(o?{
      id:o.id,name:o.name||o.type,type:o.type,text:o.text||'',
      fill:typeof o.fill==='string'?o.fill:'#ffffff',stroke:typeof o.stroke==='string'?o.stroke:'#000000',
      fontSize:o.fontSize||24,fontFamily:o.fontFamily||'Georgia',opacity:o.opacity??1,
      angle:o.angle||0,locked:!o.selectable,
      layers:c.getObjects().map(x=>({id:x.id,name:x.name||x.type,type:x.type})).reverse()
    }:{
      layers:c?c.getObjects().map(x=>({id:x.id,name:x.name||x.type,type:x.type})).reverse():[]
    });
  }

  function record(c) {
    if(loading.current)return;
    const json=c.toJSON(SERIALIZE_PROPS);
    const signature=JSON.stringify(json);
    const existing=history.current[historyIndex.current];
    if(existing===signature)return;
    history.current=history.current.slice(0,historyIndex.current+1).concat(signature).slice(-70);
    historyIndex.current=history.current.length-1;
    callbacks.current.onHistory({canUndo:historyIndex.current>0,canRedo:false});
    callbacks.current.onPageChange(json);
    notifySelection(c);
  }
  function restoreHistory(delta) {
    const c=canvasInstance.current;
    const next=historyIndex.current+delta;
    if(!c||next<0||next>=history.current.length)return;
    historyIndex.current=next;
    loading.current=true;
    c.loadFromJSON(JSON.parse(history.current[next]),()=>{
      loading.current=false;c.requestRenderAll();
      callbacks.current.onPageChange(c.toJSON(SERIALIZE_PROPS));
      callbacks.current.onHistory({canUndo:next>0,canRedo:next<history.current.length-1});
      notifySelection(c);
    });
  }

  useEffect(()=>{
    let disposed=false;
    let editor;
    async function initialize(){
      const mod=await import('fabric');
      if(disposed || !canvasElement.current)return;
      const f=mod.fabric;window.__skFabric=f;
      editor=new f.Canvas(canvasElement.current,{width:page.width,height:page.height,
        backgroundColor:page.background||'#ffffff',selection:true,preserveObjectStacking:true,
        enableRetinaScaling:true});
      canvasInstance.current=editor;
      loading.current=true;
      const finish=()=>{
        if(disposed)return;
        loading.current=false;editor.renderAll();
        const json=editor.toJSON(SERIALIZE_PROPS);
        history.current=[JSON.stringify(json)];historyIndex.current=0;
        callbacks.current.onHistory({canUndo:false,canRedo:false});
        callbacks.current.onPageChange(json);
        notifySelection(editor);
      };
      if(page.objects?.objects?.length){
        editor.loadFromJSON(page.objects,finish);
      }else if(page.seed?.length){
        page.seed.forEach((item)=>{
          let o=null;
          if(item.type==='text')o=new f.IText(item.value,{left:item.x,top:item.y,
            width:item.width,fontSize:item.size,fontFamily:item.font||'Georgia',
            fontWeight:item.weight||'normal',fontStyle:item.italic?'italic':'normal',
            textAlign:item.align||'center',fill:item.color,originX:'left'});
          if(item.type==='rect')o=new f.Rect({left:item.x,top:item.y,width:item.w,height:item.h,
            fill:item.color,stroke:item.stroke,strokeWidth:item.stroke?1:0,rx:item.rx,ry:item.rx});
          if(item.type==='circle')o=new f.Circle({left:item.x,top:item.y,radius:item.r,
            fill:item.color,stroke:item.stroke,strokeWidth:item.stroke?1:0});
          if(o){o.set({id:uid('item'),name:item.type==='text'?item.value.slice(0,28):item.type});editor.add(o);}
        });
        finish();
      }else finish();
      ['object:added','object:removed','object:modified','text:changed','path:created'].forEach(
        event=>editor.on(event,()=>record(editor)));
      ['selection:created','selection:updated','selection:cleared'].forEach(
        event=>editor.on(event,()=>notifySelection(editor)));
    }
    initialize();
    return ()=>{
      disposed=true;if(editor){editor.dispose();}
      canvasInstance.current=null;
    };
  },[page.id]);

  useEffect(()=>{
    function handleKey(e) {
      const tag=document.activeElement?.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||document.activeElement?.isContentEditable)return;
      const c=canvasInstance.current;if(!c)return;
      if(c.getActiveObject()?.isEditing)return;
      const mod=e.ctrlKey||e.metaKey;
      if(mod && e.key.toLowerCase()==='z'){e.preventDefault();restoreHistory(e.shiftKey?1:-1);}
      else if(mod && e.key.toLowerCase()==='y'){e.preventDefault();restoreHistory(1);}
      else if(e.key==='Delete'||e.key==='Backspace'){
        const o=c.getActiveObject();if(o){e.preventDefault();c.remove(o);c.discardActiveObject();c.requestRenderAll();}
      }
    }
    window.addEventListener('keydown',handleKey);
    return ()=>window.removeEventListener('keydown',handleKey);
  },[page.id]);

  const scaledWidth=page.width*scale,scaledHeight=page.height*scale;
  const marginPx=18*scale;
  const bleedPx=(3/25.4)*72*scale;
  return <div className="canvas-outer" style={{width:scaledWidth,height:scaledHeight}}>
    <div style={{width:page.width,height:page.height,transform:`scale(${scale})`,transformOrigin:'top left'}}>
      <canvas ref={canvasElement} aria-label="Editable design canvas"/>
    </div>
    {showMargin&&<div className="guide-margin" style={{inset:marginPx}}/>}
    {showBleed&&<div className="guide-bleed" style={{inset:bleedPx}}/>}
  </div>;
});
