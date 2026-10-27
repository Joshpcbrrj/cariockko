import { ChatOpenAI } from "@langchain/openai";
import OpenAI from "openai";
import { pool } from "./db.js";

export type AIProvider = "openai" | "ollama";

const PROVIDERS: AIProvider[] = ["openai", "ollama"];
let activeProvider: AIProvider =
  process.env.AI_PROVIDER === "ollama" ? "ollama" : "openai";

function getOpenAIKey(): string | undefined {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key && key !== "sk-your-openai-api-key" ? key : undefined;
}

export async function initializeAIProvider(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT NOT NULL CHECK (provider IN ('openai', 'ollama')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await pool.query<{ provider: AIProvider }>(
    "SELECT provider FROM ai_settings WHERE id = 1"
  );
  const savedProvider = rows[0]?.provider;
  if (savedProvider && PROVIDERS.includes(savedProvider)) {
    activeProvider = savedProvider;
  } else {
    await pool.query(
      `INSERT INTO ai_settings (id, provider) VALUES (1, $1)
       ON CONFLICT (id) DO NOTHING`,
      [activeProvider]
    );
  }
}

export function getAIProvider(): AIProvider {
  return activeProvider;
}

export async function setAIProvider(provider: AIProvider): Promise<void> {
  await pool.query(
    `INSERT INTO ai_settings (id, provider, updated_at) VALUES (1, $1, now())
     ON CONFLICT (id) DO UPDATE SET provider = EXCLUDED.provider, updated_at = now()`,
    [provider]
  );
  activeProvider = provider;
}

export function getAIProviderConfiguration() {
  return {
    provider: activeProvider,
    openaiConfigured: Boolean(getOpenAIKey()),
  };
}

export interface LocalServiceStatus {
  service: "ollama" | "transcription" | "speech";
  ready: boolean;
}

async function checkEndpoint(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkOllamaModel(url: string, model: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return false;
    const payload = (await response.json()) as {
      models?: Array<{ name?: string; model?: string }>;
    };
    return (payload.models ?? []).some(({ name, model: modelName }) => {
      const installedName = name ?? modelName ?? "";
      return installedName === model || installedName.startsWith(`${model}:`);
    });
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLocalAIStatus(): Promise<LocalServiceStatus[]> {
  const ollama = (process.env.OLLAMA_BASE_URL ?? "http://host.docker.internal:11434")
    .replace(/\/+$/, "");
  const transcription = (process.env.LOCAL_STT_BASE_URL ?? "http://host.docker.internal:8000/v1")
    .replace(/\/+$/, "");
  const speech = (process.env.LOCAL_TTS_BASE_URL ?? "http://host.docker.internal:8880/v1")
    .replace(/\/+$/, "");
  const ollamaModel = process.env.OLLAMA_MODEL ?? "llama3.1";
  const [ollamaReady, transcriptionReady, speechReady] = await Promise.all([
    checkOllamaModel(`${ollama}/api/tags`, ollamaModel),
    checkEndpoint(`${transcription}/models`),
    checkEndpoint(`${speech}/models`),
  ]);
  return [
    { service: "ollama", ready: ollamaReady },
    { service: "transcription", ready: transcriptionReady },
    { service: "speech", ready: speechReady },
  ];
}

export function createChatModel(
  temperature: number,
  provider: AIProvider = activeProvider
): ChatOpenAI {
  const local = provider === "ollama";
  const apiKey = local ? "ollama" : getOpenAIKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be configured to use the OpenAI provider");
  }

  return new ChatOpenAI({
    model: local
      ? process.env.OLLAMA_MODEL ?? "llama3.1"
      : process.env.OPENAI_MODEL_CHAT ?? "gpt-4o-mini",
    temperature,
    apiKey,
    ...(local
      ? {
          configuration: {
            baseURL: `${(process.env.OLLAMA_BASE_URL ?? "http://host.docker.internal:11434").replace(/\/+$/, "")}/v1`,
          },
        }
      : {}),
  });
}

export function createAudioClient(
  kind: "transcription" | "speech",
  provider: AIProvider = activeProvider
): OpenAI {
  const local = provider === "ollama";
  const configuredBaseURL = local
    ? kind === "transcription"
      ? process.env.LOCAL_STT_BASE_URL ?? "http://host.docker.internal:8000/v1"
      : process.env.LOCAL_TTS_BASE_URL ?? "http://host.docker.internal:8880/v1"
    : undefined;
  const baseURL = configuredBaseURL?.replace(/\/+$/, "");
  const apiKey = local ? "local-provider" : getOpenAIKey();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY must be configured to use the OpenAI provider");
  }

  return new OpenAI({ apiKey, baseURL });
}

export function getAudioModel(
  kind: "transcription" | "speech",
  provider: AIProvider = activeProvider
): string {
  if (provider === "ollama") {
    return kind === "transcription"
      ? process.env.LOCAL_STT_MODEL ?? "Systran/faster-whisper-small"
      : process.env.LOCAL_TTS_MODEL ?? "kokoro";
  }
  return kind === "transcription"
    ? "gpt-4o-mini-transcribe"
    : "gpt-4o-mini-tts";
}
