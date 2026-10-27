"use client";

import { ArrowUp } from "lucide-react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) onSubmit();
      }}
      className="border-t border-slate-100 bg-white p-3 md:p-4"
    >
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pr-1 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descreva as lições que você quer…"
          className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
          aria-label="Mensagem para o Content Producer"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Enviar"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-30"
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </form>
  );
}
