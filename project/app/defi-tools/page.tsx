import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function DeFiToolsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight mb-4">DeFi 工具</h1>
            <p className="text-muted-foreground text-lg">
              专业的 DeFi 分析和计算工具，助您优化投资策略
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>收益计算器</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  计算流动性挖矿、质押等 DeFi 产品的预期收益
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  支持主流 DeFi 协议的收益计算，包括 Uniswap、PancakeSwap、Compound 等
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>无常损失计算器</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  评估流动性提供中的无常损失风险
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  实时计算不同价格变动下的无常损失，帮助您做出明智的投资决策
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>协议分析</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  深度分析 DeFi 协议的风险和收益
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  提供协议 TVL、收益率历史、安全评级等关键指标分析
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>套利机会发现</CardTitle>
                  <Badge variant="secondary">即将推出</Badge>
                </div>
                <CardDescription>
                  实时监控跨平台套利机会
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  自动扫描不同 DEX 之间的价格差异，发现套利机会
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