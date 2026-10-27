"use client";

import { RotateCcw } from "lucide-react";

export function DoneFooter({ onStartOver }: { onStartOver: () => void }) {
  return (
    <div className="flex items-center justify-end border-t border-slate-100 bg-white p-3 md:p-4">
      <button
        type="button"
        onClick={onStartOver}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-indigo-700"
      >
        <RotateCcw size={14} />
        Nova conversa
      </button>
    </div>
  );
}
