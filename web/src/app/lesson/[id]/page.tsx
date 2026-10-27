import { apiFetch } from "@/lib/api";
import { LessonPlayer } from "@/components/LessonPlayer";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { LessonPdfExportButton } from "@/components/LessonPdfExportButton";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface DialogueExchange {
  id: string;
  lesson_id: string;
  order_index: number;
  speaker: "app" | "student";
  english_text: string;
  portuguese_translation: string;
  audio_url: string | null;
}

interface Lesson {
  id: string;
  title: string;
  level: string;
  exchanges: DialogueExchange[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { id } = await params;

  let lesson: Lesson | null = null;
  let error: string | null = null;

  try {
    lesson = await apiFetch<Lesson>(`/api/lessons/${id}`);
  } catch (err: unknown) {
    error = err instanceof Error ? err.message : "Failed to load lesson";
  }

  if (error || !lesson) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-7 md:px-10 md:py-10 md:pb-12">
          <Link
            href="/"
            className="mb-6 inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          <div className="flex flex-col items-center gap-2 py-12">
            <p className="text-lg text-slate-500">
              Lição não encontrada
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-7 md:px-10 md:py-10 md:pb-12">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/lessons/${lesson.level}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar para {lesson.level}</span>
            <span className="sm:hidden">Voltar</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">{lesson.level}</p>
            <h1 className="mt-1 break-words text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">{lesson.title}</h1>
          </div>
        </div>

        <LessonPlayer
          lessonId={lesson.id}
          exchanges={lesson.exchanges ?? []}
        />
        <LessonPdfExportButton
          lesson={{
            id: lesson.id,
            title: lesson.title,
            level: lesson.level,
            exchanges: lesson.exchanges ?? [],
          }}
        />
      </main>
    </div>
  );
}
