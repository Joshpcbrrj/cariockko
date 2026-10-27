"use client";

import { useEffect, useState } from "react";
import { Check, Cloud, Cpu, LoaderCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ProviderSettings {
  provider: "openai" | "ollama";
  openaiConfigured: boolean;
  localReady: boolean;
  localServices: { service: string; ready: boolean }[];
}

export function AIProviderSettings() {
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ProviderSettings>("/api/settings/ai")
      .then(setSettings)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Não foi possível carregar as configurações.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function chooseProvider(provider: ProviderSettings["provider"]) {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiFetch<ProviderSettings>("/api/settings/ai", {
        method: "PUT",
        body: JSON.stringify({ provider }),
      });
      setSettings(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar o provedor.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando configurações...</p>;
  }

  if (!settings) {
    return <p role="alert" className="text-sm text-red-700">{error}</p>;
  }

  const options = [
    {
      id: "ollama" as const,
      icon: Cpu,
      title: "IA local · Ollama",
      description: "Processa texto e áudio na sua máquina. Requer Ollama, serviço local de transcrição e serviço local de voz.",
      detail: settings.localReady
        ? "Ollama, transcrição e síntese de voz locais estão respondendo."
        : `Serviços indisponíveis: ${settings.localServices
            .filter((service) => !service.ready)
            .map(({ service }) => ({
              ollama: "Ollama/modelo",
              transcription: "transcrição",
              speech: "síntese de voz",
            }[service] ?? service))
            .join(", ") || "verifique a configuração local"}.`,
      configured: settings.localReady,
    },
    {
      id: "openai" as const,
      icon: Cloud,
      title: "OpenAI · Nuvem",
      description: "Usa os modelos OpenAI para conversa, geração de lições, transcrição e voz. Requer internet e uma chave válida.",
      detail: settings.openaiConfigured ? "Chave OPENAI_API_KEY encontrada no servidor." : "OPENAI_API_KEY não está configurada no servidor.",
      configured: settings.openaiConfigured,
    },
  ];

  return (
    <section className="max-w-3xl">
      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Preferências</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Provedor de IA</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Escolha onde o Cariockko processa as conversas, as lições e o áudio. A seleção vale para toda esta instalação.
        </p>
      </div>

      <div className="grid gap-4">
        {options.map(({ id, icon: Icon, title, description, detail, configured }) => {
          const selected = settings.provider === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => void chooseProvider(id)}
              disabled={saving || !configured || selected}
              aria-pressed={selected}
              className={`rounded-2xl border p-5 text-left transition ${
                selected
                  ? "border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <span className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-950">{title}</span>
                    {selected && <Check size={18} className="shrink-0 text-indigo-700" aria-label="Selecionado" />}
                    {saving && !selected && <LoaderCircle size={18} className="animate-spin text-slate-500" aria-label="Salvando" />}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
                  <span className={`mt-3 block text-xs ${configured ? "text-slate-500" : "font-medium text-amber-700"}`}>{detail}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <p className="mt-6 text-xs leading-5 text-slate-500">
        No modo local, nenhum áudio ou texto é enviado à OpenAI. Os endereços dos serviços locais podem ser ajustados no arquivo .env; a chave OpenAI, quando usada, permanece apenas no servidor.
      </p>
    </section>
  );
}
