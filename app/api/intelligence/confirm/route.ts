import { NextRequest, NextResponse } from 'next/server'
import { getWalletStatus } from '@/lib/viem'
import { FREE_QUERY_LIMIT } from '@/lib/blockscout'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wallet } = body

    if (!wallet) {
      return NextResponse.json(
        { error: 'wallet required in body' },
        { status: 400 }
      )
    }

    const w = wallet.toLowerCase()

    const status = await getWalletStatus(w)

    if (!status) {
      return NextResponse.json(
        { error: 'Could not read contract. Try again shortly.' },
        { status: 503 }
      )
    }

    if (status.credits === 0) {
      return NextResponse.json(
        {
          error: 'No credits found on-chain.',
          message: 'Call purchaseCredits() on VeinRegistry sending 0.005 zkLTC per credit.',
          contract: process.env.NEXT_PUBLIC_VEIN_REGISTRY_ADDRESS,
        },
        { status: 402 }
      )
    }

    const db = getAdmin()
    await db.from('vein_queries').upsert(
      {
        wallet: w,
        count: 0,
        last_query: new Date().toISOString(),
        last_payment_tx: `onchain:${status.credits}credits`,
      },
      { onConflict: 'wallet' }
    )

    return NextResponse.json({
      success: true,
      message: `${status.credits} credit${status.credits === 1 ? '' : 's'} confirmed on-chain. Your query limit has been reset — ${FREE_QUERY_LIMIT} more queries unlocked.`,
      wallet: w,
      onChainCredits: status.credits,
      queriesUnlocked: FREE_QUERY_LIMIT,
      contract: process.env.NEXT_PUBLIC_VEIN_REGISTRY_ADDRESS,
    })
  } catch (e) {
    console.error('Confirm error:', e)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}

function getAdmin() {
  const { createClient } = require('@supabase/supabase-js')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
  return createClient(url, key)
}
