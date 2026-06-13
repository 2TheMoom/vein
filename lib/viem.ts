/**
 * vein/lib/viem.ts
 * Viem client + VeinRegistry contract helpers for server-side API routes
 */
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export const VEIN_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_VEIN_REGISTRY_ADDRESS as `0x${string}`

export const LITEFORGE_CHAIN = {
  id: 4441,
  name: 'LiteForge',
  nativeCurrency: { name: 'zkLTC', symbol: 'zkLTC', decimals: 18 },
  rpcUrls: { default: { http: ['https://liteforge.rpc.caldera.xyz/http'] } },
} as const

export const REGISTRY_ABI = parseAbi([
  'function canQuery(address wallet) view returns (bool)',
  'function walletStatus(address wallet) view returns (uint256 credits, uint256 freeUsed, uint256 freeRemaining, uint256 totalUsed, bool eligible)',
  'function consumeQuery(address wallet)',
  'function purchaseCredits() payable',
  'function queryPrice() view returns (uint256)',
  'function freeQueryLimit() view returns (uint256)',
])

export const publicClient = createPublicClient({
  chain: LITEFORGE_CHAIN,
  transport: http('https://liteforge.rpc.caldera.xyz/http'),
})

export function getWalletClient() {
  const pk = process.env.VEIN_OWNER_PRIVATE_KEY
  if (!pk) throw new Error('VEIN_OWNER_PRIVATE_KEY not set')
  const account = privateKeyToAccount(pk as `0x${string}`)
  return createWalletClient({
    account,
    chain: LITEFORGE_CHAIN,
    transport: http('https://liteforge.rpc.caldera.xyz/http'),
  })
}

export async function checkCanQuery(wallet: string): Promise<boolean> {
  try {
    if (!VEIN_REGISTRY_ADDRESS) return true // fallback if contract not deployed yet
    const result = await publicClient.readContract({
      address: VEIN_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'canQuery',
      args: [wallet as `0x${string}`],
    })
    return result as boolean
  } catch {
    return true // fail open — don't block users if contract is unreachable
  }
}

export async function consumeQueryOnChain(wallet: string): Promise<string | null> {
  try {
    if (!VEIN_REGISTRY_ADDRESS) return null
    const walletClient = getWalletClient()
    const hash = await walletClient.writeContract({
      address: VEIN_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'consumeQuery',
      args: [wallet as `0x${string}`],
    })
    return hash
  } catch (e) {
    console.error('consumeQueryOnChain error:', e)
    return null
  }
}

export async function getWalletStatus(wallet: string) {
  try {
    if (!VEIN_REGISTRY_ADDRESS) return null
    const result = await publicClient.readContract({
      address: VEIN_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'walletStatus',
      args: [wallet as `0x${string}`],
    }) as [bigint, bigint, bigint, bigint, boolean]

    return {
      credits:       Number(result[0]),
      freeUsed:      Number(result[1]),
      freeRemaining: Number(result[2]),
      totalUsed:     Number(result[3]),
      eligible:      result[4],
    }
  } catch {
    return null
  }
}