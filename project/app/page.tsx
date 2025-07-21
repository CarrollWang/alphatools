import Link from 'next/link'
import { ArrowRight, BarChart3, Bell, Coins, Shield, TrendingUp, Wallet, Zap } from 'lucide-react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: BarChart3,
    title: '币安 Alpha 交易统计',
    description: '实时追踪币安 Alpha 项目的交易数据，分析投资收益和风险',
    href: '/binance-alpha',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    icon: Bell,
    title: '钱包地址监控',
    description: '实时监控钱包地址的代币转入转出，第一时间邮件通知',
    href: '/wallet-monitor',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
  },
  {
    icon: Coins,
    title: 'DeFi 收益计算器',
    description: '计算流动性挖矿、质押收益，优化 DeFi 投资策略',
    href: '/defi-tools',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
  },
  {
    icon: Wallet,
    title: '钱包地址分析',
    description: '深度分析钱包地址的交易历史和资产分布',
    href: '/wallet-tools',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    icon: Shield,
    title: '安全检测工具',
    description: '检测智能合约安全性，识别潜在风险',
    href: '/security-tools',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
  },
  {
    icon: TrendingUp,
    title: '市场趋势分析',
    description: '实时市场数据分析，把握投资机会',
    href: '/market-analysis',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
  },
]

const stats = [
  { label: '活跃用户', value: '10,000+' },
  { label: '分析交易', value: '1,000,000+' },
  { label: '支持链', value: '10+' },
  { label: '工具数量', value: '20+' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                专业的
                <span className="text-primary"> Web3 工具站</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                为区块链用户提供全方位的数据分析、交易工具和安全检测服务，让您的 Web3 之旅更加安全高效
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/binance-alpha">
                    开始使用
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="#features">了解更多</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">强大的工具集合</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                从交易分析到安全检测，我们提供您在 Web3 世界中需要的所有工具
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <Link href={feature.href}>
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                          <Icon className={`h-6 w-6 ${feature.color}`} />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {feature.title}
                        </CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-primary group-hover:translate-x-1 transition-transform">
                          立即使用
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              准备开始您的 Web3 之旅？
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              立即使用我们的工具，获得专业的区块链数据分析和投资洞察
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/binance-alpha">
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}