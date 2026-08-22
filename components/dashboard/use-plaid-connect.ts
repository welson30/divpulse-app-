"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata, type PlaidLinkError } from "react-plaid-link";
import { useRouter } from "next/navigation";
import { completeBrokerReauth } from "@/app/(dashboard)/brokers/actions";

/**
 * Where the in-flight link token is parked across an OAuth redirect.
 * Plaid requires the *same* link token to resume a session, and the bank
 * sends the user back via a full page load, so component state is gone by
 * the time they return.
 */
const OAUTH_TOKEN_KEY = "paidprime.plaid.oauth";

type PendingSession = { linkToken: string; connectionId: string | null };
type OauthResume = PendingSession & { redirectUri: string };

/**
 * Reads a Link session the bank redirected back into. Plaid appends
 * oauth_state_id to the redirect URI, which is what distinguishes a
 * continuation from a fresh page visit.
 *
 * Runs as lazy initial state rather than in an effect: this is state
 * derived once from an external source (URL + sessionStorage), not a
 * subscription, and setting it from an effect would cost an extra render
 * pass. Returns null during SSR, which is also the value the server would
 * render with — and since nothing here reaches the DOM (it only feeds
 * usePlaidLink's config), there is no hydration divergence.
 */
function readOauthResume(): OauthResume | null {
  if (typeof window === "undefined") return null;
  if (!new URLSearchParams(window.location.search).has("oauth_state_id")) return null;

  const stored = window.sessionStorage.getItem(OAUTH_TOKEN_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as PendingSession;
    if (!session?.linkToken) return null;
    return { ...session, redirectUri: window.location.href };
  } catch {
    window.sessionStorage.removeItem(OAUTH_TOKEN_KEY);
    return null;
  }
}

/**
 * Turns a Plaid Link failure into something safe to put in front of a user.
 *
 * Never falls back to `error_message`. That field is written for
 * developers, not customers — an unregistered institution renders as
 * "You must register your application with this institution before you can
 * create items for it… View registration status at
 * https://dashboard.plaid.com/…", which was reaching real users and
 * pointing them at our Plaid dashboard. `display_message` is the field
 * Plaid intends for end users, but it is frequently null on exactly these
 * operator-side errors, which is how the developer text leaked through.
 *
 * The raw error still goes to the console so it stays diagnosable.
 */
function messageForLinkError(err: PlaidLinkError): string {
  console.error("[plaid/link] exited with error", {
    error_code: err.error_code,
    error_type: err.error_type,
    error_message: err.error_message,
  });

  // The bank is fine, we just can't reach it yet — nothing the user can fix.
  const UNAVAILABLE = "This bank isn't available to connect yet. Please try a different one, or check back soon.";

  switch (err.error_code) {
    case "INSTITUTION_REGISTRATION_REQUIRED":
    case "INSTITUTION_NOT_AVAILABLE":
    case "INSTITUTION_NO_LONGER_SUPPORTED":
      return UNAVAILABLE;
    case "INSTITUTION_DOWN":
    case "INSTITUTION_NOT_RESPONDING":
      return "This bank isn't responding right now. Please try again in a little while.";
    case "INVALID_CREDENTIALS":
    case "INVALID_MFA":
      return "Those sign-in details weren't accepted by your bank. Please try again.";
    case "USER_INPUT_TIMEOUT":
      return "The connection timed out. Please try again.";
    case "ITEM_LOCKED":
      return "Your bank has locked this account. Please sign in on their website first, then try again.";
    default:
      // display_message is safe by definition when Plaid provides it.
      return err.display_message || "Couldn't finish connecting to that bank. Please try again.";
  }
}

export function usePlaidConnect() {
  const router = useRouter();
  const [oauthResume] = useState(readOauthResume);

  const [linkToken, setLinkToken] = useState<string | null>(oauthResume?.linkToken ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Set only when resuming after an OAuth redirect — passing
  // receivedRedirectUri on a normal session makes Plaid reject it.
  const [receivedRedirectUri, setReceivedRedirectUri] = useState<string | undefined>(oauthResume?.redirectUri);

  // Which connection an update-mode session belongs to; null for a plain
  // new-broker connection. Held in a ref because onSuccess/onExit are
  // handed to Plaid once and must see the current value, not a closure
  // captured at open time.
  const reauthConnectionId = useRef<string | null>(oauthResume?.connectionId ?? null);

  const finish = useCallback(() => {
    window.sessionStorage.removeItem(OAUTH_TOKEN_KEY);
    reauthConnectionId.current = null;
    setLinkToken(null);
    setReceivedRedirectUri(undefined);
  }, []);

  const onSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      const connectionId = reauthConnectionId.current;

      startTransition(async () => {
        setError(null);

        // Update mode keeps the original access_token, so there is nothing
        // to exchange — the public_token Plaid hands back here is a
        // by-product of the shared callback, not a new grant.
        if (connectionId) {
          const result = await completeBrokerReauth(connectionId);
          if ("error" in result) {
            setError(result.error);
            return;
          }
          finish();
          router.refresh();
          return;
        }

        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicToken,
            institutionName: metadata.institution?.name ?? null,
            institutionId: metadata.institution?.institution_id ?? null,
          }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(result.error ?? "Couldn't finish connecting.");
          return;
        }
        finish();
        router.refresh();
      });
    },
    [router, finish],
  );

  /**
   * Without this, abandoning or failing Link left the UI stuck: the button
   * stayed in its pending state and nothing explained why. Plaid's launch
   * checklist calls out handling callbacks beyond onSuccess for exactly
   * this reason.
   */
  const onExit = useCallback(
    (err: PlaidLinkError | null) => {
      // A plain close with no error is the user changing their mind —
      // resetting silently is the right response, not an error message.
      setError(err ? messageForLinkError(err) : null);
      finish();
    },
    [finish],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri,
    onSuccess,
    onExit,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  const requestToken = useCallback((connectionId: string | null) => {
    startTransition(async () => {
      setError(null);
      reauthConnectionId.current = connectionId;

      const response = await fetch("/api/plaid/link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      });
      const result = (await response.json()) as { error?: string; linkToken?: string };
      if (!response.ok || !result.linkToken) {
        setError(result.error ?? "Couldn't start broker connection.");
        reauthConnectionId.current = null;
        return;
      }

      // Stored before opening, since an OAuth institution navigates away
      // immediately and we can't know in advance whether it will.
      window.sessionStorage.setItem(
        OAUTH_TOKEN_KEY,
        JSON.stringify({ linkToken: result.linkToken, connectionId } satisfies PendingSession),
      );
      setLinkToken(result.linkToken);
    });
  }, []);

  return {
    connect: useCallback(() => requestToken(null), [requestToken]),
    /** Re-authenticate an existing connection through Link's update mode. */
    reconnect: useCallback((connectionId: string) => requestToken(connectionId), [requestToken]),
    isPending,
    error,
  };
}
