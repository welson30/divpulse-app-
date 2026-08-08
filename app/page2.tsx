"use client";

import Image from "next/image";
import { useState } from "react";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  }

  return (
    <>
      <style>{`
        .cs-input:focus {
          outline: none;
          border-color: rgba(34, 197, 94, 0.4);
        }
        .cs-input::placeholder {
          color: #52525B;
        }
        .cs-btn:hover {
          background: #16A34A;
        }
      `}</style>

      <main style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "#09090B",
        fontFamily: "var(--font-inter, system-ui, sans-serif)",
      }}>

        {/* Top nav bar */}
        <nav style={{
          display: "flex",
          alignItems: "center",
          padding: "24px 40px",
          borderBottom: "1px solid #1C1C1E",
        }}>
          <Image
            src="/logo.svg"
            alt="PaidPrime"
            width={28}
            height={28}
            priority
            style={{ borderRadius: 6 }}
          />
          <span style={{
            marginLeft: 10,
            fontFamily: "var(--font-inter-tight, Inter, sans-serif)",
            fontSize: 15,
            fontWeight: 600,
            color: "#FFFFFF",
            letterSpacing: "-0.01em",
          }}>
            PaidPrime
          </span>
        </nav>

        {/* Center content */}
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          textAlign: "center",
        }}>

          {/* Label */}
          <p style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#22C55E",
            marginBottom: 20,
          }}>
            Coming Soon
          </p>

          {/* Headline */}
          <h1 style={{
            fontFamily: "var(--font-inter-tight, Inter, sans-serif)",
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "#FFFFFF",
            lineHeight: 1.15,
            margin: "0 0 16px",
            maxWidth: 480,
          }}>
            Know the moment<br />you&rsquo;re paid.
          </h1>

          {/* Sub */}
          <p style={{
            fontSize: 15,
            color: "#71717A",
            lineHeight: 1.65,
            maxWidth: 360,
            margin: "0 0 40px",
          }}>
            Real-time dividend alerts — the instant a payment lands,
            before your broker&rsquo;s app tells you.
          </p>

          {/* Form */}
          {!done ? (
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{
                display: "flex",
                gap: 8,
                width: "100%",
                maxWidth: 360,
              }}
            >
              <input
                className="cs-input"
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  flex: 1,
                  height: 40,
                  padding: "0 14px",
                  background: "#111113",
                  border: "1px solid #27272A",
                  borderRadius: 8,
                  fontSize: 14,
                  color: "#FFFFFF",
                  transition: "border-color 0.15s",
                }}
              />
              <button
                className="cs-btn"
                type="submit"
                style={{
                  height: 40,
                  padding: "0 16px",
                  background: "#22C55E",
                  color: "#09090B",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.01em",
                  transition: "background 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                Notify me
              </button>
            </form>
          ) : (
            <p style={{ fontSize: 14, color: "#22C55E" }}>
              You&rsquo;re on the list — we&rsquo;ll be in touch.
            </p>
          )}
        </div>

        {/* Footer */}
        <footer style={{
          padding: "20px 40px",
          borderTop: "1px solid #1C1C1E",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}>
          <p style={{ fontSize: 12, color: "#3F3F46", margin: 0 }}>
            &copy; {new Date().getFullYear()} PaidPrime. All rights reserved.
          </p>
          {/* Required attribution for Logo.dev's free tier (commercial use) — see lib/tickers/logo.ts */}
          <a href="https://logo.dev" style={{ fontSize: 11, color: "#3F3F46", textDecoration: "none" }}>
            Logos provided by Logo.dev
          </a>
        </footer>

      </main>
    </>
  );
}
