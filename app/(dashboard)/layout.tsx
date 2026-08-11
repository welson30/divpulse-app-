import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/app-shell";
import type { RecentNotification } from "@/components/dashboard/notification-bell";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

/** Rows shown in the bell dropdown — enough for a quick glance, not a full history (that's /notifications). */
const RECENT_NOTIFICATIONS_LIMIT = 20;

// proxy.ts already redirects unauthenticated requests away from these
// routes, but that's a cookie-presence check, not a verified session — this
// layout does the real getUser() call so every (dashboard) page gets a
// trustworthy user without repeating the check per-page.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: holdingCount }, { data: holdings }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("plan, display_name, notifications_last_seen_at").eq("id", user.id).single(),
    supabase.from("holdings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("holdings").select("id, ticker").eq("user_id", user.id),
    supabase
      .from("dividend_payments")
      .select("id, amount, notified_at, holding_id")
      .eq("user_id", user.id)
      .not("notified_at", "is", null)
      .order("notified_at", { ascending: false })
      .limit(RECENT_NOTIFICATIONS_LIMIT),
  ]);

  const planLabel = PLAN_LABELS[profile?.plan ?? "free"] ?? "Free";
  const isFree = (profile?.plan ?? "free") === "free";
  const isPro = profile?.plan === "pro" || profile?.plan === "pro_plus";

  // dividend_payments carries holding_id, not ticker directly — same
  // in-JS join every other page in this app uses (dividends/page.tsx's
  // holdingById) rather than a PostgREST embedded-resource select.
  const tickerByHoldingId = new Map((holdings ?? []).map((h) => [h.id, h.ticker]));
  const notifications: RecentNotification[] = (payments ?? [])
    .map((p) => ({
      id: p.id,
      ticker: tickerByHoldingId.get(p.holding_id) ?? "—",
      amount: Number(p.amount),
      notifiedAt: p.notified_at as string,
    }))
    // A holding can be deleted after its payment was recorded — drop rows
    // that no longer resolve to a real ticker rather than show "—".
    .filter((n) => n.ticker !== "—");

  const lastSeenAt = profile?.notifications_last_seen_at ? new Date(profile.notifications_last_seen_at).getTime() : 0;
  const unreadNotificationCount = notifications.filter((n) => new Date(n.notifiedAt).getTime() > lastSeenAt).length;

  return (
    <AppShell
      email={user.email ?? ""}
      displayName={profile?.display_name ?? null}
      planLabel={planLabel}
      isFree={isFree}
      isPro={isPro}
      holdingCount={holdingCount ?? 0}
      notifications={notifications}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
