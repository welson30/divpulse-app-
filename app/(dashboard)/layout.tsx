import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/dashboard/app-shell";
import { OneSignalProvider } from "@/components/onesignal/onesignal-provider";

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

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();

  const planLabel = PLAN_LABELS[profile?.plan ?? "free"] ?? "Free";

  return (
    <>
      <OneSignalProvider userId={user.id} />
      <AppShell email={user.email ?? ""} planLabel={planLabel}>
        {children}
      </AppShell>
    </>
  );
}
