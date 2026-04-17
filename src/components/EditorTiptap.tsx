'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { updateCapituloConteudo } from '@/lib/actions';
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
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const countWords = useCallback((text: string): number => {
    const matches = text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu);
    return matches ? matches.length : 0;
  }, []);

  const updateContent = useCallback(
    debounce(async (content: any, wordCount: number) => {
      setSaving(true);
      try {
        await updateCapituloConteudo(capituloId, content, wordCount);
        setLastSaved(new Date());
        if (onWordCountChange) onWordCountChange(wordCount);
      } catch (error) {
        console.error('Erro ao salvar:', error);
      } finally {
        setSaving(false);
      }
    }, 1500),
    [capituloId, onWordCountChange]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder: 'Escreva seu capítulo aqui... Comece com uma cena forte! ✍️\n\nDica: Use os botões de formatação acima para dar estilo ao seu texto.',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      Strike,
      Subscript,
      Superscript,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-400 underline hover:text-blue-300',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
    ],
    content: initialContent || { type: "doc", content: [{ type: "paragraph", content: [] }] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[70vh] p-8 bg-slate-900/50 rounded-xl border border-slate-800',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const text = editor.getText();
      const wordCount = countWords(text);
      updateContent(content, wordCount);
    },
  });

  // Escutar eventos de menção
  useEffect(() => {
    const handleInsertMention = (event: CustomEvent) => {
      const { type, id, name } = event.detail;
      if (editor) {
        const mentionText = `[[${type.toUpperCase()}:${id}|${name}]]`;
        editor.commands.insertContent(mentionText);
        editor.commands.focus();
      }
    };

    window.addEventListener('insertMention', handleInsertMention as EventListener);
    return () => {
      window.removeEventListener('insertMention', handleInsertMention as EventListener);
    };
  }, [editor]);

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

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

  const ColorButton = ({ color, label }: { color: string; label: string }) => (
    <button
      onClick={() => editor?.chain().focus().setColor(color).run()}
      className={`w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform ${color === '#ffffff' ? 'border-slate-400' : ''}`}
      style={{ backgroundColor: color }}
      title={label}
    />
  );

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

  return (
    <div className="space-y-4">
      {/* Toolbar - Completa como Word */}
      <div className="flex flex-wrap gap-1 p-3 bg-slate-900 border border-slate-800 rounded-xl sticky top-0 z-10 backdrop-blur-sm">
        {/* Desfazer/Refazer */}
        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Desfazer (Ctrl+Z)">
          ↩️
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Refazer (Ctrl+Y)">
          ↪️
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Formatação básica */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Negrito (Ctrl+B)">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Itálico (Ctrl+I)">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Sublinhado (Ctrl+U)">
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Tachado">
          <s>S</s>
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Cores */}
        <div className="flex items-center gap-1 px-2">
          <ColorButton color="#ffffff" label="Branco" />
          <ColorButton color="#ef4444" label="Vermelho" />
          <ColorButton color="#3b82f6" label="Azul" />
          <ColorButton color="#10b981" label="Verde" />
          <ColorButton color="#f59e0b" label="Amarelo" />
          <ColorButton color="#a855f7" label="Roxo" />
        </div>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Alinhamento */}
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="Alinhar à esquerda">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="Centralizar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="5" y1="12" x2="19" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="Alinhar à direita">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('justify').run()} active={editor?.isActive({ textAlign: 'justify' })} title="Justificar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Títulos */}
        <select
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'paragraph') editor?.chain().focus().setParagraph().run();
            else if (value === 'h1') editor?.chain().focus().setHeading({ level: 1 }).run();
            else if (value === 'h2') editor?.chain().focus().setHeading({ level: 2 }).run();
            else if (value === 'h3') editor?.chain().focus().setHeading({ level: 3 }).run();
            else if (value === 'h4') editor?.chain().focus().setHeading({ level: 4 }).run();
          }}
          className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300"
        >
          <option value="paragraph">Normal</option>
          <option value="h1">Título 1</option>
          <option value="h2">Título 2</option>
          <option value="h3">Título 3</option>
          <option value="h4">Título 4</option>
        </select>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Listas */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Lista com marcadores">
          • Lista
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Lista numerada">
          1. Lista
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Citação e código */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Citação">
          ❝
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="Bloco de código">
          &lt;/&gt;
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Subscrito e sobrescrito */}
        <ToolbarButton onClick={() => editor?.chain().focus().toggleSubscript().run()} active={editor?.isActive('subscript')} title="Subscrito">
          X₂
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleSuperscript().run()} active={editor?.isActive('superscript')} title="Sobrescrito">
          X²
        </ToolbarButton>
        
        <div className="w-px h-8 bg-slate-700 mx-1" />
        
        {/* Link */}
        <ToolbarButton 
          onClick={() => {
            const previousUrl = editor?.getAttributes('link').href;
            setLinkUrl(previousUrl || '');
            setShowLinkModal(true);
          }} 
          active={editor?.isActive('link')} 
          title="Inserir link"
        >
          🔗
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
            <span className="text-slate-600">Pronto</span>
          )}
        </div>
      </div>

      {/* Modal de link */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Inserir link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mb-4 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={addLink} className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded-lg transition-all">
                Inserir
              </button>
              <button onClick={() => setShowLinkModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg transition-all">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
      
      {/* Rodapé com estatísticas */}
      {editor && (
        <div className="flex justify-between items-center text-[10px] text-slate-600 px-2 py-2 border-t border-slate-800">
          <div className="flex gap-4">
            <span>📝 {editor.getText().length.toLocaleString("pt-BR")} caracteres</span>
            <span>📊 {countWords(editor.getText()).toLocaleString("pt-BR")} palavras</span>
            <span>📖 {Math.ceil(countWords(editor.getText()) / 200)} min de leitura</span>
          </div>
          <div className="flex gap-2">
            <span>💡 Ctrl+B = Negrito</span>
            <span>•</span>
            <span>Ctrl+I = Itálico</span>
            <span>•</span>
            <span>Ctrl+Z = Desfazer</span>
          </div>
        </div>
      )}
    </div>
  );
}