"use client";
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
const Studio = dynamic(() => import('@/components/Studio'), { ssr: false });
export default function EditorPage() {
  const params = useParams();
  return <Studio initialDesignId={params.id} />;
}
