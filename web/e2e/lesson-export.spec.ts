import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("persists the selected dark theme across page navigation and reloads", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Ativar modo escuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(11, 18, 32)");
  await expect(page.getByText("Lições na biblioteca").locator("xpath=../.."))
    .toHaveCSS("background-color", "rgb(17, 26, 43)");
  await expect(page.getByRole("heading", { name: "Olá, vamos praticar?" }))
    .toHaveCSS("color", "rgb(248, 250, 252)");

  await page.goto("/settings");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Ativar modo claro" })).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Ativar modo claro" })).toBeVisible();
});

test("exports a lesson PDF that contains the importable study package", async ({ page }) => {
  await page.goto("/lesson/e2e-lesson");

  await expect(page.getByRole("heading", { name: "At the Café" })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "Exportar lição em PDF para projeto palavras",
  })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", {
    name: "Exportar lição em PDF para projeto palavras",
  }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(filePath).not.toBeNull();

  const pdf = await readFile(filePath!);
  const pdfText = pdf.toString("latin1");
  const encodedPackage = pdfText.match(
    /\/Keywords \(aprendendo-palavras:v3:([A-Za-z0-9+/=]+)\)/
  )?.[1];

  expect(download.suggestedFilename()).toBe("at-the-cafe.pdf");
  expect(pdfText).toContain("Good morning!");
  expect(encodedPackage).toBeTruthy();

  const study = JSON.parse(Buffer.from(encodedPackage!, "base64").toString("utf8"));
  expect(study.tipo).toBe("texto");
  expect(study.texto).toContain("Aimee: Good morning!");
  expect(study.texto).toContain("Todd: I'd like a coffee, please.");
  expect(study.traducao).toContain("Aimee: Bom dia!");
  expect(study.traducao).toContain("Todd: Eu gostaria de um café, por favor.");
});
