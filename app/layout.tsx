import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vein — LiteForge Intelligence',
  description: 'Live on-chain intelligence for LiteForge. Every transaction. Every wallet. Every move.',
  keywords: ['LiteForge', 'LitVM', 'zkLTC', 'Litecoin', 'blockchain'],
  metadataBase: new URL('https://vein-lilac.vercel.app'),
  openGraph: {
    title: 'Vein — LiteForge Intelligence',
    description: 'Live on-chain intelligence for LiteForge. Every transaction. Every wallet. Every move.',
    type: 'website',
    url: 'https://vein-lilac.vercel.app',
    siteName: 'Vein',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vein — LiteForge Ecosystem Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vein — LiteForge Intelligence',
    description: 'Live on-chain intelligence for LiteForge. Every transaction. Every wallet. Every move.',
    images: ['/og-image.png'],
    creator: '@VeinOnLitVM',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      </head>
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}