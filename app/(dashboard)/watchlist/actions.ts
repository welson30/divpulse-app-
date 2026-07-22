"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type WatchlistActionState = { error: string } | null;

export async function addWatchlistItem(_prevState: WatchlistActionState, formData: FormData): Promise<WatchlistActionState> {
  const ticker = String(formData.get("ticker") ?? "").trim().toUpperCase();
  const companyName = String(formData.get("companyName") ?? "").trim() || null;

  if (!ticker) {
    return { error: "Enter a ticker symbol." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase.from("watchlist_items").insert({
    user_id: user.id,
    ticker,
    company_name: companyName,
  });

  if (error) {
    // 23505 = unique_violation — already on the watchlist. Not worth
    // surfacing as an alarming error; the user's intent (have this ticker
    // watched) is already satisfied.
    if (error.code === "23505") {
      return null;
    }
    return { error: error.message };
  }

  revalidatePath("/watchlist");
  return null;
}

export async function removeWatchlistItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("watchlist_items").delete().eq("id", itemId).eq("user_id", user.id);

  revalidatePath("/watchlist");
}
