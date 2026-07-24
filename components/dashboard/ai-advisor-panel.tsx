"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="overflow-hidden rounded-card border border-green-500/20 bg-[#0a1c11]">
      <div className="flex items-center gap-1.5 border-b border-green-500/20 px-sp-3 py-2.5 font-mono text-xs font-bold tracking-[0.06em] text-green-500 uppercase">
        <IconBot className="size-3.5" />
        AI Advisor
      </div>

      <div className="flex flex-col gap-sp-2 px-sp-3 py-sp-3">
        {messages.length === 0 ? (
          <div className="flex gap-2">
            <IconBot className="mt-0.5 size-4 shrink-0 text-green-500" />
            <p className="text-[13px] leading-relaxed text-text-secondary">{placeholder}</p>
          </div>
        ) : (
          messages.map((message, i) =>
            message.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-lg bg-surface px-3 py-2 text-[13px] leading-relaxed text-text-primary">
                  {message.text}
                </p>
              </div>
            ) : (
              <div key={i} className="flex gap-2">
                <IconBot className="mt-0.5 size-4 shrink-0 text-green-500" />
                <p className="max-w-[85%] rounded-lg bg-[rgba(34,197,94,0.1)] px-3 py-2 text-[13px] leading-relaxed text-text-primary">
                  {message.text}
                </p>
              </div>
            ),
          )
        )}

        {isPending ? (
          <div className="flex items-center gap-2">
            <IconBot className="size-4 shrink-0 text-green-500" />
            <span className="flex items-center gap-1 rounded-lg bg-[rgba(34,197,94,0.1)] px-3 py-2 text-[13px] text-text-secondary">
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

      <form
        className="flex gap-2 border-t border-green-500/20 p-sp-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = question.trim();
          if (!trimmed) return;
          setQuestion("");
          ask(trimmed);
        }}
      >
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your goals or portfolio…"
          maxLength={500}
          disabled={isPending}
          className="h-10 flex-1 px-3 text-[13px]"
        />
        <Button type="submit" disabled={isPending || !question.trim()} className="h-10 shrink-0 px-4 text-[13px]">
          {isPending ? "Asking…" : "Ask"}
        </Button>
      </form>
    </div>
  );
}
