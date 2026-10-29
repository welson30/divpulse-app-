"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconBot } from "@/components/marketing/icons";
import { OPEN_ADVISOR_EVENT } from "@/components/dashboard/open-advisor";

type AiAdvisorWidgetProps = {
  isPro: boolean;
};

// Carries an id (not just role+content) so a streaming reply can be found
// and appended to by identity rather than by "whatever's currently last in
// the array" — the latter breaks if the user hits Clear while a response
// is still streaming in.
type Message = { id: string; role: "user" | "assistant"; content: string };

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

/**
 * Human-readable name for the page the user is looking at, sent as context
 * so the advisor can answer where they already are ("this page shows…")
 * instead of describing the portfolio generically. Mirrors the sidebar's
 * own labels — /dashboard is "For You" to users, not "Dashboard".
 */
const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/holdings": "Portfolio",
  "/dividends": "Dividends",
  "/calendar": "Calendar",
  "/upcoming": "Upcoming payments",
  "/history": "Payment history",
  "/collections": "Collections",
  "/analytics": "Analytics",
  "/performance": "Performance",
  "/diversification": "Allocation",
  "/watchlist": "Watchlist",
  "/goals": "Goals",
  "/advisor": "AI Advisor",
  "/brokers": "Broker connections",
  "/settings": "Settings",
  "/help": "Help center",
  "/notifications": "Notifications",
  "/alert-templates": "Notification templates",
};

/**
 * Starter questions, chosen per page so the first tap is always relevant
 * to what's on screen. Every one of these is answerable from the context
 * the route actually sends (holdings, upcoming payments, sectors, goals) —
 * suggesting a question the advisor can't answer would be worse than
 * suggesting nothing.
 */
const PAGE_PROMPTS: Record<string, string[]> = {
  "/dashboard": ["How much did I earn this month?", "What's my next dividend payment?"],
  "/holdings": ["Which holding pays me the most?", "Which of my positions is largest?"],
  "/dividends": ["How is my dividend income trending?", "Which tickers pay me the most per year?"],
  "/analytics": ["How is my dividend income trending?", "Which tickers pay me the most per year?"],
  "/performance": ["Which of my positions is largest?", "Which holding pays me the most?"],
  "/calendar": ["What payments are coming in the next 30 days?", "Which of those are confirmed vs estimated?"],
  "/upcoming": ["Which upcoming payments are confirmed?", "How much is expected in the next 90 days?"],
  "/history": ["How much have I been paid this year?", "Which broker paid me the most?"],
  "/diversification": ["Am I too concentrated in one sector?", "How is my portfolio allocated?"],
  "/goals": ["How far am I from my income goal?", "What would it take to reach it faster?"],
  "/watchlist": ["How would adding to my portfolio change my yield?", "What's my current average yield?"],
  "/notifications": ["Which dividends paid me recently?", "What's my next dividend payment?"],
  "/alert-templates": ["Which dividends paid me recently?", "What's my next dividend payment?"],
};

const DEFAULT_PROMPTS = ["What's my monthly dividend income?", "What's my next payment?"];

/**
 * Records that the user closed the panel, so auto-open doesn't fight them
 * on every reload. Session-scoped rather than localStorage: the advisor
 * should reintroduce itself next visit, not stay hidden forever after one
 * dismissal.
 */
const DISMISS_KEY = "paidprime.advisor.dismissed";

/** Nothing to subscribe to — the auto-open decision is read once at mount. */
const subscribeNoop = () => () => {};

/**
 * Whether the panel should introduce itself on load. Desktop only: on
 * mobile the panel is a near-fullscreen sheet, and covering the page
 * someone just navigated to would be hostile — the launcher stays visible
 * there instead.
 */
function getAutoOpen(): boolean {
  try {
    if (sessionStorage.getItem(DISMISS_KEY)) return false;
  } catch {
    // Storage blocked (private mode / cookies off) — fall through and
    // still introduce the advisor.
  }
  return window.matchMedia("(min-width: 640px)").matches;
}

/** Server render is always closed, so hydration matches before the client re-reads. */
const getAutoOpenOnServer = () => false;

