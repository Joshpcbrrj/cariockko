"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import type { jsPDF } from "jspdf";
import {
  createLessonStudyPackage,
  encodeLessonStudyPackage,
  lessonPdfFilename,
  type LessonPdfExchange,
} from "@/lib/lesson-pdf";

interface LessonPdfExportButtonProps {
  lesson: {
    id: string;
    title: string;
    level: string;
    exchanges: LessonPdfExchange[];
  };
}

function addDialogueSection(
  pdf: jsPDF,
  title: string,
  exchanges: LessonPdfExchange[],
  field: "english_text" | "portuguese_translation"
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 20;
  const right = 20;
  const contentWidth = pageWidth - left - right;
  const bottom = pageHeight - 22;
  let y = 34;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(33, 39, 61);
  pdf.text(title, left, y);
  y += 14;

  for (const exchange of exchanges) {
    const character = exchange.speaker === "app" ? "Aimee" : "Todd";
    const wrapped = pdf.splitTextToSize(exchange[field].trim(), contentWidth);
    const neededHeight = 7 + wrapped.length * 6 + 8;

    if (y + neededHeight > bottom) {
      pdf.addPage();
      y = 22;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(102, 88, 211);
    pdf.text(character, left, y);
    y += 6;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(44, 52, 69);
    pdf.text(wrapped, left, y);
    y += wrapped.length * 6 + 8;
  }
}

export function LessonPdfExportButton({ lesson }: LessonPdfExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportPdf() {
    setExporting(true);
    setError(null);
    try {
      const { jsPDF } = await import("jspdf");
      const study = createLessonStudyPackage(lesson);
      const pdf = new jsPDF({ format: "a4", unit: "mm" });
      pdf.setProperties({
        title: lesson.title.slice(0, 200),
        subject: "Aprendendo Palavras - texto",
        author: "Cariockko",
        creator: "Cariockko",
        keywords: encodeLessonStudyPackage(study),
      });

      addDialogueSection(pdf, lesson.title, lesson.exchanges, "english_text");
      pdf.addPage();
      addDialogueSection(pdf, "Tradução (português)", lesson.exchanges, "portuguese_translation");

      for (let page = 1; page <= pdf.getNumberOfPages(); page += 1) {
        pdf.setPage(page);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setDrawColor(229, 232, 240);
        pdf.line(20, pageHeight - 16, pageWidth - 20, pageHeight - 16);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(132, 144, 165);
        pdf.text("Cariockko · Aprendendo Palavras", 20, pageHeight - 10);
        pdf.text(`Página ${page} de ${pdf.getNumberOfPages()}`, pageWidth - 20, pageHeight - 10, {
          align: "right",
        });
      }

      pdf.save(lessonPdfFilename(lesson.title));
    } catch (exportError) {
      console.error("[LessonPdfExportButton] Export failed:", exportError);
      setError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-30 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 md:bottom-6 md:right-6">
      {error && (
        <p role="alert" className="max-w-xs rounded-xl border border-rose-100 bg-white px-4 py-3 text-xs text-rose-700 shadow-lg">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void exportPdf()}
        disabled={exporting || lesson.exchanges.length === 0}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-left text-xs font-semibold text-white shadow-lg shadow-indigo-300/50 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
        aria-label="Exportar lição em PDF para projeto palavras"
      >
        {exporting ? (
          <LoaderCircle size={17} className="shrink-0 animate-spin" />
        ) : (
          <Download size={17} className="shrink-0" />
        )}
        <span>Exportar lição em PDF para projeto palavras</span>
      </button>
    </div>
  );
}
