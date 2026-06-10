import { NextResponse } from 'next/server'
import { getAllReports } from '@/lib/supabase'

export async function GET() {
  try {
    const reports = await getAllReports()
    return NextResponse.json({ reports }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' }
    })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}