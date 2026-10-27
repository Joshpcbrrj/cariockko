import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";

const mockSetProvider = vi.fn();
const mockGetLocalAIStatus = vi.fn();
const mockGetConfiguration = vi.fn();

vi.mock("../lib/ai-provider.js", () => ({
  getAIProviderConfiguration: () => mockGetConfiguration(),
  getLocalAIStatus: () => mockGetLocalAIStatus(),
  setAIProvider: (...args: unknown[]) => mockSetProvider(...args),
}));

import { settingsRouter } from "./settings.js";

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/settings", settingsRouter);
  return app;
}

describe("AI settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConfiguration.mockReturnValue({
      provider: "openai",
      openaiConfigured: true,
    });
    mockGetLocalAIStatus.mockResolvedValue([
      { service: "ollama", ready: true },
      { service: "transcription", ready: true },
      { service: "speech", ready: true },
    ]);
    mockSetProvider.mockResolvedValue(undefined);
  });

  it("reports selected provider and local service readiness", async () => {
    const response = await request(makeApp()).get("/api/settings/ai");

    expect(response.status).toBe(200);
    expect(response.body.provider).toBe("openai");
    expect(response.body.localReady).toBe(true);
    expect(response.body.localServices).toHaveLength(3);
  });

  it("persists a selected local provider when all local services are ready", async () => {
    const response = await request(makeApp())
      .put("/api/settings/ai")
      .send({ provider: "ollama" });

    expect(response.status).toBe(200);
    expect(mockSetProvider).toHaveBeenCalledWith("ollama");
  });

  it("rejects local mode if a local audio service is unavailable", async () => {
    mockGetLocalAIStatus.mockResolvedValueOnce([
      { service: "ollama", ready: true },
      { service: "transcription", ready: false },
      { service: "speech", ready: true },
    ]);

    const response = await request(makeApp())
      .put("/api/settings/ai")
      .send({ provider: "ollama" });

    expect(response.status).toBe(409);
    expect(response.body.unavailable).toEqual(["transcription"]);
    expect(mockSetProvider).not.toHaveBeenCalled();
  });

  it("does not allow OpenAI when its API key is missing", async () => {
    mockGetConfiguration.mockReturnValue({
      provider: "ollama",
      openaiConfigured: false,
    });

    const response = await request(makeApp())
      .put("/api/settings/ai")
      .send({ provider: "openai" });

    expect(response.status).toBe(409);
    expect(mockSetProvider).not.toHaveBeenCalled();
  });

  it("validates the requested provider", async () => {
    const response = await request(makeApp())
      .put("/api/settings/ai")
      .send({ provider: "other" });

    expect(response.status).toBe(400);
    expect(mockSetProvider).not.toHaveBeenCalled();
  });
});
