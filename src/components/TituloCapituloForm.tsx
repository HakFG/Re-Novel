'use client';

import { Save } from "lucide-react";
import { useRef } from "react";
import { updateCapituloTitulo } from "@/lib/actions";

interface TituloCapituloFormProps {
  capituloId: number;
  tituloInicial: string;
  novelId: number;
}

export default function TituloCapituloForm({ capituloId, tituloInicial, novelId }: TituloCapituloFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const novoTitulo = e.target.value.trim();
    if (novoTitulo && novoTitulo !== tituloInicial) {
      await updateCapituloTitulo(capituloId, novoTitulo);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const novoTitulo = e.currentTarget.value.trim();
      if (novoTitulo && novoTitulo !== tituloInicial) {
        updateCapituloTitulo(capituloId, novoTitulo);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <input
        ref={inputRef}
        type="text"
        name="titulo"
        defaultValue={tituloInicial}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="bg-transparent text-2xl font-black border-b border-slate-800 focus:border-blue-500 outline-none px-1 py-1 flex-1 transition-all placeholder:text-slate-700"
        placeholder="Título do capítulo..."
      />
      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-shrink-0">
        <Save size={11} />
        <span>Salvamento automático</span>
      </div>
    </div>
  );
}