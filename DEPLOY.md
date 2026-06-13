# VeinRegistry — Deployment Guide

Deploy the VeinRegistry contract to LiteForge (Chain ID 4441) using Remix IDE.

---

## Step 1 — Add LiteForge to MetaMask

Network name: LiteForge  
RPC URL: https://liteforge.rpc.caldera.xyz/http  
Chain ID: 4441  
Currency symbol: zkLTC  
Block explorer: https://liteforge.explorer.caldera.xyz  

---

## Step 2 — Get testnet zkLTC

Go to the Caldera faucet and request zkLTC for your deployer wallet.

---

## Step 3 — Deploy via Remix

1. Go to remix.ethereum.org
2. Create a new file: `VeinRegistry.sol`
3. Paste the full contract code from `contracts/VeinRegistry.sol`
4. Compiler tab → Select `0.8.20` → Enable optimization (200 runs) → Compile
5. Deploy tab → Environment: **Injected Provider - MetaMask**
6. Make sure MetaMask is on LiteForge (Chain ID 4441)
7. Constructor argument: `0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb`
8. Click **Deploy** → confirm in MetaMask

---

## Step 4 — Save the contract address

Copy the deployed contract address from Remix.  
It will look like: `0x...`

---

## Step 5 — Update environment variables

Add to `.env.local` and Vercel environment variables:

```
NEXT_PUBLIC_VEIN_REGISTRY_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
VEIN_OWNER_PRIVATE_KEY=0xYOUR_DEPLOYER_WALLET_PRIVATE_KEY
```

⚠️ NEVER commit `VEIN_OWNER_PRIVATE_KEY` to GitHub.  
Add `.env.local` to `.gitignore` — it should already be there.

---

## Step 6 — Verify on explorer

Go to:  
`https://liteforge.explorer.caldera.xyz/address/0xYOUR_CONTRACT_ADDRESS`

You should see the contract deployed with:
- `owner` = your deployer wallet
- `paymentDestination` = `0x1a870eA7c2AEC156ff84c83fa4fD30bf9D6be5fb`
- `queryPrice` = `5000000000000000` (0.005 zkLTC)
- `freeQueryLimit` = `5`

---

## Step 7 — Update API routes

Once the contract is deployed and env vars are set, the API routes in  
`app/api/intelligence/` will automatically use the on-chain registry  
instead of Supabase for query tracking.

The `lib/viem.ts` file handles the contract interactions:
- `checkCanQuery(wallet)` — reads from contract, returns bool
- `consumeQueryOnChain(wallet)` — writes to contract, costs gas
- `getWalletStatus(wallet)` — returns credits, freeUsed, freeRemaining

---

## Contract Functions

| Function | Type | Description |
|---|---|---|
| `purchaseCredits()` | payable | Buy credits by sending zkLTC |
| `canQuery(wallet)` | view | Check if wallet can query |
| `walletStatus(wallet)` | view | Full wallet credit status |
| `consumeQuery(wallet)` | owner only | Deduct one credit |
| `grantCredits(wallet, amount)` | owner only | Give bonus credits |
| `setQueryPrice(price)` | owner only | Update price in wei |
| `setFreeQueryLimit(limit)` | owner only | Update free query count |
| `setPaymentDestination(addr)` | owner only | Update payment address |
| `transferOwnership(addr)` | owner only | Transfer contract ownership |

---

## Architecture After Deployment

```
User query → API route
  → checkCanQuery(wallet) via contract (read, free)
  → serve the data
  → consumeQueryOnChain(wallet) via contract (write, costs gas)
  
User payment → purchaseCredits() on contract
  → zkLTC forwarded to paymentDestination
  → credits added to wallet mapping
  → CreditsPurchased event emitted
```

Supabase remains as a backup tracker and for weekly reports.
The contract is the source of truth for query credits.