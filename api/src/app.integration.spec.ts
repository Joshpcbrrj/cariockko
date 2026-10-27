import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const mockGetAIProviderConfiguration = vi.fn();
const mockGetLocalAIStatus = vi.fn();

vi.mock("./lib/ai-provider.js", () => ({
  getAIProviderConfiguration: () => mockGetAIProviderConfiguration(),
  getLocalAIStatus: () => mockGetLocalAIStatus(),
  setAIProvider: vi.fn(),
  initializeAIProvider: vi.fn(),
}));

import { createApp } from "./app.js";

describe("API application integration", () => {
  beforeEach(() => {
    mockGetAIProviderConfiguration.mockReturnValue({
      provider: "openai",
      openaiConfigured: true,
    });
    mockGetLocalAIStatus.mockResolvedValue([
      { service: "ollama", ready: true },
      { service: "transcription", ready: true },
      { service: "speech", ready: true },
    ]);
  });

  it("serves health checks through the configured Express application", async () => {
    const app = createApp();

    await request(app).get("/health").expect(200, { status: "ok" });
    await request(app).get("/health/live").expect(200, { status: "live" });
  });

  it("mounts the AI settings route and returns its combined status", async () => {
    const response = await request(createApp()).get("/api/settings/ai").expect(200);

    expect(response.body).toEqual({
      provider: "openai",
      openaiConfigured: true,
      localReady: true,
      localServices: [
        { service: "ollama", ready: true },
        { service: "transcription", ready: true },
        { service: "speech", ready: true },
      ],
    });
  });

  it("applies JSON middleware and route validation", async () => {
    const response = await request(createApp())
      .put("/api/settings/ai")
      .send({ provider: "unsupported" })
      .expect(400);

    expect(response.body.error).toBe("Invalid provider");
  });
});
