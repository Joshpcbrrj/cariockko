import { describe, expect, it } from "vitest";
import { jsPDF } from "jspdf";
import {
  createLessonStudyPackage,
  encodeLessonStudyPackage,
  lessonPdfFilename,
} from "./lesson-pdf";

const lesson = {
  id: "lesson-123",
  title: "At the Café",
  level: "beginner",
  exchanges: [
    {
      speaker: "app" as const,
      english_text: "Good morning!",
      portuguese_translation: "Bom dia!",
    },
    {
      speaker: "student" as const,
      english_text: "I'd like a coffee, please.",
      portuguese_translation: "Eu gostaria de um café, por favor.",
    },
  ],
};

describe("lesson PDF study package", () => {
  it("creates the Projeto Palavras text material format with dialogue and translation", () => {
    const study = createLessonStudyPackage(lesson, new Date("2026-10-26T12:00:00.000Z"));

    expect(study).toMatchObject({
      app: "aprendendo-palavras",
      versao: 3,
      id: "lesson-123",
      tipo: "texto",
      titulo: "At the Café",
      idioma: "en-US",
      nivel: "iniciante",
      revisao: {
        etapa: 0,
        intervaloDias: 1,
        revisarEm: "2026-10-27",
        historico: [],
      },
    });
    expect(study.texto).toBe("Aimee: Good morning!\n\nTodd: I'd like a coffee, please.");
    expect(study.traducao).toBe("Aimee: Bom dia!\n\nTodd: Eu gostaria de um café, por favor.");
  });

  it("encodes UTF-8 data with the importer metadata marker", () => {
    const study = createLessonStudyPackage(lesson);
    const encoded = encodeLessonStudyPackage(study);
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(encoded.split(":")[2] ?? ""), (character) =>
          character.charCodeAt(0)
        )
      )
    );

    expect(encoded).toMatch(/^aprendendo-palavras:v3:/);
    expect(payload.titulo).toBe("At the Café");
    expect(payload.traducao).toContain("café");
  });

  it("writes the encoded study package into the PDF Keywords metadata", () => {
    const encoded = encodeLessonStudyPackage(createLessonStudyPackage(lesson));
    const pdf = new jsPDF();
    pdf.setProperties({ keywords: encoded });

    expect(pdf.output()).toContain(`/Keywords (${encoded})`);
  });

  it("creates a safe descriptive filename", () => {
    expect(lessonPdfFilename("Café & Conversação!")).toBe("cafe-conversacao.pdf");
    expect(lessonPdfFilename("")).toBe("licao.pdf");
  });
});
