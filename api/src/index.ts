import { initializeAIProvider } from "./lib/ai-provider.js";
import { createApp } from "./app.js";
const app = createApp();
const port = process.env.PORT ?? 3001;

void initializeAIProvider()
  .then(() => {
    app.listen(port, () => {
      console.log(`Cariockko API running on port ${port}`);
    });
  })
  .catch((err: unknown) => {
    console.error("Failed to initialize AI provider settings:", err);
    process.exitCode = 1;
  });
