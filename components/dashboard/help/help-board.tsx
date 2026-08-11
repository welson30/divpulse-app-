"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  popularArticles,
  searchHelpArticles,
  type HelpCategoryId,
} from "@/lib/help/articles";

const SUPPORT_MAIL = "mailto:support@paidprime.com?subject=PaidPrime%20support";

export function HelpBoard() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategoryId | null>(null);

  const trimmed = query.trim();
  const list = useMemo(() => {
    const searched = trimmed ? searchHelpArticles(trimmed) : category ? HELP_ARTICLES.filter((a) => a.category === category) : popularArticles();
    return searched;
  }, [trimmed, category]);

  const listTitle = trimmed ? "Search results" : category ? HELP_CATEGORIES.find((c) => c.id === category)?.label : "Popular articles";

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-[#22262c] pb-6">
        <p className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase">Support</p>
        <h1 className="mt-[7px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          Help center
        </h1>
        <p className="mt-1 max-w-[672px] text-[14px] leading-[22.75px] text-[#99a1ac]">
          Search articles or reach the team directly.
        </p>
      </header>

      <div className="relative max-w-[576px]">
        <FigmaIcon
          src="/marketing/dashboard/icon-help-search.svg"
          className="pointer-events-none absolute top-1/2 left-[14px] size-4 -translate-y-1/2 text-[#6c737f]"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCategory(null);
          }}
          placeholder="Search help articles..."
          className="h-[52px] w-full rounded-[14px] border border-[#2e343b] bg-[#0b0c0e] py-4 pr-[17px] pl-[41px] text-[16px] text-[#f2f4f7] outline-none placeholder:text-[#6c737f] focus:border-[#4c82f7]"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 min-[1100px]:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                Browse by category
              </h2>
            </header>
            <div className="grid grid-cols-1 gap-4 p-6 min-[700px]:grid-cols-3">
              {HELP_CATEGORIES.map((cat) => {
                const count = HELP_ARTICLES.filter((a) => a.category === cat.id).length;
                const active = category === cat.id && !trimmed;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCategory(active ? null : cat.id);
                    }}
                    className={`rounded-[14px] border px-[17px] py-5 text-left ${
                      active ? "border-[#4c82f7] bg-[#16191d]" : "border-[#2e343b] hover:border-[#4c82f7]"
                    }`}
                  >
                    <p className="text-[13px] font-medium leading-[21.45px] text-[#f2f4f7]">{cat.label}</p>
                    <p className="mt-1 text-[12px] leading-[19.8px] text-[#6c737f]">
                      {count} article{count === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
            <header className="border-b border-[#22262c] px-6 py-5">
              <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                {listTitle}
              </h2>
            </header>
            {list.length === 0 ? (
              <p className="px-6 py-5 text-[13px] leading-[21.45px] text-[#99a1ac]">No articles match that search.</p>
            ) : (
              <ul>
                {list.map((article, i) => (
                  <li key={article.slug}>
                    <Link
                      href={`/help/${article.slug}`}
                      className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#16191d] ${
                        i < list.length - 1 ? "border-b border-[#22262c]" : ""
                      }`}
                    >
                      <span className="text-[14px] leading-[23.1px] text-[#f2f4f7]">{article.title}</span>
                      <FigmaIcon src="/marketing/dashboard/icon-help-chevron.svg" className="size-[15px] shrink-0 text-[#6c737f]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417]">
          <header className="border-b border-[#22262c] px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-[#22262c] bg-[#16191d]">
                <FigmaIcon src="/marketing/dashboard/icon-help-contact.svg" className="size-3.5 text-[#99a1ac]" />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-funnel-display)] text-[15px] font-semibold tracking-[-0.15px] text-[#f2f4f7]">
                  Contact support
                </h2>
                <p className="mt-1 text-[13px] leading-[21.45px] text-[#99a1ac]">Email is the way to reach us</p>
              </div>
            </div>
          </header>
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3 rounded-[10px] border border-[#2e343b] px-[17px] py-[15px] opacity-60">
              <FigmaIcon src="/marketing/dashboard/icon-help-chat.svg" className="size-[17px] shrink-0 text-[#99a1ac]" />
              <div>
                <p className="text-[13px] font-medium leading-[21.45px] text-[#f2f4f7]">Live chat</p>
                <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Not available yet</p>
              </div>
            </div>
            <a
              href={SUPPORT_MAIL}
              className="flex items-center gap-3 rounded-[10px] border border-[#2e343b] px-[17px] py-[15px] hover:border-[#4c82f7]"
            >
              <FigmaIcon src="/marketing/dashboard/icon-help-mail.svg" className="size-[17px] shrink-0 text-[#99a1ac]" />
              <div>
                <p className="text-[13px] font-medium leading-[21.45px] text-[#f2f4f7]">Email support</p>
                <p className="text-[12px] leading-[19.8px] text-[#6c737f]">support@paidprime.com</p>
              </div>
            </a>
            <a
              href={SUPPORT_MAIL}
              className="inline-flex h-9 items-center justify-center rounded-[10px] bg-[#4c82f7] px-[15px] text-[13px] font-medium text-white hover:bg-[#3d6fe0]"
            >
              Open a ticket
            </a>
          </div>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#22262c] pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma mark */}
        <img src="/marketing/dashboard/logo.svg" alt="PaidPrime" width={14} height={14} className="size-3.5 opacity-60" />
        <p className="text-[12px] leading-[19.8px] text-[#6c737f]">Read-only broker access · Data delayed 15 min</p>
      </footer>
    </div>
  );
}
