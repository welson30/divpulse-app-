import "server-only";
import { NextResponse } from "next/server";

/** Pulls Plaid's error_code off a thrown SDK error, or null if it isn't one. */
export function plaidErrorCode(err: unknown): string | null {
  const data = (err as { response?: { data?: { error_code?: string } } })?.response?.data;
  return data?.error_code ?? null;
}

/**
 * Codes that mean the operator misconfigured something rather than the user
 * doing anything wrong. Worth distinguishing so the copy doesn't send
 * someone round a retry loop over a dashboard setting they can't see.
 */
const OPERATOR_ERRORS: Record<string, string> = {
  INVALID_API_KEYS: "Broker connection is misconfigured (bad Plaid credentials). We've been notified.",
  INVALID_FIELD: "Broker connection is misconfigured (Plaid rejected a setting). We've been notified.",
  INVALID_PRODUCT: "Broker connection isn't enabled for this account yet. We've been notified.",
  PRODUCTS_NOT_SUPPORTED: "Broker connection isn't enabled for this account yet. We've been notified.",
};

/**
 * Turns a thrown Plaid SDK error into a response the caller can act on.
 *
 * Without this the SDK's rejection escapes the route handler and Next
 * returns a bare 500 with an empty body — which is exactly what the
 * production cutover looked like from outside: the connect flow was dead
 * and there was no way to tell whether the secret was wrong, the redirect
 * URI wasn't allow-listed for the environment, or the institution wasn't
 * registered. The raw error_message stays in the log since it can carry
 * request detail; error_code is not sensitive and is what makes a failure
 * diagnosable without shipping a deploy just to read a log line.
 */
export function plaidErrorResponse(err: unknown, context: string) {
  const data = (err as { response?: { data?: { error_code?: string; error_message?: string } } })?.response?.data;
  const code = data?.error_code ?? null;

  console.error(`[plaid] ${context} failed`, { code, message: data?.error_message });

  return NextResponse.json(
    {
      error: (code && OPERATOR_ERRORS[code]) ?? "Couldn't start broker connection. Please try again shortly.",
      code,
    },
    { status: 502 },
  );
}
