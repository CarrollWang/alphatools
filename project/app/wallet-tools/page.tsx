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
              钱包分析和管理工具正在开发中
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">功能开发中</CardTitle>
                <CardDescription className="text-center">
                  我们正在开发以下钱包工具，敬请期待
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">地址分析</h3>
                      <p className="text-sm text-muted-foreground">深度分析钱包交易历史和资产分布</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">资产追踪</h3>
                      <p className="text-sm text-muted-foreground">实时追踪多链资产变化</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">交易标签</h3>
                      <p className="text-sm text-muted-foreground">智能标签和交易分类</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">安全检测</h3>
                      <p className="text-sm text-muted-foreground">检测钱包安全风险和异常活动</p>
                    </div>
                    <Badge variant="outline">规划中</Badge>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-center text-muted-foreground">
                    目前专注于钱包监控功能的完善，更多钱包工具将在后续版本中推出
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