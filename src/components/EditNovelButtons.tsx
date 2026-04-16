'use client';

import { Edit2, Trash2 } from "lucide-react";
import { updateNovel, deleteNovel } from "@/lib/actions";

interface EditNovelButtonsProps {
  novelId: number;
  tituloAtual: string;
  sinopseAtual: string | null;
}

export function EditNovelButtons({ novelId, tituloAtual, sinopseAtual }: EditNovelButtonsProps) {
  const handleEditTitulo = async () => {
    const novoTitulo = prompt("Novo título:", tituloAtual);
    if (novoTitulo && novoTitulo !== tituloAtual) {
      await updateNovel(novelId, { titulo: novoTitulo });
      window.location.reload();
    }
  };

  const handleEditSinopse = async () => {
    const novaSinopse = prompt("Editar sinopse:", sinopseAtual || "");
    if (novaSinopse !== null) {
      await updateNovel(novelId, { sinopse: novaSinopse });
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir "${tituloAtual}"? Esta ação não pode ser desfeita.`)) {
      await deleteNovel(novelId);
      window.location.reload();
    }
  };

  return (
    <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={handleEditTitulo}
        className="text-slate-600 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-500/10 transition-all"
        title="Editar título"
      >
        <Edit2 size={14} />
      </button>
      <button 
        onClick={handleDelete}
        className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
        title="Excluir obra"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}