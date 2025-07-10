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
              专业的 DeFi 分析和计算工具正在开发中
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">功能开发中</CardTitle>
                <CardDescription className="text-center">
                  我们正在开发以下 DeFi 工具，敬请期待
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">收益计算器</h3>
                      <p className="text-sm text-muted-foreground">流动性挖矿、质押收益计算</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">无常损失计算器</h3>
                      <p className="text-sm text-muted-foreground">评估流动性提供风险</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">协议分析</h3>
                      <p className="text-sm text-muted-foreground">DeFi 协议深度分析</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">套利机会发现</h3>
                      <p className="text-sm text-muted-foreground">跨平台套利监控</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    目前专注于钱包监控功能的完善，DeFi 工具将在后续版本中推出
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}