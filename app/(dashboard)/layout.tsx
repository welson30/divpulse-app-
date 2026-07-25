import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/app-shell";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
};

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

  const [{ data: profile }, { count: holdingCount }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
    supabase.from("holdings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const planLabel = PLAN_LABELS[profile?.plan ?? "free"] ?? "Free";
  const isFree = (profile?.plan ?? "free") === "free";

  return (
    <AppShell email={user.email ?? ""} planLabel={planLabel} isFree={isFree} holdingCount={holdingCount ?? 0}>
      {children}
    </AppShell>
  );
}
