'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { updateCapituloConteudo, createMencao } from '@/lib/actions';
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

interface EditorTiptapProps {
  capituloId: number;
  novelId?: number;
  initialContent: any;
  onWordCountChange?: (count: number) => void;
}

export default function EditorTiptap({ capituloId, novelId, initialContent, onWordCountChange }: EditorTiptapProps) {
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const countWords = useCallback((text: string): number => {
    const matches = text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu);
    return matches ? matches.length : 0;
  }, []);

  const extractMentions = useCallback((content: any, chapterId: number, novelIdParam: number) => {
    if (!content || !content.content) return [];
    
    const mentions: Array<{
      capituloId: number;
      novelId: number;
      personagemId?: number;
      grimorioId?: number;
      tipo: string;
      posicaoInicio: number;
      posicaoFim: number;
      textoMencionado: string;
    }> = [];
    
    let globalPosition = 0;
    
    const traverse = (node: any) => {
      if (node.type === 'text' && node.text) {
        const regex = /\[\[([A-Z]+):(\d+)\|([^\]]+)\]\]/g;
        let match;
        while ((match = regex.exec(node.text)) !== null) {
          const [fullMatch, tipo, idStr, nome] = match;
          const startPos = globalPosition + match.index;
          const endPos = startPos + fullMatch.length;
          
          mentions.push({
            capituloId: chapterId,
            novelId: novelIdParam,
            tipo: tipo,
            [tipo === 'PERSONAGEM' ? 'personagemId' : 'grimorioId']: parseInt(idStr),
            posicaoInicio: startPos,
            posicaoFim: endPos,
            textoMencionado: nome,
          });
        }
        globalPosition += node.text.length;
      } else if (node.content) {
        node.content.forEach(traverse);
      }
    };
    
    if (content.content) {
      content.content.forEach(traverse);
    }
    
    return mentions;
  }, []);

  const updateContent = useCallback(
    debounce(async (content: any, wordCount: number) => {
      setSaving(true);
      try {
        await updateCapituloConteudo(capituloId, content, wordCount);
        
        if (novelId) {
          const mentions = extractMentions(content, capituloId, novelId);
          for (const mention of mentions) {
            await createMencao(mention);
          }
        }
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Erro ao salvar:', error);
      } finally {
        setSaving(false);
      }
      if (onWordCountChange) onWordCountChange(wordCount);
    }, 1500),
    [capituloId, novelId, onWordCountChange, extractMentions]
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Escreva seu capítulo aqui... Comece com uma cena forte! ✍️\n\n💡 Dica: Clique nos personagens ou itens do grimório na barra lateral para inserir referências rapidamente.',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content: initialContent || { type: "doc", content: [{ type: "paragraph", content: [] }] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[60vh] p-8 bg-slate-900/50 rounded-xl border border-slate-800',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const text = editor.getText();
      const wordCount = countWords(text);
      updateContent(content, wordCount);
    },
  });

  useEffect(() => {
    const handleInsertMention = (event: CustomEvent) => {
      const { type, id, name } = event.detail;
      if (editor) {
        const mentionText = `[[${type.toUpperCase()}:${id}|${name}]]`;
        editor.commands.insertContent(mentionText);
        editor.commands.focus();
        console.log(`✅ Menção inserida: ${name}`);
      }
    };

    window.addEventListener('insertMention', handleInsertMention as EventListener);
    
    return () => {
      window.removeEventListener('insertMention', handleInsertMention as EventListener);
    };
  }, [editor]);

  const ToolbarButton = ({ onClick, children, active, disabled, title }: { onClick: () => void; children: React.ReactNode; active?: boolean; disabled?: boolean; title?: string }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all text-sm font-medium ${
        disabled 
          ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
          : active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  if (!mounted) {
    return (
      <div className="min-h-[60vh] bg-slate-900/50 rounded-xl border border-slate-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          <div className="text-slate-500 text-sm">Carregando editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl sticky top-0 z-10 backdrop-blur-sm">
        {/* Formatação básica */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Negrito (Ctrl+B)">
          <strong>N</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Itálico (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Títulos */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="Título 1">
          H1
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Título 2">
          H2
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Alinhamento de texto - NOVIDADE! */}
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="Alinhar à esquerda">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="Centralizar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="Alinhar à direita">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="9" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('justify').run()} active={editor?.isActive({ textAlign: 'justify' })} title="Justificar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
            <line x1="5" y1="6" x2="5" y2="18"/>
            <line x1="19" y1="6" x2="19" y2="18"/>
          </svg>
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Listas */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Lista com marcadores">
          • Lista
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Lista numerada">
          1. Lista
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Citação">
          ❝ Citação
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Desfazer/Refazer */}
        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Desfazer (Ctrl+Z)">
          ↩️ Desfazer
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Refazer (Ctrl+Y)">
          ↪️ Refazer
        </ToolbarButton>
        
        {/* Indicador de salvamento */}
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[10px]">
          {saving ? (
            <>
              <div className="w-3 h-3 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-slate-500">Salvando...</span>
            </>
          ) : lastSaved ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-500">
                Salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </>
          ) : (
            <span className="text-slate-600">Pronto para escrever</span>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
      
      {/* Rodapé com estatísticas */}
      {editor && (
        <div className="flex justify-between items-center text-[10px] text-slate-600 px-2">
          <div className="flex gap-3">
            <span>📝 {editor.getText().length} caracteres</span>
            <span>📊 {countWords(editor.getText())} palavras</span>
          </div>
          <div>
            💡 Use @ ou clique nos itens da barra lateral para inserir referências
          </div>
        </div>
      )}
    </div>
  );
}