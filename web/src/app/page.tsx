import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { apiFetch } from "@/lib/api";
import { Sparkles, BookOpen, ArrowUpRight, Headphones, Mic2, Library } from "lucide-react";

const levels = [
  {
    id: "beginner",
    title: "Beginner",
    titlePt: "Iniciante",
    description: "Vocabulário simples e conversas básicas",
  },
  {
    id: "intermediate",
    title: "Intermediate",
    titlePt: "Intermediário",
    description: "Tópicos do dia a dia e frases mais longas",
  },
  {
    id: "advanced",
    title: "Advanced",
    titlePt: "Avançado",
    description: "Discussões complexas e linguagem sofisticada",
  },
];

interface Lesson {
  id: string;
  title: string;
  level: string;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  let lessons: Lesson[] = [];
  try {
    lessons = await apiFetch<Lesson[]>("/api/lessons");
  } catch {
    lessons = [];
  }
  const totalLessons = lessons.length;
  const lessonCounts = lessons.reduce<Record<string, number>>((counts, lesson) => {
    counts[lesson.level] = (counts[lesson.level] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-4 py-6 pb-24 sm:px-7 md:px-10 md:py-10 md:pb-12">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Seu espaço de aprendizagem</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Olá, vamos praticar?</h1>
          </div>
          <Link href="/settings" aria-label="Configurações" className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-indigo-700 sm:flex">
            <span className="text-sm font-semibold">AI</span>
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#322B79] via-[#5549B6] to-[#7869E6] px-6 py-8 text-white shadow-xl shadow-indigo-200/60 sm:px-9 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium tracking-wide text-indigo-50">
              <Sparkles size={13} /> APRENDIZADO COM IA
            </span>
            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Fale inglês com mais confiança, uma conversa por vez.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100">Pratique diálogos reais no seu ritmo e receba feedback em português para evoluir sem medo de errar.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/create-lessons?mode=quick" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50">
                Criar minhas lições <ArrowUpRight size={16} />
              </Link>
              {totalLessons > 0 && <Link href="/lessons/beginner" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20">Ver biblioteca</Link>}
            </div>
          </div>
          <div aria-hidden className="absolute -right-14 -top-20 h-72 w-72 rounded-full border-[34px] border-white/[0.07]" />
          <div aria-hidden className="absolute -bottom-36 right-28 h-72 w-72 rounded-full border-[1px] border-white/10" />
          <div aria-hidden className="absolute bottom-8 right-12 hidden h-24 w-24 rotate-12 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur sm:flex">
            <Headphones size={38} strokeWidth={1.5} />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Lições na biblioteca", value: totalLessons, icon: Library, color: "bg-indigo-50 text-indigo-700" },
            { label: "Níveis para explorar", value: 3, icon: BookOpen, color: "bg-emerald-50 text-emerald-700" },
            { label: "Prática de conversação", value: "No seu ritmo", icon: Mic2, color: "bg-amber-50 text-amber-700" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/40">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></span>
              <span><span className="block text-lg font-semibold tracking-tight text-slate-900">{value}</span><span className="mt-0.5 block text-xs text-slate-500">{label}</span></span>
            </div>
          ))}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Escolha seu nível</h2>
              <p className="mt-1 text-sm text-slate-500">Comece de onde você está. Você pode mudar quando quiser.</p>
            </div>
            {totalLessons > 0 && <span className="hidden text-xs text-slate-400 sm:inline">{totalLessons} lições disponíveis</span>}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {levels.map((level, index) => {
              const themes = [
                "Vocabulário essencial e diálogos simples",
                "Conversas do cotidiano e mais fluidez",
                "Ideias complexas e expressão natural",
              ];
              const accents = [
                "from-sky-50 to-indigo-50 text-indigo-700",
                "from-emerald-50 to-teal-50 text-emerald-700",
                "from-amber-50 to-orange-50 text-amber-700",
              ];
              return (
                <Link key={level.id} href={`/lessons/${level.id}`} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/70">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[index]} font-semibold`}>
                    <span className="text-sm">0{index + 1}</span>
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{level.titlePt}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{level.title}</h3>
                    </div>
                    <ArrowUpRight size={18} className="text-slate-300 transition group-hover:text-indigo-600" />
                  </div>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{themes[index]}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                    <span className="font-medium text-slate-600">{lessonCounts[level.id] ?? 0} lições</span>
                    <span className="font-medium text-indigo-700">Explorar nível <span aria-hidden>→</span></span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Quer praticar com um assunto que você gosta?</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">Crie um plano personalizado com temas da sua rotina, trabalho ou viagem.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/create-lessons?mode=guided" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"><BookOpen size={14} /> Personalizar</Link>
            <Link href="/create-lessons?mode=quick" className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"><Sparkles size={14} /> Plano rápido</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
