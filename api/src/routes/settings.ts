import { Router } from "express";
import { z } from "zod";
import {
  getAIProviderConfiguration,
  getLocalAIStatus,
  setAIProvider,
  type AIProvider,
} from "../lib/ai-provider.js";

export const settingsRouter = Router();

const ProviderSchema = z.object({
  provider: z.enum(["openai", "ollama"]),
});

settingsRouter.get("/ai", async (_req, res) => {
  const [configuration, localServices] = await Promise.all([
    Promise.resolve(getAIProviderConfiguration()),
    getLocalAIStatus(),
  ]);
  res.json({
    ...configuration,
    localReady: localServices.every((service) => service.ready),
    localServices,
  });
});

settingsRouter.put("/ai", async (req, res) => {
  const parsed = ProviderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid provider", details: parsed.error.flatten() });
    return;
  }

  const provider: AIProvider = parsed.data.provider;
  const config = getAIProviderConfiguration();
  if (provider === "openai" && !config.openaiConfigured) {
    res.status(409).json({
      error: "Configure OPENAI_API_KEY no arquivo .env antes de selecionar OpenAI.",
    });
    return;
  }

  if (provider === "ollama") {
    const localServices = await getLocalAIStatus();
    const unavailable = localServices.filter((service) => !service.ready);
    if (unavailable.length > 0) {
      res.status(409).json({
        error: "Inicie e configure Ollama, o serviço de transcrição e o serviço de voz locais antes de selecionar o modo local.",
        unavailable: unavailable.map((service) => service.service),
      });
      return;
    }
  }

  try {
    await setAIProvider(provider);
    res.json(getAIProviderConfiguration());
  } catch (err) {
    console.error("[settings/ai] Failed to save provider:", err);
    res.status(500).json({ error: "Não foi possível salvar o provedor de IA." });
  }
});
