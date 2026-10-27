"use client";

import type { ChatMessage } from "@/lib/api";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`bubble-${message.role}`}
    >
      {!isUser && (
        <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-mono text-[11px] font-semibold text-indigo-700">
          AI
        </div>
      )}
      <div
        className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-2xl rounded-tr-sm bg-indigo-600 text-white"
            : "rounded-2xl rounded-tl-sm border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
