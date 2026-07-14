# DivPulse — Services & Connections

> **Technical Reference Document · July 2026**
> All services a developer needs to connect for the SaaS Web platform to function completely. Each entry includes where to register, cost, and what it powers.

---

## Quick Reference Summary

| # | Feature | Service | Register At | Cost |
|---|---|---|---|---|
| 1 | Database & Auth | Supabase | [supabase.com](https://supabase.com) | ✅ Free |
| 2 | App Hosting | Vercel | [vercel.com](https://vercel.com) | ✅ Free |
| 3 | Push Notifications | OneSignal | [onesignal.com](https://onesignal.com) | ✅ Free (up to 10k users) |
| 4 | Payments & Subscriptions | Stripe | [stripe.com](https://stripe.com) | ✅ Free + % per transaction |
| 5 | Dividend Data, Calendar & Collections | Yahoo Finance API | No registration needed | ✅ Free |
| 6 | US Broker Sync (Pro+) | Plaid | [plaid.com/developers](https://plaid.com/developers) | ⚠️ ~$0.30/account/mo |
| 6 | BR & Other Broker Sync | CSV / Manual | No integration needed | ✅ Free |
| 7 | Telegram Alerts | Telegram Bot API | Already configured | ✅ Free |
| 8 | Transactional Email | Resend | [resend.com](https://resend.com) | ✅ Free (up to 3k emails/mo) |
| 9 | AI Advisor | OpenAI | [platform.openai.com](https://platform.openai.com) | ⚠️ Pay per use (~$0.001/query) |

---

## 1. Database & Authentication

| Field | Detail |
|---|---|
| **Service** | Supabase |
| **Register at** | [supabase.com](https://supabase.com) |
| **Cost** | Free |
| **Used for** | All user data, login, plan management (Free / Pro / Pro+), holdings, dividend history |

---

## 2. App Hosting

| Field | Detail |
|---|---|
| **Service** | Vercel |
| **Register at** | [vercel.com](https://vercel.com) |
| **Cost** | Free |
| **Used for** | Hosting the Next.js web app with automatic deployment on every push |

---

## 3. Push Notifications — Lock Screen Alerts

| Field | Detail |
|---|---|
| **Service** | OneSignal |
| **Register at** | [onesignal.com](https://onesignal.com) |
| **Cost** | Free up to 10,000 users |
| **Used for** | Sending real-time lock screen alerts e.g. `"Dividend received · JEPI · +$61.20"` directly to the user's phone |

---

## 4. Payments & Subscriptions

| Field | Detail |
|---|---|
| **Service** | Stripe |
| **Register at** | [stripe.com](https://stripe.com) |
| **Cost** | Free — charges a % per transaction only |
| **Plans charged** | Pro at **$59/yr** · Pro+ at **$119/yr** |
| **Payment methods** | Credit card, PayPal, PIX |

---

## 5. Dividend Data, Calendar & Collections

| Field | Detail |
|---|---|
| **Service** | Yahoo Finance API |
| **Register at** | Not required — no API key needed |
| **Cost** | Free |

### What This API Powers

| Tab / Feature | Data Provided |
|---|---|
| **Dividends tab** | Annual income, income per day/month, current yield, full payment history |
| **Calendar tab** | Future ex-dividend dates and payment dates for each asset in the user's portfolio |
| **Collections tab** | Real-time prices and yields for each category (REITs, High Yield ETFs, BDCs, etc.) |
| **Notifications** | Detects which dividends were paid today — triggers the push notification via OneSignal |

### How Collections Work

DivPulse maintains an internal curated list mapping assets to categories (e.g. `JEPI → "High Yield"`, `O → "REITs"`). Prices and yields are fetched in real time via Yahoo Finance. Users configure nothing — Collections appear ready in the app on first launch.

### Calendar — Extra Events

Fed (FOMC) meeting dates and quarterly earnings can be supplemented via:
- **[Alpha Vantage](https://www.alphavantage.co)** (free tier) — for automated event data
- A **static list maintained by DivPulse** — for events that don't change frequently

---

## 6. Broker Sync

### US Brokers — Automatic Sync (Pro+ Only)

| Field | Detail |
|---|---|
| **Service** | Plaid |
| **Register at** | [plaid.com/developers](https://plaid.com/developers) |
| **Cost** | ~$0.30 per connected account / month |
| **Supported brokers** | Fidelity, Schwab, Robinhood, IBKR, TD Ameritrade, Vanguard, Webull |
| **How it works** | User authorizes read-only access once. DivPulse syncs holdings automatically — no manual input needed. |

### Brazilian & International Brokers (XP, Avenue, Nomad…)

Plaid does not support Brazilian brokers or most international brokers. Two fallback methods are available:

| Method | Available On | How It Works |
|---|---|---|
| **Manual Entry** | All plans | User types ticker, number of shares, and broker name directly in the app. Works for any broker worldwide. |
| **CSV / Excel Import** | Pro+ only | User exports their portfolio from the broker (XP, Avenue, and Nomad support Excel/CSV export), uploads to DivPulse, and assets are imported automatically. Not real-time, but significantly faster than manual entry. |

### Broker Sync by Plan

| Plan | How Assets Are Added |
|---|---|
| **Free** | Manual entry — up to **5 assets** |
| **Pro** | Manual entry — **unlimited assets** |
| **Pro+** | Manual entry + **Plaid** (US brokers, automatic) + **CSV import** (any broker) |

---

## 7. Telegram Alerts (Pro Plan)

| Field | Detail |
|---|---|
| **Service** | Telegram Bot API |
| **Register at** | Not required — already configured |
| **Cost** | Free |
| **Bot token** | `TELEGRAM_BOT_TOKEN`  |
| **Owner chat ID** | `TELEGRAM_OWNER_CHAT_ID`  |



---

## 8. Transactional Email

| Field | Detail |
|---|---|
| **Service** | Resend |
| **Register at** | [resend.com](https://resend.com) |
| **Cost** | Free up to 3,000 emails / month |
| **Used for** | Welcome email · Password reset · Payment confirmation |

---

## 9. AI Advisor (Pro Feature)

| Field | Detail |
|---|---|
| **Service** | OpenAI |
| **Register at** | [platform.openai.com](https://platform.openai.com) |
| **Cost** | Pay per use — ~$0.001 per query |
| **Used for** | Answering natural language questions such as *"How much capital do I need to earn $1,000/month in dividends?"* inside the Goals and Diversification tabs |

---

## Visual References

| Resource | URL |
|---|---|
| **Landing Page** | [landingpagedivpulse.netlify.app](https://landingpagedivpulse.netlify.app) |
| **SaaS Web Prototype** | [protopiposaasweb.netlify.app](https://protopiposaasweb.netlify.app) |

> **Prototype tip:** Click **"Continue with Google"** on the prototype to access the full dashboard with all tabs unlocked.