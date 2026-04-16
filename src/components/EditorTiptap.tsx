'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { updateCapituloConteudo } from '@/lib/actions';
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

interface EditorTiptapProps {
  capituloId: number;
  initialContent: any;
  onWordCountChange?: (count: number) => void;
}

export default function EditorTiptap({ capituloId, initialContent, onWordCountChange }: EditorTiptapProps) {
  const [mounted, setMounted] = useState(false);

  // Importante: Só renderizar o editor no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const updateContent = useCallback(
    debounce(async (content: any, wordCount: number) => {
      await updateCapituloConteudo(capituloId, content, wordCount);
      if (onWordCountChange) onWordCountChange(wordCount);
    }, 1000),
    [capituloId, onWordCountChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escreva seu capítulo aqui... Comece com uma cena forte! ✍️',
      }),
    ],
    content: initialContent || { type: "doc", content: [] },
    // CORREÇÃO: Adicionar immediatelyRender: false para evitar hidratação
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[60vh] p-8 bg-slate-900/50 rounded-xl border border-slate-800',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const text = editor.getText();
      const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      updateContent(content, wordCount);
    },
  });

  // Barra de ferramentas simples
  const ToolbarButton = ({ onClick, children, active }: { onClick: () => void; children: React.ReactNode; active?: boolean }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all text-sm font-medium ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );

  // Não renderizar nada no servidor para evitar hidratação
  if (!mounted) {
    return (
      <div className="min-h-[60vh] bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
        <div className="text-slate-500">Carregando editor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl sticky top-0 z-10 backdrop-blur-sm">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>
          <strong>N</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}>
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })}>
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}>
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>
          • Lista
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}>
          1. Lista
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')}>
          ❝ Citação
        </ToolbarButton>
        <div className="w-px h-8 bg-slate-700 mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()}>
          ↩️ Desfazer
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()}>
          ↪️ Refazer
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}