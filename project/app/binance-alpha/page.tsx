import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import TransactionSearch from '@/components/transaction-search'
import WalletSelector from '@/components/wallet-selector'

export default function BinanceAlphaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              币安 Alpha 交易统计
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              实时追踪和分析币安 Alpha 项目的交易数据，洞察市场动态
            </p>
          </div>
          
          {/* 搜索工具栏 */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
            <WalletSelector />
            <TransactionSearch />
          </div>
          
          {/* 使用说明 */}
          <div className="bg-muted/30 p-6 rounded-xl border border-muted max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-3">使用说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">1.</span>
                <span>选择或添加要分析的钱包地址</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">2.</span>
                <span>点击搜索按钮获取交易数据</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">3.</span>
                <span>查看详细的交易统计和代币分析</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">4.</span>
                <span>分析Alpha项目的交易表现</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}