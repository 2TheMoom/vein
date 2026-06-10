import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wallet, txId } = body

    if (!wallet || !txId) {
      return NextResponse.json(
        { error: 'wallet and txId required in body' },
        { status: 400 }
      )
    }

    const confirmed = await confirmPayment(wallet.toLowerCase(), txId)

    if (!confirmed) {
      return NextResponse.json(
        { error: 'Payment not confirmed. Verify the tx exists on LiteForge and was sent to the correct destination.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '1 credit added. Your next query will be served immediately.',
      wallet: wallet.toLowerCase(),
      txId,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 })
  }
}