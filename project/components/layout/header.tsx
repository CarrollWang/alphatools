'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart3, Bell, Coins, Menu, Wallet, RefreshCw, Gift } from 'lucide-react'
import { useState } from 'react'
import { useAtom } from 'jotai'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { twitterVerificationAtom } from '@/atoms'
import { toast } from 'sonner'

const navigation = [
  {
    name: '首页',
    href: '/',
    icon: Activity,
  },
  {
    name: '币安 Alpha',
    href: '/binance-alpha',
    icon: BarChart3,
  },
  {
    name: '空投追踪器',
    href: '/airdrop-tracker',
    icon: Gift,
  },
  {
    name: '钱包监控',
    href: '/wallet-monitor',
    icon: Bell,
  },
  {
    name: 'DeFi 工具',
    href: '/defi-tools',
    icon: Coins,
  },
  {
    name: '钱包工具',
    href: '/wallet-tools',
    icon: Wallet,
  },
]

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [, setTwitterVerified] = useAtom(twitterVerificationAtom)

  const handleResetVerification = () => {
    setTwitterVerified(false)
    toast.success('已重置 Twitter 验证状态')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="hidden font-bold sm:inline-block">Web3 工具站</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary',
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Reset verification button - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetVerification}
                className="hidden sm:flex"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重置验证
              </Button>
            )}
            <ThemeToggle />
            
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary p-2 rounded-md',
                          pathname === item.href || pathname.startsWith(item.href + '/')
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                  
                  {/* Reset verification button - only in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant="outline"
                      onClick={handleResetVerification}
                      className="flex items-center space-x-2 mt-4"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>重置验证</span>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}