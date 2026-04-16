'use client';

import { updateNovelStatus } from "@/lib/actions";

interface NovelStatusSelectProps {
  currentStatus: string;
  novelId: number;
}

export function NovelStatusSelect({ currentStatus, novelId }: NovelStatusSelectProps) {
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const formData = new FormData();
    formData.append("status", e.target.value);
    await updateNovelStatus(formData, novelId);
  };

  const statusOptions = ["Em Planejamento", "Ativa", "Hiato", "Concluída"];

  return (
    <select
      name="status"
      defaultValue={currentStatus}
      onChange={handleStatusChange}
      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 cursor-pointer hover:bg-slate-700 transition-colors"
    >
      {statusOptions.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}