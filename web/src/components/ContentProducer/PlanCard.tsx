"use client";

import { ClipboardList, Pencil, Check } from "lucide-react";
import type { GenerationPlan } from "@/lib/api";

function getLevelLabel(level: "beginner" | "intermediate" | "advanced"): string {
  return { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" }[level];
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}

export function PlanCard({
  plan,
  onConfirm,
  onEdit,
}: {
  plan: GenerationPlan;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const total = plan.lessons.reduce((sum, l) => sum + l.count, 0);
  const levels = Array.from(new Set(plan.lessons.map((l) => l.level)));
  const themes = Array.from(new Set(plan.lessons.map((l) => l.theme)));

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-3 text-indigo-800">
        <ClipboardList size={16} />
        <h2 className="text-sm font-semibold">Plano de Geração / Generation Plan</h2>
      </div>
      <dl className="divide-y divide-slate-100 px-4 py-3 text-sm">
        <PlanRow label="Número de lições" value={`${total}`} />
        <PlanRow label="Nível" value={levels.map(getLevelLabel).join(", ")} />
        <PlanRow label="Tema" value={themes.join(", ")} />
        <PlanRow
          label="Personagens"
          value={`${plan.characters.app} & ${plan.characters.student}`}
        />
        <PlanRow
          label="Tempo estimado"
          value={`~${plan.estimatedMinutes} min`}
        />
      </dl>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
        >
          <Pencil size={14} />
          Editar Plano
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Check size={14} />
          Confirmar e Gerar
        </button>
      </div>
    </div>
  );
}
