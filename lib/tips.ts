/**
 * Plain-language explanations for the financial jargon in the UI, shared
 * so a term is never explained two different ways in two places.
 *
 * Deliberately kept OUT of components/dashboard/info-tip.tsx, which is a
 * `"use client"` module. A Server Component importing a non-component
 * export from a client module receives a client *reference* rather than
 * the value itself, so `TIPS.exDate` read as `undefined` server-side and
 * rendered an empty tooltip — visible on the server-rendered Dividends
 * and Dashboard pages while working fine inside the client-rendered
 * Holdings table. Living in a plain module, these resolve correctly on
 * both sides.
 */
export const TIPS = {
  todayChange:
    "How much this position's share price moved today, compared with yesterday's closing price. Green is up, red is down.",
  sparkline1M:
    "The share price over the past month. It shows the trend only — the line is green if the price is up today, red if it's down.",
  fiftyTwoWeek:
    "The lowest and highest price over the past year. The dot shows where the price sits between them — near the right means it's close to a 12-month high.",
  marketValue: "What this holding is worth right now: your number of shares multiplied by the current share price.",
  dividendYield:
    "The dividend paid over a year as a percentage of the share price. A 4% yield means roughly $4 of dividends a year for every $100 invested.",
  annualIncome:
    "What your holdings paid in dividends over the last 12 months. It's based on actual payment history, not a forecast, so it can differ from what you'll receive next year.",
  portfolioValue: "The current market value of everything you hold, using live share prices.",
  incomePerDay: "Your last 12 months of dividend income spread evenly across the year. An average, not a daily payment.",
  monthlyIncome: "Your last 12 months of dividend income divided by 12. An average month, not what you're paid this specific month.",
  nextPayment:
    "\"Confirmed\" means the company has an announced payment date. \"Estimated\" means we predicted it from that ticker's own payment history, since not every company publishes its next date in advance — the real date can land a few days off.",
  exDate:
    "The cut-off date. You must own the shares before this date to receive the upcoming dividend — buying on or after it means you miss that payment.",
  payDate: "The date the dividend money actually reaches your account.",
  perShare: "The dividend amount paid for each individual share you own.",
  marketCap: "The total value of all outstanding shares — price × shares outstanding. A rough measure of size.",
  peRatio:
    "Price divided by earnings per share. Meaningful for individual stocks; usually blank for ETFs and funds, which don't report earnings the same way.",
  payoutRatio:
    "The share of earnings paid out as dividends. Over 100% means the company is paying out more than it currently earns.",
  beta: "How much this security's price swings compared with the overall market. 1.0 tracks the market; higher means more volatile.",
  dividendRate:
    "The dollar amount of dividends expected per share over the next year, based on the most recent regular payment. Often blank for funds with irregular payouts.",
  passiveIncomeGoal:
    "Progress toward a target monthly dividend income, based on your last 12 months of actual payments — not a forecast of next month.",
  goalCapitalNeeded:
    "How much invested capital it'd take to generate this monthly income at your portfolio's current average yield. Changes if your yield changes.",
  goalTimeToGoal:
    "A straight-line estimate: the dollar gap to your target, divided by your planned monthly contribution. Doesn't assume any investment growth along the way — a conservative estimate, not a guarantee.",
  emergencyReserveGoal:
    "A cash reserve sized to your own monthly expenses × however many months of runway you want — not derived from your investment portfolio, since a reserve should stay separate from money that's invested.",
  currentProtection: "How many months of your own expenses your current reserve balance would cover if you stopped earning today.",
  financialFreedomGoal:
    "Progress toward a portfolio large enough that its dividend income alone could cover your living costs, based on your current holdings' value.",
  freedomProjection:
    "A straight-line estimate: the portfolio-value gap divided by your planned yearly contribution. Doesn't assume any price growth or reinvestment along the way, so it's a conservative (likely slower-than-reality) estimate.",
} as const;
