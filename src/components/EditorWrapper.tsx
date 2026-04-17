'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

// Carrega o EditorTiptap dinamicamente sem SSR
const EditorTiptap = dynamic(() => import('@/components/EditorTiptap'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[70vh] bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-slate-500 text-sm">Carregando editor...</div>
      </div>
    </div>
  ),
});

interface EditorWrapperProps {
  capituloId: number;
  novelId?: number;
  initialContent: any;
  onWordCountChange?: (count: number) => void;
}

export default function EditorWrapper(props: EditorWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[70vh] bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Carregando editor...</div>
        </div>
      </div>
    );
  }

  return <EditorTiptap {...props} />;
}