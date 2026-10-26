"use client";
import dynamic from 'next/dynamic';
const TemplateManager=dynamic(()=>import('@/components/TemplateManager'),{ssr:false});
export default function ManageTemplates(){return <TemplateManager/>;}
