'use client';

import { Clock } from "lucide-react";

export function RefreshButton() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <button 
      onClick={handleRefresh}
      className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
    >
      <Clock size={10} /> Atualizar
    </button>
  );
}