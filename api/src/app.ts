import express from "express";
import cors from "cors";
import multer from "multer";
import { lessonsRouter } from "./routes/lessons.js";
import { speakingTutorRouter } from "./routes/speaking-tutor.js";
import { progressRouter } from "./routes/progress.js";
import { contentProducerRouter } from "./routes/content-producer.js";
import { settingsRouter } from "./routes/settings.js";

export function createApp() {
  const app = express();
  const upload = multer({ storage: multer.memoryStorage() });

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/health/live", (_req, res) => {
    res.json({ status: "live" });
  });

  app.get("/health/ready", async (_req, res) => {
    try {
      const { pool } = await import("./lib/db.js");
      await pool.query("SELECT 1");
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "error" });
    }
  });

  app.use("/api/lessons", lessonsRouter);
  app.use("/api/speaking-tutor", upload.single("audio"), speakingTutorRouter);
  app.use("/api/progress", progressRouter);
  app.use("/api/content-producer", contentProducerRouter);
  app.use("/api/settings", settingsRouter);

  return app;
}
