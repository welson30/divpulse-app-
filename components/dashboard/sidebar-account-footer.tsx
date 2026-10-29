import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/(auth)/actions";
import { IconLogOut } from "@/components/marketing/icons";

/**
 * Plan status + upgrade CTA + sign-out — shared between the desktop
 * `Sidebar` and the mobile `MoreSheet` so the two navs can't drift apart.
 */
export async function SidebarAccountFooter({
  planLabel,
  isFree,
  holdingCount,
}: {
  planLabel: string;
  isFree: boolean;
  holdingCount: number;
}) {
  const t = await getTranslations("dashboard.sidebar");
  return (
    <div>
      <div className="mb-2 rounded-lg border border-green-500/20 bg-[rgba(34,197,94,0.06)] px-3 py-2.5">
        <div className="font-mono text-[9px] font-medium text-text-secondary">{t("currentPlan")}</div>
        <div className="text-xs font-bold text-green-500">
          {planLabel}
          {isFree ? ` · ${t("holdingsCount", { count: holdingCount })}` : ""}
        </div>
      </div>
      {isFree ? (
        <Link
          href="/settings"
          className="mb-2 block w-full rounded-md bg-green-500 py-2.5 text-center font-sans text-xs font-bold text-canvas transition-colors hover:bg-green-500/90"
        >
          {t("upgradePro")}
        </Link>
      ) : null}
      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-center font-sans text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-red-500"
        >
          <IconLogOut className="size-3.5" />
          {t("signOut")}
        </button>
      </form>
    </div>
  );
}
