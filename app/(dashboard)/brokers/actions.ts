"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { disconnectConnectionForUser } from "@/lib/plaid/disconnect";
import { syncHoldingsForConnection } from "@/lib/plaid/sync";

export type BrokerActionResult = { ok: true } | { error: string };

function revalidateBrokerPaths() {
  revalidatePath("/brokers");
  revalidatePath("/holdings");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/settings");
}

export async function resyncBrokerConnection(connectionId: string): Promise<BrokerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const { data: row } = await supabase
    .from("broker_connections")
    .select("id, status")
    .eq("id", connectionId)
    .eq("user_id", user.id)
    .single();

  if (!row || row.status === "disconnected") {
    return { error: "Connection not found." };
  }

  const result = await syncHoldingsForConnection(connectionId);
  revalidateBrokerPaths();
  if (result.error) return { error: result.error };
  return { ok: true };
}

export async function disconnectBrokerConnection(connectionId: string): Promise<BrokerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please sign in again." };

  const result = await disconnectConnectionForUser(user.id, connectionId);
  revalidateBrokerPaths();
  return result;
}
