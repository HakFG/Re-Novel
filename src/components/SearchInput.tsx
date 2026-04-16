'use client';

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SearchInputProps {
  novelId: number;
  capituloId: number | null;
  buscaParam: string | null | undefined;  // ← Adicione undefined aqui
}

export function SearchInput({ novelId, capituloId, buscaParam }: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(buscaParam || "");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const url = `/escrita/${novelId}?capitulo=${capituloId || ''}&busca=${encodeURIComponent(value)}`;
      router.push(url);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar referências..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 placeholder:text-slate-600 focus:border-blue-500 outline-none"
      />
      <Search size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" />
    </div>
  );
}