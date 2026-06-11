import { WalletProfile } from '@/components/WalletProfile'

interface PageProps {
  params: Promise<{ address: string }>
}

export default async function WalletPage({ params }: PageProps) {
  const { address } = await params
  return <WalletProfile address={address} />
}

export async function generateMetadata({ params }: PageProps) {
  const { address } = await params
  const short = `${address.slice(0, 6)}…${address.slice(-4)}`
  return {
    title: `${short} — Vein Wallet Profile`,
    description: `On-chain activity profile for ${address} on LiteForge.`,
    openGraph: {
      title: `${short} — Vein Wallet Profile`,
      description: `On-chain activity profile for ${address} on LiteForge.`,
    },
  }
}