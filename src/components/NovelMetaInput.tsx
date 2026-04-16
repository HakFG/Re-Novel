'use client';

import { Target } from "lucide-react";
import { updateNovelMeta } from "@/lib/actions";

interface NovelMetaInputProps {
  currentValue: number;
  novelId: number;
}

export function NovelMetaInput({ currentValue, novelId }: NovelMetaInputProps) {
  const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 0;
    const formData = new FormData();
    formData.append("capitulos_estimados", newValue.toString());
    await updateNovelMeta(formData, novelId);
  };

  return (
    <div className="flex items-center gap-2">
      <Target size={12} className="text-slate-500" />
      <input
        type="number"
        name="capitulos_estimados"
        defaultValue={currentValue || 0}
        onBlur={handleBlur}
        className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 text-center focus:border-blue-500 focus:outline-none"
        placeholder="Meta"
      />
      <span className="text-xs text-slate-500">capítulos estimados</span>
    </div>
  );
}