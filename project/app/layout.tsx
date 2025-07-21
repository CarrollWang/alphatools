import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import Providers from './providers'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Web3 工具站 - 一站式区块链工具平台',
  description: '提供币安 Alpha 交易统计、DeFi 分析、NFT 工具等多种 Web3 实用工具',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            className="flex justify-center"
            offset={{ top: '12px' }}
            mobileOffset={{ top: '8px' }}
            toastOptions={{ style: { width: 'fit-content', margin: '0 auto' } }}
          />
        </Providers>
      </body>
    </html>
  )
}