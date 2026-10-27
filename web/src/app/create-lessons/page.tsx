import { Sidebar } from "@/components/Sidebar";
import { ContentProducerChat } from "@/components/ContentProducer/ContentProducerChat";

export const dynamic = "force-dynamic";

export default async function CreateLessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; level?: string }>;
}) {
  const { mode, level } = await searchParams;
  const initialMode = mode === "guided" ? "guided" : "quick";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex flex-1 flex-col bg-slate-50 px-3 py-3 pb-24 sm:px-5 md:px-8 md:py-8 md:pb-8">
        <ContentProducerChat initialMode={initialMode} preferredLevel={level} />
      </main>
    </div>
  );
}
