"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Mic, Square } from "lucide-react";

interface DialogueExchange {
  id: string;
  order_index: number;
  speaker: "app" | "student";
  english_text: string;
  portuguese_translation: string;
  audio_url: string | null;
}

interface LessonPlayerProps {
  lessonId: string;
  exchanges: DialogueExchange[];
}

type ProcessingPhase = "idle" | "uploading" | "transcribing" | "evaluating" | "complete" | "error";

type FeedbackResult = {
  is_correct: boolean;
  feedback_pt: string;
  transcription: string;
} | null;

const PHASE_LABELS: Record<ProcessingPhase, string> = {
  idle: "",
  uploading: "Enviando áudio...",
  transcribing: "Transcrevendo...",
  evaluating: "Avaliando sua fala...",
  complete: "Concluído!",
  error: "Erro",
};

/**
 * Returns the API base for browser fetches. We use a relative path so the
 * request goes to the same origin as the page (Next.js then rewrites it to
 * the API service — see web/next.config.ts). This keeps everything on a
 * single origin/protocol, which avoids mixed-content blocks when the app is
 * served over HTTPS (e.g. for mobile mic access over LAN).
 */
function getApiBaseUrl(): string {
  return "";
}

/**
 * Rewrites a backend-generated audio URL to a same-origin path so the
 * browser fetches it through Next.js (and avoids mixed-content + LAN host
 * issues). Backend stores URLs like `http://localhost:9000/audio/<key>`;
 * we rewrite that to `/audio/<key>`, which next.config.ts proxies to MinIO.
 */
function rewriteAudioUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // MinIO public URLs follow `<host>:9000/<bucket>/<key>`. Our bucket is
    // `audio`, so the pathname already starts with `/audio/...`. Strip the
    // host so the request becomes same-origin.
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

/**
 * Picks the best MediaRecorder mimeType the current browser supports.
 * Order matters: prefer opus (best transcription quality, supported on
 * Chromium/Firefox), fall back to mp4/aac for iOS Safari which does not
 * support webm.
 */
function pickRecorderMime(): { mimeType?: string; extension: string } {
  if (typeof MediaRecorder === "undefined") return { extension: "webm" };
  const candidates: { mime: string; ext: string }[] = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4;codecs=mp4a.40.2", ext: "m4a" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/ogg;codecs=opus", ext: "ogg" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) {
      return { mimeType: c.mime, extension: c.ext };
    }
  }
  // Browser will pick its own default; use a generic extension.
  return { extension: "webm" };
}

