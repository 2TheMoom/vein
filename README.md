# Vein — LiteForge Ecosystem Intelligence

> Live on-chain intelligence for LiteForge. Every transaction. Every wallet. Every move.

**Vein** is a free, open-source ecosystem dashboard and intelligence API built on top of the [LiteForge](https://testnet.litvm.com/) testnet — Litecoin's first EVM rollup powered by Arbitrum Orbit, BitcoinOS, and Espresso.

Live at: **[vein.vercel.app](https://vein.vercel.app)**

---

## What It Does

- **Live ecosystem stats** — total transactions, unique addresses, avg block time, gas prices, network utilization
- **Period activity** — transaction counts across 24H, 7D, 30D, and all-time
- **Method breakdown** — swap, mint, deposit, transfer, bridge classification from live tx data
- **zkLTC / wzkLTC panel** — token supply, holder count, bridge interactions, recent transfers
- **Top dApps** — ranked by transaction count from verified contracts
- **Weekly Reports** — auto-generated every 7 days after launch, with week-over-week deltas and download
- **Query Panel** — 9 predefined on-chain queries
- **API Access** — pay-per-query intelligence API with 5 free queries per wallet

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v4 |
| Data | Blockscout REST API v2 — `liteforge.explorer.caldera.xyz/api/v2` |
| Database | Supabase (wallet query tracking, weekly reports) |
| Deployment | Vercel (with Cron Jobs) |
| Chain | LiteForge · Chain ID 4441 |

No AI API. No paid data providers. Pure on-chain data from the Blockscout public API.

---

## API

Vein exposes a pay-per-query intelligence API. **5 free queries per wallet address**, then 0.005 zkLTC per query.

**Payment destination:** `0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb`

### Endpoints

```
GET  /api/intelligence/stats?wallet=0xYOUR_WALLET
GET  /api/intelligence/activity?wallet=0xYOUR_WALLET&period=24h
GET  /api/intelligence/dapps?wallet=0xYOUR_WALLET
GET  /api/intelligence/zkltc?wallet=0xYOUR_WALLET
GET  /api/intelligence/report/weekly?wallet=0xYOUR_WALLET
POST /api/intelligence/confirm/:queryId
```

### Example

```js
const res = await fetch(
  'https://vein.vercel.app/api/intelligence/stats' +
  '?wallet=0xYOUR_WALLET_ADDRESS'
)
const data = await res.json()
// → { totalTransactions, totalAddresses, avgBlockTimeMs, gasPrices, ... }
```

### How to pay after free tier

1. Send `0.005 zkLTC` to `0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb` on LiteForge
2. Copy your transaction hash from the explorer
3. Call `POST /api/intelligence/confirm/:queryId` with `{ wallet, txId }`
4. 1 credit added — next query served immediately
5. Pass `?wallet=0xYOURS` on every request — that's how queries are tracked

---

## Weekly Reports

Vein auto-generates weekly ecosystem reports every 7 days after deployment. Each report includes:

- Transactions this week with week-over-week delta
- Total and new addresses
- wzkLTC bridge volume
- Bridge interaction count
- Average gas price
- Top dApp and top method
- Auto-generated insight paragraph

Reports are stored in Supabase, browsable by week in the dashboard modal, and downloadable as `.txt` files.

---

## Local Development

```bash
git clone https://github.com/2TheMoom/vein.git
cd vein
npm install
cp .env.example .env.local
# Fill in your Supabase keys in .env.local
npm run dev
```

Open `http://localhost:3000`

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_PAYMENT_DESTINATION=0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb
```

### Supabase Setup

Run `supabase/schema.sql` in your Supabase SQL Editor to create the required tables:
- `vein_queries` — wallet query tracking and free tier enforcement
- `vein_reports` — auto-generated weekly reports
- `vein_config` — launch date and cron state

---

## Project Structure

```
vein/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── dashboard/page.tsx                # Main dashboard
│   └── api/
│       ├── chain/route.ts                # Blockscout CORS proxy
│       ├── reports/route.ts              # Weekly reports listing
│       ├── cron/weekly-report/route.ts   # Auto-generate weekly report
│       └── intelligence/
│           ├── stats/route.ts            # Ecosystem snapshot
│           ├── activity/route.ts         # Period transaction counts
│           ├── dapps/route.ts            # dApp rankings
│           ├── zkltc/route.ts            # zkLTC intelligence
│           ├── report/weekly/route.ts    # Weekly report on demand
│           └── confirm/route.ts          # Payment confirmation
├── components/
│   ├── Header.tsx
│   ├── HeroCards.tsx
│   ├── ChainStrip.tsx
│   ├── WeeklyReportModal.tsx
│   ├── ApiAccessModal.tsx
│   ├── QueryPanel.tsx
│   └── Footer.tsx
├── lib/
│   ├── blockscout.ts                     # Blockscout API client
│   └── supabase.ts                       # Supabase client + report functions
├── types/index.ts
└── supabase/schema.sql
```

---

## Deployment

Deployed on Vercel. The weekly report cron runs every Sunday at midnight UTC via Vercel Cron Jobs (`vercel.json`).

Add `CRON_SECRET` as an environment variable in Vercel to protect the cron endpoint.

---

## About

Built by [Abu Olumi](https://x.com/Olumi441) as a contribution to the LiteForge/LitVM ecosystem.

Vein is submitted to the [LitVM Builders Program](https://builders.litvm.com/) as ecosystem intelligence infrastructure — a free, open tool that makes LiteForge activity legible to builders, researchers, and the Litecoin community.

---

*Data via Blockscout API · Not financial advice*
