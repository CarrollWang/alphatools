import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WalletToolsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight mb-4">钱包工具</h1>
            <p className="text-muted-foreground text-lg">
              全面的钱包分析和管理工具
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>地址分析</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  深度分析钱包地址的交易历史和资产分布
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  提供详细的交易记录、资产持仓、交易模式分析等功能
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>资产追踪</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  实时追踪多链资产变化
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  支持以太坊、BSC、Polygon 等主流链的资产实时监控
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>交易标签</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  为交易添加智能标签和分类
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  自动识别 DeFi、NFT、游戏等不同类型的交易并添加标签
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>安全检测</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  检测钱包安全风险和异常活动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  识别可疑交易、钓鱼攻击、授权风险等安全威胁
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}