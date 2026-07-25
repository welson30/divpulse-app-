"use client";

import { useState, useTransition } from "react";
import { IconBot } from "@/components/marketing/icons";

type AiAdvisorPanelProps = {
  isPro: boolean;
  placeholder: string;
};

type Message = { role: "user" | "assistant"; text: string };

export function AiAdvisorPanel({ isPro, placeholder }: AiAdvisorPanelProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isPro) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.06em] text-green-500 uppercase">
          <IconBot className="size-3.5" />
          AI Advisor
        </div>
        <p className="text-sm text-text-secondary">Ask questions about your goals and portfolio — Pro feature.</p>
      </div>
    );
  }

  function ask(trimmed: string) {
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/advisor/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer }]);
    });
  }

  return (
    <div className="flex h-64 flex-col overflow-hidden rounded-card border border-border-subtle bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
          <IconBot className="size-5" />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-text-primary">AI Advisor</div>
          <div className="text-[11px] text-text-secondary">Ask about your goals or portfolio</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3.5">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
                <IconBot className="size-3.5" />
              </span>
              <p className="text-[13px] leading-relaxed text-text-secondary">{placeholder}</p>
            </div>
          ) : (
            messages.map((message, i) =>
              message.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-2 px-3.5 py-2.5 text-[13px] leading-relaxed text-text-primary">
                    {message.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
                    <IconBot className="size-3.5" />
                  </span>
                  <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[rgba(34,197,94,0.08)] px-3.5 py-2.5 text-[13px] leading-relaxed text-text-primary">
                    {message.text}
                  </p>
                </div>
              ),
            )
          )}

          {isPending ? (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
                <IconBot className="size-3.5" />
              </span>
              <span className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-[rgba(34,197,94,0.08)] px-3.5 py-2.5 text-[13px] text-text-secondary">
                <span className="inline-flex gap-0.5">
                  <span className="size-1 animate-bounce rounded-full bg-green-500 [animation-delay:-0.3s]" />
                  <span className="size-1 animate-bounce rounded-full bg-green-500 [animation-delay:-0.15s]" />
                  <span className="size-1 animate-bounce rounded-full bg-green-500" />
                </span>
                Thinking…
              </span>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-xs text-red-500">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <form
        className="shrink-0 border-t border-border-subtle p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = question.trim();
          if (!trimmed) return;
          setQuestion("");
          ask(trimmed);
        }}
      >
        <div className="flex items-center gap-2 rounded-full border border-border-interactive bg-surface-2 py-1 pr-1 pl-3.5 focus-within:border-green-500">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question…"
            maxLength={500}
            disabled={isPending}
            className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending || !question.trim()}
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-canvas transition-colors hover:bg-green-500/90 disabled:opacity-40"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-4">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
