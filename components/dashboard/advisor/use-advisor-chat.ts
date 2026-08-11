"use client";

import { useRef, useState, useTransition } from "react";

export type AdvisorMessage = { id: string; role: "user" | "assistant"; content: string };

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export function useAdvisorChat(pageLabel: string) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function ask(trimmed: string) {
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { id: newId(), role: "user", content: trimmed }]);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/advisor/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, history, page: pageLabel }),
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}) as { error?: string });
          setError(result.error ?? "Something went wrong.");
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError("Your browser doesn't support streaming responses.");
          return;
        }

        const decoder = new TextDecoder();
        const assistantId = newId();
        let receivedAny = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!chunk) continue;
            if (!receivedAny) {
              receivedAny = true;
              setStreamingId(assistantId);
              setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: chunk }]);
            } else {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
              );
            }
          }
        } finally {
          setStreamingId((current) => (current === assistantId ? null : current));
        }

        if (!receivedAny) {
          setError("The advisor didn't return an answer — try again.");
        }
      } catch {
        setError("Couldn't reach the advisor — check your connection and try again.");
      }
    });
  }

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    setQuestion("");
    ask(trimmed);
  }

  return {
    question,
    setQuestion,
    messages,
    error,
    isPending,
    streamingId,
    scrollRef,
    submit,
  };
}
