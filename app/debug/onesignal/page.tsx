"use client";

import { useState } from "react";

type TestResult = {
  label: string;
  status: "pending" | "ok" | "failed";
  detail: string;
};

const TESTS: { label: string; url: string; method: "fetch" | "script" | "img" }[] = [
  { label: "fetch() cdn.onesignal.com SDK (.page.js)", url: "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js", method: "fetch" },
  { label: "<script> tag cdn.onesignal.com SDK (.page.js)", url: "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js", method: "script" },
  {
    label: "<script> tag cdn.onesignal.com SDK (.page.es6.js — the one the stack trace names)",
    url: "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.es6.js",
    method: "script",
  },
  { label: "fetch() onesignal.com (root domain, not cdn)", url: "https://onesignal.com/favicon.ico", method: "fetch" },
  { label: "fetch() api.onesignal.com", url: "https://api.onesignal.com/apps", method: "fetch" },
  { label: "img beacon cdn.onesignal.com", url: "https://cdn.onesignal.com/favicon.ico", method: "img" },
  { label: "fetch() unrelated CDN control (jsdelivr)", url: "https://cdn.jsdelivr.net/npm/react@18/package.json", method: "fetch" },
  { label: "fetch() unrelated ad-network-sounding domain control (googletagmanager)", url: "https://www.googletagmanager.com/gtag/js", method: "fetch" },
];

export default function OneSignalDebugPage() {
  const [results, setResults] = useState<TestResult[]>(TESTS.map((t) => ({ label: t.label, status: "pending", detail: "" })));

  async function runTests() {
    setResults(TESTS.map((t) => ({ label: t.label, status: "pending", detail: "running…" })));

    const updates = await Promise.all(
      TESTS.map(async (test): Promise<TestResult> => {
        try {
          if (test.method === "fetch") {
            const res = await fetch(test.url, { mode: "no-cors" });
            return { label: test.label, status: "ok", detail: `responded (opaque or real), type=${res.type}` };
          }

          if (test.method === "script") {
            await new Promise<void>((resolve, reject) => {
              const el = document.createElement("script");
              el.src = test.url + "?diag=" + Date.now();
              el.onload = () => resolve();
              el.onerror = (e) => reject(e);
              document.head.appendChild(el);
              setTimeout(() => reject(new Error("timeout after 8s")), 8000);
            });
            return { label: test.label, status: "ok", detail: "script loaded" };
          }

          // img
          await new Promise<void>((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve();
            el.onerror = () => reject(new Error("img error event"));
            el.src = test.url + "?diag=" + Date.now();
            setTimeout(() => reject(new Error("timeout after 8s")), 8000);
          });
          return { label: test.label, status: "ok", detail: "image loaded" };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { label: test.label, status: "failed", detail: message };
        }
      }),
    );

    setResults(updates);
  }

  return (
    <div style={{ padding: 32, fontFamily: "monospace", background: "#0A0E0D", color: "#F5F7F6", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 20, marginBottom: 8 }}>OneSignal / network diagnostic</h1>
      <p style={{ color: "#A8B3AF", marginBottom: 16, maxWidth: 640 }}>
        Runs several requests to isolate exactly what&apos;s being blocked — real OneSignal endpoints, plus unrelated
        control domains (jsdelivr, googletagmanager) to check whether the block is specific to OneSignal or broader.
        Open DevTools → Console before running to see the raw network errors alongside this table.
      </p>
      <button
        onClick={runTests}
        style={{
          background: "#34D399",
          color: "#0A0E0D",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 24,
        }}
      >
        Run diagnostic
      </button>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #242C29" }}>
            <th style={{ padding: 8 }}>Test</th>
            <th style={{ padding: 8 }}>Status</th>
            <th style={{ padding: 8 }}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.label} style={{ borderBottom: "1px solid #242C29" }}>
              <td style={{ padding: 8 }}>{r.label}</td>
              <td
                style={{
                  padding: 8,
                  color: r.status === "ok" ? "#34D399" : r.status === "failed" ? "#F87171" : "#A8B3AF",
                  fontWeight: 600,
                }}
              >
                {r.status.toUpperCase()}
              </td>
              <td style={{ padding: 8, color: "#A8B3AF" }}>{r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
