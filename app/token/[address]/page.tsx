import { TokenProfile } from '@/components/TokenProfile'

interface PageProps {
  params: Promise<{ address: string }>
}

export default async function TokenPage({ params }: PageProps) {
  const { address } = await params
  return <TokenProfile address={address} />
}

export async function generateMetadata({ params }: PageProps) {
  const { address } = await params
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`
  return {
    title: `${short} — Vein Token Profile`,
    description: `Token details for ${address} on LiteForge.`,
  }
}