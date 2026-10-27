"use client";

import { Sparkles } from "lucide-react";

export function WelcomeView({
  onQuickStart,
  onGuidedStart,
  defaultFlow,
}: {
  onQuickStart: () => void;
  onGuidedStart: () => void;
  defaultFlow: "quick" | "guided";
}) {
  const primaryQuick = defaultFlow === "quick";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
        <Sparkles size={24} />
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          Crie suas lições
        </h1>
        <p className="text-sm leading-6 text-slate-500 md:text-base">
          Você pode começar com um plano rápido ou me contar suas preferências para criar suas
          primeiras lições de forma guiada.
        </p>
      </div>
      <div className="flex w-full max-w-lg flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={primaryQuick ? onQuickStart : onGuidedStart}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
            primaryQuick
              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
          }`}
        >
          <Sparkles size={16} />
          {primaryQuick ? "Gerar lições sugeridas" : "Criar com minhas preferências"}
        </button>
        <button
          type="button"
          onClick={primaryQuick ? onGuidedStart : onQuickStart}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
        >
          <Sparkles size={16} />
          {primaryQuick ? "Criar com minhas preferências" : "Gerar lições sugeridas"}
        </button>
      </div>
    </div>
  );
}
