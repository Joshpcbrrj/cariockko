import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface Lesson {
  id: string;
  title: string;
  level: string;
}

interface PageProps {
  params: Promise<{ level: string }>;
}

export default async function LessonsPage({ params }: PageProps) {
  const { level } = await params;

  let lessons: Lesson[] = [];
  let error: string | null = null;

  try {
    lessons = await apiFetch<Lesson[]>(`/api/lessons?level=${level}`);
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : "Failed to load lessons";
  }

  const levelTitles: Record<string, { pt: string; en: string }> = {
    beginner: { pt: "Iniciante", en: "Beginner" },
    intermediate: { pt: "Intermediário", en: "Intermediate" },
    advanced: { pt: "Avançado", en: "Advanced" },
  };

  const titles = levelTitles[level] ?? { pt: level, en: level };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-7 px-4 py-6 pb-24 sm:px-7 md:px-10 md:py-10 md:pb-12">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Biblioteca de lições</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{titles.pt}</h1>
          </div>
          {lessons.length > 0 && (
            <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              {lessons.length} {lessons.length === 1 ? "lição" : "lições"}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              Erro ao carregar lições: {error}
            </p>
          </div>
        )}

        {!lessons || lessons.length === 0 ? (
          <div className="flex flex-col items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xl font-semibold text-slate-950">
              Nenhuma lição de {titles.pt.toLowerCase()} ainda
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Você pode começar contando suas preferências ou gerar sugestões rápidas para este
              nível.
            </p>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Link
                href={`/create-lessons?mode=guided&level=${level}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Sparkles size={16} />
                Criar com minhas preferências
              </Link>
              <Link
                href={`/create-lessons?mode=quick&level=${level}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
              >
                <Sparkles size={16} />
                Gerar sugestões deste nível
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/lesson/${lesson.id}`}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                  Lição {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-sm font-semibold leading-6 text-slate-900">
                  {lesson.title}
                </h3>
                <span className="mt-4 block text-xs font-medium text-indigo-700 opacity-0 transition group-hover:opacity-100">Começar prática →</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
