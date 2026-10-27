"use client";

import { Check, Loader, X, CircleCheck, CircleDashed, CircleAlert, RefreshCw } from "lucide-react";
import type { JobSnapshot, LessonProgress } from "@/lib/api";

function getLevelLabel(level: "beginner" | "intermediate" | "advanced"): string {
  return { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" }[level];
}

function StatusIcon({ status }: { status: LessonProgress["status"] }) {
  if (status === "completed") {
    return <CircleCheck size={18} className="shrink-0 text-emerald-600" />;
  }
  if (status === "generating") {
    return <Loader size={18} className="shrink-0 animate-spin text-indigo-600" />;
  }
  if (status === "failed") {
    return <CircleAlert size={18} className="shrink-0 text-rose-600" />;
  }
  return <CircleDashed size={18} className="shrink-0 text-slate-300" />;
}

function LessonRow({
  lesson,
  index,
  onRetry,
}: {
  lesson: LessonProgress;
  index: number;
  onRetry: (idx: number) => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3" data-testid={`lesson-row-${index}`}>
      <StatusIcon status={lesson.status} />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium text-slate-800">
          {lesson.title ?? lesson.theme}
        </div>
        <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {getLevelLabel(lesson.level)}
          {lesson.error ? ` · ${lesson.error}` : ""}
        </div>
      </div>
      {lesson.status === "failed" && (
        <button
          type="button"
          onClick={() => onRetry(index)}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold tracking-wide text-rose-700 transition hover:bg-rose-50"
          aria-label="Tentar novamente"
        >
          <RefreshCw size={12} />
          TENTAR NOVAMENTE
        </button>
      )}
    </li>
  );
}

export function GenerationProgressCard({
  job,
  onRetry,
  onCancel,
}: {
  job: JobSnapshot;
  onRetry: (lessonIndex: number) => void;
  onCancel?: () => void;
}) {
  const { progress } = job;
  const percent = progress.total === 0 ? 0 : Math.round((progress.completed / progress.total) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-3 text-indigo-800">
        {job.status === "running" ? (
          <Loader size={16} className="animate-spin" />
        ) : (
          <Check size={16} />
        )}
        <h2 className="text-sm font-semibold">
          {job.status === "running" ? "Gerando Lições…" : "Geração concluída"}
        </h2>
      </div>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between text-sm text-slate-800">
          <span>
            {progress.completed} de {progress.total} lições criadas
          </span>
          <span className="font-mono text-[11px] font-semibold text-slate-500">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
      <ul className="divide-y divide-slate-100 px-4 py-2">
        {progress.lessons.map((lesson, idx) => (
          <LessonRow key={`${lesson.level}-${lesson.theme}-${idx}`} lesson={lesson} index={idx} onRetry={onRetry} />
        ))}
      </ul>
      {onCancel && (
        <div className="flex justify-end border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <X size={14} />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
