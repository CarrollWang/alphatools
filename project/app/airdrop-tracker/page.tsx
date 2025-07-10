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
      
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              币安 Alpha 空投追踪器
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              实时追踪币安 Alpha 项目空投进度和领取情况，把握每一个空投机会
            </p>
          </div>
          
          {/* 钱包选择器 */}
          <div className="flex justify-center">
            <div className="bg-muted/30 p-6 rounded-xl border border-muted">
              <WalletSelector />
            </div>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive" className="max-w-4xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                获取空投数据失败，请稍后重试
              </AlertDescription>
            </Alert>
          )}
          
          {/* 钱包未选择提示 */}
          {!selectedWallet && !isLoading && (
            <Alert className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                请先选择或添加钱包地址来查看您的专属空投信息
              </AlertDescription>
            </Alert>
          )}
          
          {/* 空投数据展示 */}
          {selectedWallet && (
            <div className="space-y-6">
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