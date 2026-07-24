"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AiAdvisorPanelProps = {
  isPro: boolean;
  placeholder: string;
};

export function AiAdvisorPanel({ isPro, placeholder }: AiAdvisorPanelProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isPro) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-2 p-sp-3">
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.06em] text-green-500 uppercase">
          🤖 AI Advisor
        </div>
        <p className="text-sm text-text-secondary">Ask questions about your goals and portfolio — Pro feature.</p>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-green-500/20 bg-[#0a1c11] p-sp-3">
      <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs font-bold tracking-[0.06em] text-green-500 uppercase">
        🤖 AI Advisor
      </div>

      {answer ? (
        <p className="mb-sp-2 text-[13px] leading-relaxed text-text-secondary">{answer}</p>
      ) : (
        <p className="mb-sp-2 text-[13px] leading-relaxed text-text-secondary">{placeholder}</p>
      )}

      {error ? (
        <p role="alert" className="mb-sp-2 text-xs text-red-500">
          {error}
        </p>
      ) : null}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = question.trim();
          if (!trimmed) return;

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
            setAnswer(result.answer);
            setQuestion("");
          });
        }}
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. how much do I need to invest to earn $1,000/mo?"
          maxLength={500}
          className="h-10 flex-1 px-3 text-[13px]"
        />
        <Button type="submit" disabled={isPending || !question.trim()} className="h-10 shrink-0 px-4 text-[13px]">
          {isPending ? "Asking…" : "Ask"}
        </Button>
      </form>
    </div>
  );
}
