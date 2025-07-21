import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import TransactionSearch from '@/components/transaction-search'
import WalletSelector from '@/components/wallet-selector'

export default function BinanceAlphaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center gap-8 mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">币安 Alpha 交易统计</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              实时追踪和分析币安 Alpha 项目的交易数据
            </p>
          </div>
          
          <div className="w-full max-w-5xl flex items-center gap-2">
            <WalletSelector />
            <TransactionSearch />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}