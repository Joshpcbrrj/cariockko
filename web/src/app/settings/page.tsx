import { Sidebar } from "@/components/Sidebar";
import { AIProviderSettings } from "@/components/AIProviderSettings";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 md:flex-row">
      <Sidebar />
      <main className="flex-1 px-5 py-8 pb-24 md:px-12 md:py-12 md:pb-12">
        <AIProviderSettings />
      </main>
    </div>
  );
}
