import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const testEmail = `diag-node-${Date.now()}@example.com`;
console.log("Testing signUp against:", env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Test email:", testEmail);

const { data, error } = await supabase.auth.signUp({
  email: testEmail,
  password: "TestPassword123!",
  options: { emailRedirectTo: "http://localhost:3000/auth/callback" },
});

console.log("\n--- RESULT ---");
console.log("error:", error ? JSON.stringify({ message: error.message, status: error.status, code: error.code, name: error.name }, null, 2) : null);
console.log("data.user:", data?.user ? { id: data.user.id, email: data.user.email, identities: data.user.identities?.length } : null);
console.log("data.session:", data?.session ? "present" : null);
