'use client';

import { updateCapituloStatus } from "@/lib/actions";

interface StatusCapituloSelectProps {
  capituloId: number;
  statusInicial: string;
}

export default function StatusCapituloSelect({ capituloId, statusInicial }: StatusCapituloSelectProps) {
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await updateCapituloStatus(capituloId, e.target.value);
  };

  return (
    <div className="flex items-center gap-3 text-[10px] px-1">
      <span className="text-slate-600">Status:</span>
      <select 
        defaultValue={statusInicial || "Rascunho"}
        className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-[10px] cursor-pointer hover:bg-slate-700 transition-colors"
        onChange={handleStatusChange}
      >
        <option value="Rascunho">📝 Rascunho</option>
        <option value="Revisão">🔍 Em Revisão</option>
        <option value="Publicado">✨ Publicado</option>
      </select>
    </div>
  );
}