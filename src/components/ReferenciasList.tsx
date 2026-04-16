'use client';

import { Users, ScrollText, Plus, BookOpen } from "lucide-react";

interface ReferenciasListProps {
  personagens: any[];
  grimorio: any[];
  buscaParam: string | null | undefined;
}

export function ReferenciasList({ personagens, grimorio, buscaParam }: ReferenciasListProps) {
  const handleInsertMention = (type: string, id: number, name: string) => {
    const event = new CustomEvent('insertMention', { 
      detail: { type, id, name }
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-4">
      {personagens.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 mb-1.5 px-1 flex items-center gap-1">
            <Users size={10} /> Personagens
            {buscaParam && <span className="text-[8px] text-blue-400">({personagens.length})</span>}
          </p>
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {personagens.slice(0, 20).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer group"
                title="Clique para inserir no texto"
                onClick={() => handleInsertMention('personagem', p.id, p.nome)}
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[9px] font-black flex-shrink-0">
                  {p.nome?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-slate-300 truncate font-medium group-hover:text-blue-400 transition-colors">
                    {p.nome}
                  </p>
                  {p.papel && (
                    <p className="text-[9px] text-slate-600 truncate">{p.papel}</p>
                  )}
                </div>
                <Plus size={8} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            ))}
            {personagens.length > 20 && !buscaParam && (
              <p className="text-[9px] text-center text-slate-600 py-2">
                +{personagens.length - 20} personagens. Use a busca para ver mais.
              </p>
            )}
          </div>
        </div>
      )}

      {grimorio.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 mb-1.5 px-1 flex items-center gap-1">
            <ScrollText size={10} /> Grimório
            {buscaParam && <span className="text-[8px] text-blue-400">({grimorio.length})</span>}
          </p>
          <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
            {grimorio.slice(0, 20).map((g: any) => (
              <div
                key={g.id}
                className="px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer group"
                onClick={() => handleInsertMention('grimorio', g.id, g.titulo)}
              >
                <div className="flex items-start gap-2">
                  <BookOpen size={10} className="text-slate-500 mt-0.5 flex-shrink-0 group-hover:text-emerald-400 transition-colors" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-slate-300 truncate font-medium group-hover:text-emerald-400 transition-colors">
                      {g.titulo}
                    </p>
                    {g.categoria && (
                      <p className="text-[9px] text-slate-600">{g.categoria}</p>
                    )}
                  </div>
                  <Plus size={8} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </div>
            ))}
            {grimorio.length > 20 && !buscaParam && (
              <p className="text-[9px] text-center text-slate-600 py-2">
                +{grimorio.length - 20} itens. Use a busca para ver mais.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dica de atalho */}
      <div className="pt-2 border-t border-slate-800 text-center">
        <p className="text-[8px] text-slate-600">
          💡 Clique em qualquer item para inserir no texto
        </p>
      </div>
    </div>
  );
}