function ProcessingStatus({ phase }: { phase: ProcessingPhase }) {
  if (phase === "idle" || phase === "complete" || phase === "error") return null;

  const phases: ProcessingPhase[] = ["uploading", "transcribing", "evaluating"];
  const currentIndex = phases.indexOf(phase);

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="text-sm font-medium text-slate-900">
          {PHASE_LABELS[phase]}
        </span>
      </div>
      <div className="flex gap-2 mt-3">
        {phases.map((p, i) => (
          <div key={p} className="flex-1">
            <div
              className={`h-[3px] ${
                i <= currentIndex ? "bg-indigo-600" : "bg-slate-200"
              }`}
            />
            <span className="mt-1 block font-mono text-[10px] text-slate-400">
              {p === "uploading" ? "Enviar" : p === "transcribing" ? "Transcrever" : "Avaliar"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function LessonPlayer({ lessonId, exchanges }: LessonPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<ProcessingPhase>("idle");
  const [isCompleted, setIsCompleted] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [recordingExtension, setRecordingExtension] = useState<string>("webm");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const currentExchange = exchanges[currentIndex];
  const isAppTurn = currentExchange?.speaker === "app";
  const progress = `${currentIndex + 1}/${exchanges.length}`;
  const isProcessing = processingPhase !== "idle" && processingPhase !== "complete" && processingPhase !== "error";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const playAudio = useCallback(async (url: string) => {
    if (!url) return;
    const playableUrl = rewriteAudioUrl(url);
    try {
      // Reuse a single audio element so a second tap stops the previous clip.
      let audio = audioPlayerRef.current;
      if (!audio) {
        audio = new Audio();
        audio.preload = "none";
        // iOS Safari: required to play inline rather than open a full-screen player.
        audio.setAttribute("playsinline", "");
        audioPlayerRef.current = audio;
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
      audio.src = playableUrl;
      await audio.play();
    } catch (err) {
      console.error("[LessonPlayer] Audio playback failed:", err);
      alert(
        "Não foi possível reproduzir o áudio. Verifique se o servidor de áudio está acessível e tente novamente.\n\nCould not play audio. Check that the audio server is reachable from this device."
      );
    }
  }, []);

  const previewRecording = async () => {
    if (!audioBlob) return;
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.setAttribute("playsinline", "");
    audioPreviewRef.current = audio;
    try {
      await audio.play();
    } catch (err) {
      console.error("[LessonPlayer] Preview playback failed:", err);
    }
  };

  const startRecording = async () => {
    // getUserMedia requires a secure context (HTTPS) on non-localhost origins.
    // Detect this up front to give a clearer error.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      alert(
        "Para usar o microfone neste dispositivo, abra o app via HTTPS (ou pelo localhost).\n\nMicrophone access requires HTTPS or localhost. Open the app over HTTPS to record."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Este navegador não suporta gravação de áudio.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mimeType, extension } = pickRecorderMime();
      setRecordingExtension(extension);

      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
      } catch (err) {
        console.warn("[LessonPlayer] MediaRecorder rejected options, retrying with defaults:", err);
        mediaRecorder = new MediaRecorder(stream);
      }

      chunksRef.current = [];
      setRecordingDuration(0);
      const startTime = Date.now();

      timerRef.current = setInterval(() => {
        setRecordingDuration((Date.now() - startTime) / 1000);
      }, 100);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Use the recorder's reported mime (most accurate); fall back to our pick.
        const recorderMime = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: recorderMime });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingDuration((Date.now() - startTime) / 1000);
      };

      // Use a 1s timeslice so iOS Safari emits chunks during recording rather
      // than only on stop — improves reliability of short clips.
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      console.error("[LessonPlayer] getUserMedia failed:", err);
      const name = (err as Error)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        alert(
          "Permissão de microfone negada. Habilite o microfone nas configurações do navegador.\n\nMicrophone permission denied. Enable it in your browser settings."
        );
      } else {
        alert("Erro ao acessar o microfone / Could not access microphone");
      }
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const submitAudio = async () => {
    if (!audioBlob || isProcessing) return;

    if (audioBlob.size === 0) {
      setFeedback({
        is_correct: false,
        feedback_pt: "A gravação está vazia. Tente novamente.",
        transcription: "",
      });
      return;
    }

    setFeedback(null);
    setProcessingPhase("uploading");

    console.log(
      `[LessonPlayer] Submitting audio. Size: ${audioBlob.size} bytes, type: ${audioBlob.type}, ext: ${recordingExtension}`
    );

    const formData = new FormData();
    formData.append("audio", audioBlob, `recording.${recordingExtension}`);
    formData.append("lesson_id", lessonId);
    formData.append("exchange_index", currentExchange.order_index.toString());
    formData.append("expected_text", currentExchange.english_text);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/speaking-tutor`, {
        method: "POST",
        body: formData,
      });

      console.log(`[LessonPlayer] Response status: ${res.status}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        console.error("[LessonPlayer] API error:", data);
        throw new Error(data.error || "Erro no servidor");
      }

      setProcessingPhase("transcribing");
      await new Promise((r) => setTimeout(r, 500));

      setProcessingPhase("evaluating");
      const result = await res.json();
      console.log("[LessonPlayer] Result:", result);

      setProcessingPhase("complete");
      setFeedback(result);
      setRetryCount(0);
    } catch (err) {
      setProcessingPhase("error");
      const message = err instanceof Error ? err.message : "Erro de conexão";
      console.error("[LessonPlayer] Submit error:", message);
      setFeedback({
        is_correct: false,
        feedback_pt: `${message}. Tente novamente.`,
        transcription: "",
      });
    } finally {
      setTimeout(() => setProcessingPhase("idle"), 300);
    }
  };

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    setFeedback(null);
    setAudioBlob(null);
  };

  const advance = () => {
    if (currentIndex < exchanges.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowTranslation(false);
      setFeedback(null);
      setAudioBlob(null);
      setRetryCount(0);
    } else {
      setIsCompleted(true);
      fetch(`${getApiBaseUrl()}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: localStorage.getItem("cariockko_session"),
          lesson_id: lessonId,
          completed: true,
        }),
      }).catch(console.error);
    }
  };

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-100 bg-white px-6 py-14 text-center shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">✓</span>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Parabéns!
        </h2>
        <p className="text-sm text-slate-500">
          Você completou a lição / You completed the lesson!
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Voltar às lições
        </button>
      </div>
    );
  }

  if (!currentExchange) return null;

  // Shared button class strings for thumb-friendly tap targets on mobile.
  const btnBase = "inline-flex min-h-11 items-center justify-center rounded-xl text-xs font-semibold transition";
  const btnPrimary = `${btnBase} bg-indigo-600 px-4 py-3 text-white shadow-sm hover:bg-indigo-700`;
  const btnSecondary = `${btnBase} border border-slate-200 bg-white px-4 py-3 text-slate-700 hover:border-indigo-200 hover:text-indigo-700`;
  const btnSuccess = `${btnBase} bg-emerald-600 px-4 py-3 text-white hover:bg-emerald-700`;
  const btnDanger = `${btnBase} bg-rose-600 px-6 py-3 text-white hover:bg-rose-700`;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium text-slate-500">Etapa {progress}</span>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 sm:w-56">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{
              width: `${((currentIndex + 1) / exchanges.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {isAppTurn ? (
        <div className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
            Ouça e pratique
          </span>
          <p className="break-words text-xl font-semibold leading-relaxed tracking-tight text-slate-950 md:text-2xl">
            {currentExchange.english_text}
          </p>

          {showTranslation && (
            <p className="break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {currentExchange.portuguese_translation}
            </p>
          )}

          <div className="flex flex-wrap gap-2 md:gap-3">
            {currentExchange.audio_url && (
              <button
                onClick={() => playAudio(currentExchange.audio_url!)}
                className={`${btnPrimary} gap-2`}
              >
                <Volume2 size={16} />
                Ouvir
              </button>
            )}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={btnSecondary}
            >
              {showTranslation ? "Ocultar" : "Tradução"}
            </button>
            <button onClick={advance} className={btnSuccess}>
              Próximo →
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5 rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-8">
          <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Sua vez de falar
          </span>
          <p className="break-words text-xl font-semibold leading-relaxed tracking-tight text-slate-950 md:text-2xl">
            {currentExchange.english_text}
          </p>

          {showTranslation && (
            <p className="break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {currentExchange.portuguese_translation}
            </p>
          )}

          <div className="flex flex-wrap gap-2 md:gap-3">
            {currentExchange.audio_url && (
              <button
                onClick={() => playAudio(currentExchange.audio_url!)}
                className={`${btnPrimary} gap-2`}
              >
                <Volume2 size={16} />
                Ouvir referência
              </button>
            )}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={btnSecondary}
            >
              {showTranslation ? "Ocultar" : "Tradução"}
            </button>
          </div>

          <ProcessingStatus phase={processingPhase} />

          <div className="flex flex-wrap gap-2 md:gap-3 items-center">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className={`${btnPrimary} gap-2 px-6`}
              >
                <Mic size={16} />
                Gravar
              </button>
            )}

            {isRecording && (
              <>
                <button
                  onClick={stopRecording}
                  className={`${btnDanger} gap-2`}
                >
                  <Square size={16} />
                  Parar
                </button>
                <span className="flex items-center gap-2 font-mono text-xs text-rose-600">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-rose-600" />
                  {formatDuration(recordingDuration)}
                </span>
              </>
            )}

            {audioBlob && !feedback && !isProcessing && (
              <>
                <button
                  onClick={submitAudio}
                  className={`${btnPrimary} px-6`}
                >
                  Enviar
                </button>
                <button
                  onClick={previewRecording}
                  className={`${btnSecondary} gap-2`}
                >
                  <Volume2 size={16} />
                  Ouvir gravação
                </button>
                <button
                  onClick={() => {
                    setAudioBlob(null);
                    setRecordingDuration(0);
                  }}
                  className={btnSecondary}
                >
                  Regravar
                </button>
                {recordingDuration > 0 && (
                  <span className="font-mono text-xs text-slate-400">
                    Duração: {formatDuration(recordingDuration)}
                  </span>
                )}
              </>
            )}
          </div>

          {feedback && (
            <div
              className={`flex flex-col gap-2 rounded-2xl p-5 ${
                feedback.is_correct
                  ? "border border-emerald-100 bg-emerald-50/60"
                  : "border border-rose-100 bg-rose-50/60"
              }`}
            >
              {feedback.transcription && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    O que você disse:
                  </span>
                  <p className="mt-1 break-words text-sm text-slate-800">
                    &ldquo;{feedback.transcription}&rdquo;
                  </p>
                </div>
              )}

              <p
                className={`font-sora text-sm font-medium break-words ${
                  feedback.is_correct ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {feedback.feedback_pt}
              </p>

              {!feedback.is_correct && feedback.transcription && (
                <div className="border-t border-slate-200 pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    O que era esperado:
                  </span>
                  <p className="mt-1 break-words text-sm text-slate-800">
                    &ldquo;{currentExchange.english_text}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {feedback && (
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button
                onClick={() => {
                  if (feedback.is_correct) {
                    advance();
                  } else {
                    handleRetry();
                  }
                }}
                className={`${btnBase} px-6 py-3 text-white ${
                  feedback.is_correct ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {feedback.is_correct ? "Próximo →" : "Tentar novamente"}
              </button>
              {!feedback.is_correct && retryCount > 0 && (
                <button onClick={advance} className={btnSecondary}>
                  Pular →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
