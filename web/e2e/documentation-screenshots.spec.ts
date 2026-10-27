import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

test.skip(!process.env.UPDATE_DOC_SCREENSHOTS, "Run with UPDATE_DOC_SCREENSHOTS=1 to refresh README images");

test("capture documentation screenshots", async ({ page }) => {
  const screenshotDirectory = join(process.cwd(), "..", "docs", "screenshots");
  await mkdir(screenshotDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Olá, vamos praticar?" })).toBeVisible();
  await hideDevelopmentBadge(page);
  await page.screenshot({
    path: join(screenshotDirectory, "01-home-level-selection.png"),
    fullPage: true,
  });

  await page.goto("/lessons/beginner");
  await expect(page.getByRole("heading", { name: "Iniciante" })).toBeVisible();
  await hideDevelopmentBadge(page);
  await page.screenshot({
    path: join(screenshotDirectory, "02-lessons-list.png"),
    fullPage: true,
  });

  await page.goto("/lesson/e2e-lesson");
  await expect(page.getByRole("heading", { name: "At the Café" })).toBeVisible();
  await hideDevelopmentBadge(page);
  await page.screenshot({
    path: join(screenshotDirectory, "03-lesson-player.png"),
    fullPage: true,
  });

  await page.goto("/create-lessons");
  await expect(page.getByRole("heading", { name: "Crie suas lições" })).toBeVisible();
  await hideDevelopmentBadge(page);
  await page.screenshot({
    path: join(screenshotDirectory, "04-create-lessons.png"),
    fullPage: true,
  });

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Provedor de IA" })).toBeVisible();
  await hideDevelopmentBadge(page);
  await page.screenshot({
    path: join(screenshotDirectory, "05-ai-settings.png"),
    fullPage: true,
  });
});

async function hideDevelopmentBadge(page: import("@playwright/test").Page) {
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
}
