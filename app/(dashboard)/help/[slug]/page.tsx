import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FigmaIcon } from "@/components/dashboard/figma-icon";
import { HELP_ARTICLES, HELP_CATEGORIES, getHelpArticle } from "@/lib/help/articles";

type Params = { slug: string };

export function generateStaticParams() {
  return HELP_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  return { title: article ? `${article.title} — Help — PaidPrime` : "Help — PaidPrime" };
}

export default async function HelpArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  const category = HELP_CATEGORIES.find((c) => c.id === article.category)?.label ?? article.category;

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-[#22262c] pb-6">
        <Link href="/help" className="text-[11px] tracking-[2.2px] text-[#6c737f] uppercase hover:text-[#99a1ac]">
          Support / Help center
        </Link>
        <h1 className="mt-[7px] max-w-[720px] font-[family-name:var(--font-funnel-display)] text-[28px] font-semibold tracking-[-0.96px] text-[#f2f4f7] min-[900px]:text-[32px] min-[900px]:leading-[52.8px]">
          {article.title}
        </h1>
        <p className="mt-1 text-[14px] leading-[22.75px] text-[#99a1ac]">{category}</p>
      </header>

      <article className="max-w-[720px] overflow-hidden rounded-[14px] border border-[#22262c] bg-[#121417] px-6 py-6">
        <div className="flex flex-col gap-4">
          {article.body.map((paragraph, i) => (
            <p key={i} className="text-[15px] leading-[24.75px] text-[#99a1ac]">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <Link
        href="/help"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-[#4c82f7] hover:underline"
      >
        <FigmaIcon src="/marketing/dashboard/icon-help-chevron.svg" className="size-[15px] rotate-180 text-[#4c82f7]" />
        Back to help center
      </Link>
    </div>
  );
}
