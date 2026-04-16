'use client';

import { updateNovel } from "@/lib/actions";
import { useState } from "react";

interface EditSinopseProps {
  novelId: number;
  sinopseAtual: string | null;
}

export function EditSinopse({ novelId, sinopseAtual }: EditSinopseProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [sinopse, setSinopse] = useState(sinopseAtual || "");

  const handleSave = async () => {
    // Converter null para undefined e string vazia para null
    const sinopseToSave = sinopse.trim() === "" ? null : sinopse;
    await updateNovel(novelId, { sinopse: sinopseToSave || undefined });
    setIsEditing(false);
    window.location.reload();
  };

  const handleCancel = () => {
    setSinopse(sinopseAtual || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mb-3">
        <textarea
          value={sinopse}
          onChange={(e) => setSinopse(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none"
          rows={3}
          placeholder="Digite a sinopse da obra..."
          autoFocus
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSave}
            className="text-[10px] bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded-lg transition-colors"
          >
            Salvar
          </button>
          <button
            onClick={handleCancel}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group/sinopse relative">
      <p className="text-slate-500 text-sm line-clamp-2 mb-3 flex-1 leading-relaxed">
        {sinopseAtual || "Nenhuma sinopse definida ainda."}
      </p>
      <button
        onClick={() => setIsEditing(true)}
        className="absolute top-0 right-0 text-[9px] text-slate-600 opacity-0 group-hover/sinopse:opacity-100 transition-opacity hover:text-blue-400"
      >
        Editar
      </button>
    </div>
  );
}