export function AiAdvisorWidget({ isPro }: AiAdvisorWidgetProps) {
  const t = useTranslations("dashboard.advisor");
  const pathname = usePathname();
  // null = the user hasn't touched it yet, so the auto-open decision
  // stands. Derived rather than set from an effect: setState inside an
  // effect body triggers a cascading render (and is a lint error here).
  const [toggled, setToggled] = useState<boolean | null>(null);
  const autoOpen = useSyncExternalStore(subscribeNoop, getAutoOpen, getAutoOpenOnServer);
  const open = toggled ?? autoOpen;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Id of the message currently being typed onto, or null before the first
  // chunk of a reply has arrived. Drives both the blinking caret and the
  // "Thinking…" bubble — the latter should disappear the moment real text
  // starts streaming in, not stay parked alongside it.
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pageLabel = PAGE_LABELS[pathname] ?? null;
  const prompts = PAGE_PROMPTS[pathname] ?? DEFAULT_PROMPTS;
  const onAdvisorPage = pathname === "/advisor";

  /** Closing is always an explicit dismissal — remember it for the session. */
  function close() {
    setToggled(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked — the panel still closes, it just re-introduces
      // itself on the next full load.
    }
  }

  // Pin to the newest message as the conversation grows — including while
  // the "Thinking…" bubble is showing, and on every incoming chunk of a
  // streaming reply (messages gets a new array reference each time, so
  // this fires continuously as text streams in, not just once at the end).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isPending]);

  useEffect(() => {
    if (open && isPro) inputRef.current?.focus();
  }, [open, isPro]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    function onOpen() {
      setToggled(true);
    }
    window.addEventListener(OPEN_ADVISOR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ADVISOR_EVENT, onOpen);
  }, []);

  function ask(trimmed: string) {
    // Captured before the optimistic append so the model receives the
    // conversation as it stood when the question was asked.
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
          // Every early-return in the route (auth/plan/rate-limit/config
          // checks) still answers with plain JSON — only a successful
          // call becomes a byte stream — so this path is unchanged from
          // before streaming existed.
          const result = await response.json().catch(() => ({}) as { error?: string });
          setError(result.error ?? t("widgetNoAnswer"));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          setError(t("widgetNoStream"));
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
              // Matched by id, not array position — safe even if Clear
              // emptied the array out from under an in-flight stream (the
              // .map below then simply finds nothing and drops the chunk).
              setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
            }
          }
        } finally {
          setStreamingId((current) => (current === assistantId ? null : current));
        }

        if (!receivedAny) {
          setError(t("widgetNoAnswer"));
        }
      } catch {
        setError(t("widgetConnError"));
      }
    });
  }

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    setQuestion("");
    ask(trimmed);
  }

  if (onAdvisorPage) return null;

  return (
    <>
      {/* Mobile scrim — the panel is near-fullscreen there, so the page
          behind it shouldn't read as still-interactive. */}
      {open ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={close}
          className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.4)] backdrop-blur-[2px] sm:hidden"
        />
      ) : null}

      {open ? (
        <div
          role="dialog"
          aria-label={t("widgetTitle")}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border border-border-subtle bg-surface shadow-2xl",
            "animate-in fade-in slide-in-from-bottom-4 duration-200",
            // Mobile: sheet that clears the bottom tab bar (h-16 + safe area).
            "inset-x-3 bottom-[calc(4rem+0.75rem+env(safe-area-inset-bottom))] top-16 rounded-card",
            // Desktop: anchored card above the launcher.
            "sm:inset-x-auto sm:top-auto sm:right-6 sm:bottom-24 sm:h-[540px] sm:max-h-[calc(100vh-8rem)] sm:w-[400px]",
            "lg:bottom-24",
          )}
        >
          <header className="flex shrink-0 items-center gap-2.5 border-b border-border-subtle px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
              <IconBot className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-text-primary">{t("widgetTitle")}</div>
              <div className="truncate text-[11px] text-text-secondary">
                {isPro ? (pageLabel ? t("widgetLooking", { page: pageLabel }) : t("widgetAskPortfolio")) : t("widgetProFeature")}
              </div>
            </div>
            {isPro && messages.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                  // Doesn't stop the in-flight fetch — the reader loop's
                  // id-matched update simply finds nothing to append to
                  // once the array is empty — but a stale caret with no
                  // visible message under it would look broken, so drop
                  // the reference to it here.
                  setStreamingId(null);
                }}
                className="rounded-full px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                {t("widgetClear")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              aria-label={t("widgetClose")}
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <X className="size-4" />
            </button>
          </header>

          {isPro ? (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3.5">
                <div className="flex flex-col gap-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-2.5">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
                          <IconBot className="size-3.5" />
                        </span>
                        <p className="text-[13px] leading-relaxed text-text-secondary">
                          {t("widgetGreeting")}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 pl-8.5">
                        {prompts.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() => submit(prompt)}
                            className="rounded-full border border-border-interactive px-3 py-1.5 text-left text-[12px] text-text-primary transition-colors hover:border-green-500 hover:bg-[rgba(34,197,94,0.06)]"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((message) =>
                      message.role === "user" ? (
                        <div key={message.id} className="flex justify-end">
                          <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-surface-2 px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-text-primary">
                            {message.content}
                          </p>
                        </div>
                      ) : (
                        <div key={message.id} className="flex gap-2.5">
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
                            <IconBot className="size-3.5" />
                          </span>
                          <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[rgba(34,197,94,0.08)] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap text-text-primary">
                            {message.content}
                            {message.id === streamingId ? (
                              <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-green-500 align-middle" />
                            ) : null}
                          </p>
                        </div>
                      ),
                    )
                  )}

                  {isPending && !streamingId ? (
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
                        {t("widgetThinking")}
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
                  submit(question);
                }}
              >
                <div className="flex items-center gap-2 rounded-full border border-border-interactive bg-surface-2 py-1 pr-1 pl-3.5 focus-within:border-green-500">
                  <input
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t("widgetPlaceholder")}
                    maxLength={500}
                    disabled={isPending}
                    // The `!` is load-bearing. globals.css declares a global
                    // `:focus-visible { outline: 2px solid }` *outside* any
                    // cascade layer, and unlayered CSS beats every layered
                    // Tailwind utility no matter its specificity — so a
                    // plain `focus-visible:outline-none` loses and the
                    // rectangular ring draws inside the wrapper's rounded
                    // green border. The focus affordance isn't removed, it
                    // moves to the wrapper's focus-within border, so
                    // DESIGN.md §7 ("no exceptions") still holds.
                    className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-text-primary placeholder:text-text-secondary focus-visible:outline-none! disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isPending || !question.trim()}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-500 text-canvas transition-colors hover:bg-green-500/90 disabled:opacity-40"
                    aria-label={t("widgetSend")}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-green-500">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-sm font-semibold text-text-primary">{t("widgetUpsellTitle")}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
                  {t("widgetUpsellDesc")}
                </p>
              </div>
              <Link
                href="/settings"
                onClick={close}
                className="mt-1 inline-flex h-10 items-center rounded-full bg-green-500 px-5 text-[13px] font-semibold text-canvas transition-colors hover:bg-green-500/90"
              >
                {t("widgetUpgrade")}
              </Link>
            </div>
          )}
        </div>
      ) : null}

      <div
        className={cn(
          "fixed right-4 z-50 flex flex-col items-end gap-2",
          "bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6",
          open && "hidden lg:flex",
        )}
      >
        {/* Tooltip label — desktop only */}
        {!open && (
          <span className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.2)] bg-[#0b1a12] px-3 py-1 text-[11px] font-semibold tracking-wide text-green-400 uppercase shadow-lg">
            <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
            {t("widgetLabel")}
          </span>
        )}
        <button
          type="button"
          onClick={() => (open ? close() : setToggled(true))}
          aria-label={open ? t("widgetClose") : t("widgetOpen")}
          aria-expanded={open}
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full bg-green-500 text-white shadow-[0_0_24px_rgba(34,197,94,0.35)]",
            "transition-all duration-200 hover:scale-105 hover:shadow-[0_0_32px_rgba(34,197,94,0.5)] active:scale-95",
          )}
        >
          {/* Pulse ring */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
          )}
          {open ? <X className="size-6" /> : <IconBot className="size-6" />}
        </button>
      </div>
    </>
  );
}
