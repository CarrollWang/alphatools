'use client'

import type { Hex } from 'viem'
import type { TokenInfo, TransactionInfo } from '@/types'
import { useAtom } from 'jotai'
import { CheckCheck, Copy, ExternalLink, Milestone } from 'lucide-react'
import { useCallback, useState } from 'react'
import { walletsAtom } from '@/atoms'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/components/ui/toast'
import { 
  useTransactionStatistics, 
  useTokenStatistics, 
  useWalletOverview 
} from '@/hooks/use-transaction-analytics'
import { calculatePoints, cn, formatAddress } from '@/lib/utils'

interface WalletOverviewProps {
  data: {
    address: Hex
    transactions: TransactionInfo[]
    tokens: TokenInfo[]
  }
  isLoading: boolean
}

function WalletOverviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-[25px] w-60" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function WalletOverview({ data, isLoading }: WalletOverviewProps) {
  const { address, transactions, tokens } = data
  const [wallets] = useAtom(walletsAtom)
  const [copied, setCopied] = useState(false)

  // 使用优化的统计计算 hooks
  const transactionStats = useTransactionStatistics(transactions)
  const tokenStats = useTokenStatistics(tokens)
  const walletOverview = useWalletOverview(address, transactions, tokens)

  // 获取钱包标签
  const currentWallet = wallets.find(wallet => wallet.address.toLowerCase() === address.toLowerCase())
  const walletLabel = currentWallet?.label || formatAddress(address)

  // 优化的复制功能
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast({ title: '地址已复制' })
    } catch (error) {
      // 回退方案
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      toast({ title: '地址已复制' })
    }

    setTimeout(() => setCopied(false), 2000)
  }, [address])

  // 积分计算
  const { points, range } = calculatePoints(transactionStats.tradingValue)
  const progressPercentage = transactionStats.tradingValue > 0 
    ? ((transactionStats.tradingValue - range[0]) / (range[1] - range[0])) * 100 
    : 0

  if (isLoading) {
    return <WalletOverviewSkeleton />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{walletLabel}</span>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8"
                  >
                    {copied ? (
                      <CheckCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? '已复制' : '复制地址'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8"
                  >
                    <a
                      href={`https://bscscan.com/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>在 BSCScan 上查看</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
        <CardDescription className="font-mono text-sm">
          {address}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {/* 交易数量 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">交易数量</span>
            <span className="text-2xl font-bold">
              {transactionStats.totalTransactions}
            </span>
            {transactionStats.failedTransactions > 0 && (
              <span className="text-xs text-destructive">
                {transactionStats.failedTransactions} 失败
              </span>
            )}
          </div>

          {/* 交易价值 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">交易价值</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-2xl font-bold cursor-help">
                    ${transactionStats.tradingValue.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>基于成功的 Alpha 代币交易计算</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 盈亏情况 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">盈亏</span>
            <span className={cn(
              "text-2xl font-bold",
              tokenStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {tokenStats.totalPnL >= 0 ? '+' : ''}${tokenStats.totalPnL.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              {tokenStats.profitableTokens}/{tokenStats.totalTokens} 盈利
            </span>
          </div>

          {/* 成功率 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">成功率</span>
            <span className="text-2xl font-bold">
              {transactionStats.successRate.toFixed(1)}%
            </span>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div 
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  transactionStats.successRate >= 80 ? "bg-green-600" :
                  transactionStats.successRate >= 60 ? "bg-yellow-600" : "bg-red-600"
                )}
                style={{ width: `${transactionStats.successRate}%` }}
              />
            </div>
          </div>

          {/* 积分系统 */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              积分等级
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Milestone className="h-3 w-3" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>基于交易价值计算的等级积分</p>
                    <p className="text-xs text-muted-foreground">
                      下一级需要: ${range[1].toLocaleString()}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg font-bold px-2 py-1">
                {points}
              </Badge>
            </div>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">
                ${range[0].toLocaleString()} - ${range[1].toLocaleString()}
              </div>
              <Progress value={progressPercentage} className="h-1" />
            </div>
          </div>
        </div>

        {/* 代币持仓概览 */}
        {tokens.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              代币持仓概览 ({tokens.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {tokens.slice(0, 8).map((token, index) => {
                const netFlow = token.in - token.out
                const value = netFlow * token.price
                return (
                  <div key={token.address} className="p-2 rounded-md border bg-muted/20">
                    <div className="text-sm font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {netFlow.toFixed(6)}
                    </div>
                    <div className={cn(
                      "text-xs font-medium",
                      value >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      ${value.toFixed(2)}
                    </div>
                  </div>
                )
              })}
              {tokens.length > 8 && (
                <div className="p-2 rounded-md border bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                  +{tokens.length - 8} 更多
                </div>
              )}
            </div>
          </div>
        )}

        {/* 交易活动时间线 */}
        {walletOverview.firstTransactionDate && walletOverview.lastTransactionDate && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                首次交易: {walletOverview.firstTransactionDate.toLocaleDateString()}
              </span>
              <span>
                最近交易: {walletOverview.lastTransactionDate.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>
                平均交易价值: ${walletOverview.avgTransactionValue.toFixed(2)}
              </span>
              <span>
                累计手续费: ${walletOverview.totalFees.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}