export interface LessonPdfExchange {
  speaker: "app" | "student";
  english_text: string;
  portuguese_translation: string;
}

export interface LessonStudyPackage {
  app: "aprendendo-palavras";
  versao: 3;
  id: string;
  tipo: "texto";
  titulo: string;
  idioma: "en-US";
  criadoEm: string;
  revisao: {
    etapa: number;
    intervaloDias: number;
    revisarEm: string;
    historico: string[];
  };
  nivel: "iniciante" | "intermediario" | "fluente";
  texto: string;
  traducao: string;
}

const LEVEL_MAP: Record<string, LessonStudyPackage["nivel"]> = {
  beginner: "iniciante",
  intermediate: "intermediario",
  advanced: "fluente",
};

function dialogueText(
  exchanges: LessonPdfExchange[],
  field: "english_text" | "portuguese_translation"
): string {
  return exchanges
    .map((exchange) => {
      const character = exchange.speaker === "app" ? "Aimee" : "Todd";
      return `${character}: ${exchange[field].trim()}`;
    })
    .join("\n\n");
}

export function createLessonStudyPackage(
  lesson: {
    id: string;
    title: string;
    level: string;
    exchanges: LessonPdfExchange[];
  },
  createdAt = new Date()
): LessonStudyPackage {
  const reviewDate = new Date(createdAt);
  reviewDate.setUTCDate(reviewDate.getUTCDate() + 1);

  return {
    app: "aprendendo-palavras",
    versao: 3,
    id: lesson.id,
    tipo: "texto",
    titulo: lesson.title.slice(0, 200),
    idioma: "en-US",
    criadoEm: createdAt.toISOString(),
    revisao: {
      etapa: 0,
      intervaloDias: 1,
      revisarEm: reviewDate.toISOString().slice(0, 10),
      historico: [],
    },
    nivel: LEVEL_MAP[lesson.level] ?? "intermediario",
    texto: dialogueText(lesson.exchanges, "english_text"),
    traducao: dialogueText(lesson.exchanges, "portuguese_translation"),
  };
}

export function encodeLessonStudyPackage(study: LessonStudyPackage): string {
  const bytes = new TextEncoder().encode(JSON.stringify(study));
  let binary = "";
  const chunkSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }

  return `aprendendo-palavras:v3:${btoa(binary)}`;
}

export function lessonPdfFilename(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${slug || "licao"}.pdf`;
}
