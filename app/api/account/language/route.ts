import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPPORTED_LOCALES = ["en", "pt"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const language = body.language as string;

  if (!SUPPORTED_LOCALES.includes(language as Locale)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ language: language as Locale })
    .eq("id", user.id);

  if (error) {
    // Column may not exist yet (migration pending) — don't fail hard
    console.warn("[language] Supabase update failed:", error.message);
  }

  return NextResponse.json({ ok: true });
}
