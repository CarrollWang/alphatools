'use client'

import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import AirdropOverview from '@/components/airdrop-overview'
import WalletSelector from '@/components/wallet-selector'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAirdropProjects } from '@/hooks/use-airdrop'
import { useLocalStorage } from '@/hooks/use-local-storage'
import type { Wallet } from '@/types'

export default function AirdropTrackerPage() {
  const [selectedWallet] = useLocalStorage<Wallet | null>('selectedWallet', null)
  const { data: projects = [], isLoading, error } = useAirdropProjects()
  
  // 模拟数据 - 在实际应用中应该从API获取
  const mockUserInfo = projects.map(project => {
    const alphaPoints = Math.floor(Math.random() * 300) + 100
    const isEligible = Math.random() > 0.3
    return {
      projectId: project.id,
      userAddress: selectedWallet?.address || ('0x' as const),
      alphaPoints,
      isEligible,
      hasClaimed: isEligible && Math.random() > 0.7,
      claimAmount: isEligible ? Math.floor(Math.random() * 1000 + 100).toString() : undefined,
      claimTxHash: undefined,
      eligibilitySnapshot: isEligible ? {
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        points: alphaPoints,
        rank: Math.floor(Math.random() * 10000) + 1
      } : undefined
    }
  })
  
  const mockAlphaPoints = {
    totalPoints: Math.floor(Math.random() * 500) + 100,
    balancePoints: Math.floor(Math.random() * 300) + 50,
    volumePoints: Math.floor(Math.random() * 200) + 50,
    expiringPoints: Math.floor(Math.random() * 50),
    lastUpdated: Date.now()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">币安 Alpha 空投追踪器</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              实时追踪币安 Alpha 项目空投进度和领取情况
            </p>
          </div>
          
          <div className="w-full max-w-5xl mx-auto">
            <WalletSelector />
          </div>
          
          {error && (
            <div className="w-full max-w-5xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  获取空投数据失败，请稍后重试
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {!selectedWallet && !isLoading && (
            <div className="w-full max-w-5xl mx-auto">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  请先选择或添加钱包地址来查看空投信息
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {selectedWallet && (
            <div className="w-full max-w-5xl mx-auto">
              <AirdropOverview 
                projects={projects}
                userInfo={mockUserInfo}
                alphaPoints={mockAlphaPoints}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}