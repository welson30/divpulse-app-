# DivPulse — Product Requirements Document

**Version:** 1.0
**Date:** July 2026
**Client:** Welson
**Developer:** Mohammad Shuja Uddin (Orvex Labs)

---

## 1. Overview

DivPulse is a dividend-tracking SaaS web platform for investors. Its core value proposition: users receive an instant push notification the moment a dividend is paid into their account — before their broker's own app shows it.

The platform is a web-based Progressive Web App (PWA), installable on iOS and Android, with no native mobile app required at this stage.

---

## 2. Problem Statement

Most brokerage apps do not proactively notify users when a dividend payment lands. Investors have to manually check their accounts to know if and when they got paid. DivPulse closes that gap with real-time, cross-channel alerts.

---

## 3. Target Users

- Dividend/income-focused retail investors
- Users holding assets across one or more US brokers (Fidelity, Schwab, Robinhood, IBKR, TD Ameritrade, Vanguard, Webull)
- Users with international/non-US brokers (manual or CSV-based tracking)

---

## 4. Core Features

| Feature | Description |
|---|---|
| **Dividend Notifications** | Push notifications (via OneSignal), Telegram alerts, and email the moment a dividend is detected. Three notification templates: ticker + amount, total account balance update, broker-confirmed payout. |
| **Dashboard** | Central view of holdings, upcoming/past dividends, and account summary. |
| **Holdings Tracker** | List of user's tracked assets, added manually, via CSV import, or via Plaid auto-sync. |
| **Dividend Calendar** | Upcoming and historical ex-dividend and payment dates per asset. |
| **Diversification View** | Visual breakdown of holdings by sector, broker, and asset type. |
| **Collections** | Curated groupings of assets by category (e.g., REITs, High Yield, BDCs) with real-time prices/yields. |
| **Watchlist** | Assets the user is tracking but doesn't yet hold. |
| **Goals & Financial Planning** | Passive income targets, emergency reserve tracking, financial freedom milestones. |
| **AI Advisor** | Conversational assistant answering questions like "how much do I need to invest to earn $1,000/month?" |
| **Settings** | Account, notification preferences, subscription management. |

---

## 5. Subscription Tiers

| Plan | Price | Asset Tracking |
|---|---|---|
| **Free** | $0 | Manual entry, up to 5 assets |
| **Pro** | $59/year | Manual entry, unlimited assets, Telegram alerts |
| **Pro+** | $119/year | Everything in Pro + Plaid auto-sync (US brokers) + CSV import (international brokers) |

---

## 6. Broker Data Sync

- **US brokers:** Automatic sync via Plaid (Pro+ only), read-only access.
- **Non-US / unsupported brokers (e.g., XP, Avenue, Nomad):**
  - Manual entry (all plans) — ticker, shares, broker name.
  - CSV/Excel import (Pro+) — bulk upload from broker export.

---

## 7. Technical Stack

- **Frontend:** Next.js 14, Tailwind CSS
- **Backend / Database / Auth:** Supabase (Postgres, auth, storage)
- **Hosting:** Vercel
- **Payments:** Stripe
- **Push Notifications:** OneSignal
- **Dividend Data:** Yahoo Finance API (free)
- **Broker Sync:** Plaid
- **Messaging:** Telegram Bot API
- **Transactional Email:** Resend
- **AI Advisor:** Google Gemini Flash (free tier initially)
- **Delivery Format:** PWA (installable, no native app)

---

## 8. Non-Functional Requirements

- **Security:** Read-only broker access only (no funds movement), encrypted data at rest and in transit, secure server-side API key storage, least-privilege access controls.
- **Reliability:** Daily scheduled job to detect and notify on dividend payments; no missed notifications on service restarts.
- **Scalability:** Architecture should support future growth without requiring a rebuild (not over-engineered for current scale).

---

## 9. Out of Scope (Phase 1)

- Native iOS/Android apps
- Real money movement or trading execution
- Full observability stack (distributed tracing, log aggregation) — deferred until the platform has meaningful production traffic
- SEO/AEO, analytics, and search console integration — deferred to post-launch checklist

---

## 10. Success Criteria

- User receives a dividend push notification before their broker's app shows the payment.
- Correct dividend detection accuracy via Yahoo Finance data.
- Stripe subscription flow (upgrade/downgrade/cancel) works reliably across all three tiers.
- PWA installs correctly on both iOS and Android home screens.