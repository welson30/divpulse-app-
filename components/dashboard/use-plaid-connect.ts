"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import { useRouter } from "next/navigation";

export function usePlaidConnect() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      startTransition(async () => {
        setError(null);
        const response = await fetch("/api/plaid/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken, institutionName: metadata.institution?.name ?? null }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(result.error ?? "Couldn't finish connecting.");
          return;
        }
        setLinkToken(null);
        router.refresh();
      });
    },
    [router],
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  function connect() {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/plaid/link-token", { method: "POST" });
      const result = (await response.json()) as { error?: string; linkToken?: string };
      if (!response.ok || !result.linkToken) {
        setError(result.error ?? "Couldn't start broker connection.");
        return;
      }
      setLinkToken(result.linkToken);
    });
  }

  return { connect, isPending, error };
}
