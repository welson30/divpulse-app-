"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { useAdvisorChat } from "@/components/dashboard/advisor/use-advisor-chat";

export type AdvisorInsight = {
  icon: "trend" | "sparkle";
  text: string;
  highlight?: string;
};

export type AdvisorSuggestion = {
  ticker: string;
  href: string;
};

export type AdvisorRiskRow = {
  title: string;
  detail: string;
  tone: "warning" | "neutral" | "positive";
};

const PROMPTS = [
  "What's my monthly dividend income?",
  "Which holding pays me the most?",
  "Am I too concentrated in one sector?",
  "What's my next dividend payment?",
];

type AdvisorBoardProps = {
  isPro: boolean;
  insights: AdvisorInsight[];
  suggestions: AdvisorSuggestion[];
  risks: AdvisorRiskRow[];
};

export function AdvisorBoard({ isPro, insights, suggestions, risks }: AdvisorBoardProps) {
  const chat = useAdvisorChat("AI Advisor");

  useEffect(() => {
    chat.scrollRef.current?.scrollTo({ top: chat.scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.messages, chat.isPending, chat.scrollRef]);

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">AI Advisor</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Portfolio advisor
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          A focused workspace for portfolio Q&amp;A — grounded in your holdings, income history and risk profile.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[1.4fr_1fr]">
        <section className="flex min-h-[640px] flex-col overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
              Conversation
            </h2>
            <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">
              Session grounded in your live portfolio data
            </p>
          </header>

          <div ref={chat.scrollRef} className="min-h-0 flex-1 overflow-y-auto px-6">
            {!isPro ? (
              <div className="flex flex-col items-start gap-3 py-8">
                <p className="text-[14px] leading-[22.75px] text-[#99a1ac]">
                  The AI Advisor is a Pro feature. It answers from your holdings, trailing income, upcoming payments
                  and goals.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex h-9 items-center rounded-[10px] bg-[#4c82f7] px-4 text-[13px] font-medium text-white hover:bg-[#3d72e8]"
                >
                  Upgrade to Pro
                </Link>
              </div>
            ) : chat.messages.length === 0 && !chat.isPending ? (
              <p className="py-8 text-[14px] leading-[22.75px] text-[#99a1ac]">
                Ask about your income, holdings, upcoming payments, or goals. Answers stay inside what this app
                actually records.
              </p>
            ) : (
              <div className="flex flex-col">
                {groupTurns(chat.messages).map((turn) => (
                  <div key={turn.user.id} className="border-b border-[#22262c] py-6 last:border-b-0">
                    <p className="text-[11px] tracking-[1.76px] text-[#6c737f] uppercase">Query</p>
                    <p className="mt-[7px] text-[14px] leading-[22.75px] text-[#f2f4f7]">{turn.user.content}</p>
                    <p className="mt-2 text-[11px] tracking-[1.76px] text-[#4c82f7] uppercase">Response</p>
                    {turn.assistant ? (
                      <p className="mt-1 text-[13px] leading-[21.13px] whitespace-pre-wrap text-[#99a1ac]">
                        {turn.assistant.content}
                        {turn.assistant.id === chat.streamingId ? (
                          <span className="ml-0.5 inline-block h-3 w-0.5 translate-y-0.5 animate-pulse bg-[#4c82f7] align-middle" />
                        ) : null}
                      </p>
                    ) : chat.isPending ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <div className="h-[14px] w-[92%] animate-pulse rounded-[8px] bg-[#16191d]" />
                        <div className="h-[14px] w-[78%] animate-pulse rounded-[8px] bg-[#16191d]" />
                        <div className="h-[14px] w-[85%] animate-pulse rounded-[8px] bg-[#16191d]" />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {chat.error ? (
              <p role="alert" className="py-4 text-[13px] text-[#d8695f]">
                {chat.error}
              </p>
            ) : null}
          </div>

          <div className="border-t border-[#22262c] px-6 py-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={!isPro || chat.isPending}
                  onClick={() => chat.submit(prompt)}
                  className="rounded-full border border-[#2e343b] px-3 py-[7px] text-[12px] leading-[19.8px] text-[#99a1ac] hover:border-[#4c82f7] hover:text-[#f2f4f7] disabled:opacity-40"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                chat.submit(chat.question);
              }}
            >
              <input
                value={chat.question}
                onChange={(e) => chat.setQuestion(e.target.value)}
                placeholder="Ask about your portfolio, income or risk..."
                maxLength={500}
                disabled={!isPro || chat.isPending}
                className="h-[52px] min-w-0 flex-1 rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] px-[17px] text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] focus-visible:border-[#4c82f7] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isPro || chat.isPending || !chat.question.trim()}
                aria-label="Send"
                className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#4c82f7] text-white hover:bg-[#3d72e8] disabled:opacity-40"
              >
                <FigmaIcon src="/marketing/dashboard/icon-send.svg" className="size-4 text-white" />
              </button>
            </form>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <SideCard title="Portfolio insights" subtitle="From your recorded income">
            {insights.length === 0 ? (
              <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
                Add holdings with dividend history to see income insights here.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {insights.map((insight) => (
                  <li key={insight.text} className="flex items-start gap-3">
                    <FigmaIcon
                      src={
                        insight.icon === "trend"
                          ? "/marketing/dashboard/icon-trend.svg"
                          : "/marketing/dashboard/icon-sparkle.svg"
                      }
                      className={`mt-0.5 size-4 ${insight.icon === "trend" ? "text-[#3fbf87]" : "text-[#4c82f7]"}`}
                    />
                    <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
                      {insight.highlight
                        ? highlightOnce(insight.text, insight.highlight)
                        : insight.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SideCard>

          <SideCard title="Dividend suggestions" subtitle="From your watchlist and collections — not a recommendation">
            {suggestions.length === 0 ? (
              <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
                Add names to your{" "}
                <Link href="/watchlist" className="text-[#4c82f7] hover:underline">
                  watchlist
                </Link>{" "}
                or browse{" "}
                <Link href="/collections" className="text-[#4c82f7] hover:underline">
                  collections
                </Link>
                . We don&apos;t pick tickers for you.
              </p>
            ) : (
              <ul>
                {suggestions.map((row, i) => (
                  <li
                    key={row.ticker}
                    className={`flex items-center justify-between py-3.5 ${i < suggestions.length - 1 ? "border-b border-[#22262c]" : ""}`}
                  >
                    <span className="text-[14px] leading-[23.1px] font-medium text-[#f2f4f7]">{row.ticker}</span>
                    <Link
                      href={row.href}
                      className="inline-flex items-center gap-0.5 text-[12px] leading-[19.8px] text-[#3fbf87] hover:underline"
                    >
                      View
                      <FigmaIcon src="/marketing/dashboard/icon-consider.svg" className="size-3 text-[#3fbf87]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SideCard>

          <SideCard
            title="Risk analysis"
            subtitle="Concentration and stability signals"
            icon={
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#16191d]">
                <FigmaIcon src="/marketing/dashboard/icon-risk.svg" className="size-[14px] text-[#99a1ac]" />
              </span>
            }
          >
            {risks.length === 0 ? (
              <p className="text-[13px] leading-[21.45px] text-[#99a1ac]">
                Add holdings to see concentration and payout history.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {risks.map((row) => (
                  <li key={row.title} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] leading-[21.45px] font-medium text-[#f2f4f7]">{row.title}</p>
                      <p className="text-[12px] leading-[19.8px] text-[#6c737f]">{row.detail}</p>
                    </div>
                    <ToneBadge tone={row.tone} />
                  </li>
                ))}
              </ul>
            )}
          </SideCard>
        </div>
      </div>
    </div>
  );
}

function groupTurns(messages: { id: string; role: "user" | "assistant"; content: string }[]) {
  const turns: { user: { id: string; content: string }; assistant: { id: string; content: string } | null }[] = [];
  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: { id: message.id, content: message.content }, assistant: null });
    } else {
      const last = turns[turns.length - 1];
      if (last && !last.assistant) last.assistant = { id: message.id, content: message.content };
    }
  }
  return turns;
}

function highlightOnce(text: string, highlight: string) {
  const idx = text.indexOf(highlight);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="text-[#f2f4f7]">{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

function SideCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
      <header className="flex items-center gap-3 border-b border-[#22262c] px-6 py-5">
        {icon}
        <div>
          <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
            {title}
          </h2>
          <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">{subtitle}</p>
        </div>
      </header>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function ToneBadge({ tone }: { tone: AdvisorRiskRow["tone"] }) {
  const cls =
    tone === "warning"
      ? "border-[rgba(224,164,92,0.3)] bg-[#241c10] text-[#e0a45c]"
      : tone === "positive"
        ? "border-[rgba(63,191,135,0.3)] bg-[#10261e] text-[#3fbf87]"
        : "border-[#2e343b] bg-[#16191d] text-[#99a1ac]";
  return (
    <span className={`shrink-0 rounded-[8px] border px-2 py-[4px] text-[11px] tracking-[1.1px] uppercase ${cls}`}>
      {tone}
    </span>
  );
}
