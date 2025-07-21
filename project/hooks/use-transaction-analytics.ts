import { useMemo, useCallback } from 'react'
import type { TransactionInfo, TokenInfo } from '@/types'
import type { Hex } from 'viem'
import alphaTokens from '@/constants/tokens'
import { isAddressEqual } from '@/lib/utils'

// 交易统计计算的自定义 hook
export function useTransactionStatistics(transactions: TransactionInfo[]) {
  return useMemo(() => {
    if (!transactions.length) {
      return {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        tradingValue: 0,
        totalFees: 0,
        successRate: 0,
      }
    }

    const successful = transactions.filter(tx => tx.status === 'success')
    const failed = transactions.filter(tx => tx.status === 'failed')
    
    // 预计算 alpha token 地址集合，提高查找效率
    const alphaTokenAddresses = new Set(
      alphaTokens.map(token => token.contractAddress.toLowerCase())
    )

    // 计算交易价值 - 只计算成功的 alpha token 交易
    const tradingValue = successful
      .filter(tx => alphaTokenAddresses.has(tx.to.address.toLowerCase()))
      .reduce((total, tx) => {
        const value = tx.from.amount * (tx.from.price || 0)
        return total + value
      }, 0)

    // 计算总手续费
    const totalFees = successful.reduce((total, tx) => {
      const fee = (tx.gasUsed || 0) * (tx.gasPrice || 0) * (tx.from.price || 0)
      return total + fee
    }, 0)

    const successRate = transactions.length > 0 
      ? (successful.length / transactions.length) * 100 
      : 0

    return {
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      tradingValue,
      totalFees,
      successRate,
    }
  }, [transactions])
}

// 代币统计计算的自定义 hook
export function useTokenStatistics(tokens: TokenInfo[]) {
  return useMemo(() => {
    if (!tokens.length) {
      return {
        totalTokens: 0,
        profitableTokens: 0,
        totalValue: 0,
        totalPnL: 0,
        bestPerformer: null as TokenInfo | null,
        worstPerformer: null as TokenInfo | null,
      }
    }

    let totalValue = 0
    let totalPnL = 0
    let bestPerformer: TokenInfo | null = null
    let worstPerformer: TokenInfo | null = null
    let bestPnL = -Infinity
    let worstPnL = Infinity

    const profitableCount = tokens.reduce((count, token) => {
      const netFlow = token.in - token.out
      const currentValue = Math.abs(netFlow) * token.price
      const pnl = netFlow * token.price

      totalValue += currentValue
      totalPnL += pnl

      // 跟踪最佳和最差表现者
      if (pnl > bestPnL) {
        bestPnL = pnl
        bestPerformer = token
      }
      if (pnl < worstPnL) {
        worstPnL = pnl
        worstPerformer = token
      }

      return pnl > 0 ? count + 1 : count
    }, 0)

    return {
      totalTokens: tokens.length,
      profitableTokens: profitableCount,
      totalValue,
      totalPnL,
      bestPerformer,
      worstPerformer,
    }
  }, [tokens])
}

// 交易过滤器 hook
export function useTransactionFilters() {
  const filterByType = useCallback((
    transactions: TransactionInfo[],
    type: 'all' | 'buy' | 'sell'
  ) => {
    if (type === 'all') return transactions
    
    const alphaTokenAddresses = new Set(
      alphaTokens.map(token => token.contractAddress.toLowerCase())
    )

    return transactions.filter(tx => {
      const isBuy = alphaTokenAddresses.has(tx.to.address.toLowerCase())
      const isSell = alphaTokenAddresses.has(tx.from.address.toLowerCase())
      
      return type === 'buy' ? isBuy : isSell
    })
  }, [])

  const filterByStatus = useCallback((
    transactions: TransactionInfo[],
    includeSuccessful: boolean = true,
    includeFailed: boolean = false
  ) => {
    return transactions.filter(tx => {
      if (tx.status === 'success') return includeSuccessful
      if (tx.status === 'failed') return includeFailed
      return false
    })
  }, [])

  const filterByTimeRange = useCallback((
    transactions: TransactionInfo[],
    startTime?: number,
    endTime?: number
  ) => {
    if (!startTime && !endTime) return transactions
    
    return transactions.filter(tx => {
      const timestamp = tx.timestamp
      if (startTime && timestamp < startTime) return false
      if (endTime && timestamp > endTime) return false
      return true
    })
  }, [])

  const filterByTokens = useCallback((
    transactions: TransactionInfo[],
    tokenAddresses: Hex[]
  ) => {
    if (!tokenAddresses.length) return transactions
    
    const addressSet = new Set(tokenAddresses.map(addr => addr.toLowerCase()))
    
    return transactions.filter(tx => 
      addressSet.has(tx.from.address.toLowerCase()) ||
      addressSet.has(tx.to.address.toLowerCase())
    )
  }, [])

  return {
    filterByType,
    filterByStatus,
    filterByTimeRange,
    filterByTokens,
  }
}

// 性能优化的交易分组 hook
export function useTransactionGrouping(transactions: TransactionInfo[]) {
  return useMemo(() => {
    const groupedByDate: Record<string, TransactionInfo[]> = {}
    const groupedByToken: Record<string, TransactionInfo[]> = {}
    const groupedByStatus: Record<string, TransactionInfo[]> = {}

    transactions.forEach(tx => {
      // 按日期分组
      const date = new Date(tx.timestamp * 1000).toDateString()
      if (!groupedByDate[date]) groupedByDate[date] = []
      groupedByDate[date].push(tx)

      // 按代币分组（基于目标代币）
      const tokenSymbol = tx.to.symbol
      if (!groupedByToken[tokenSymbol]) groupedByToken[tokenSymbol] = []
      groupedByToken[tokenSymbol].push(tx)

      // 按状态分组
      if (!groupedByStatus[tx.status]) groupedByStatus[tx.status] = []
      groupedByStatus[tx.status].push(tx)
    })

    return {
      byDate: groupedByDate,
      byToken: groupedByToken,
      byStatus: groupedByStatus,
    }
  }, [transactions])
}

// 钱包概览数据 hook
export function useWalletOverview(
  address: Hex,
  transactions: TransactionInfo[],
  tokens: TokenInfo[]
) {
  return useMemo(() => {
    if (!transactions.length) {
      return {
        address,
        transactionCount: 0,
        totalValue: 0,
        totalPnL: 0,
        successRate: 0,
        avgTransactionValue: 0,
        uniqueTokens: 0,
        firstTransactionDate: null as Date | null,
        lastTransactionDate: null as Date | null,
        totalFees: 0,
      }
    }

    const successful = transactions.filter(tx => tx.status === 'success')
    const uniqueTokens = new Set([
      ...transactions.map(tx => tx.from.address.toLowerCase()),
      ...transactions.map(tx => tx.to.address.toLowerCase()),
    ]).size

    const timestamps = transactions.map(tx => tx.timestamp)
    const firstTransaction = Math.min(...timestamps)
    const lastTransaction = Math.max(...timestamps)

    const totalValue = tokens.reduce((sum, token) => {
      return sum + Math.abs(token.in - token.out) * token.price
    }, 0)

    const totalPnL = tokens.reduce((sum, token) => {
      return sum + (token.in - token.out) * token.price
    }, 0)

    const totalFees = successful.reduce((sum, tx) => {
      return sum + (tx.gasUsed || 0) * (tx.gasPrice || 0) * (tx.from.price || 0)
    }, 0)

    const avgTransactionValue = successful.length > 0 
      ? totalValue / successful.length 
      : 0

    return {
      address,
      transactionCount: transactions.length,
      totalValue,
      totalPnL,
      successRate: (successful.length / transactions.length) * 100,
      avgTransactionValue,
      uniqueTokens,
      firstTransactionDate: new Date(firstTransaction * 1000),
      lastTransactionDate: new Date(lastTransaction * 1000),
      totalFees,
    }
  }, [address, transactions, tokens])
}

// 价格变化追踪 hook
export function usePriceChangeTracking(tokens: TokenInfo[]) {
  return useMemo(() => {
    // 这里可以扩展为从 API 获取历史价格数据
    // 目前只返回当前价格信息
    return tokens.map(token => ({
      ...token,
      priceChange24h: 0, // 可以从价格 API 获取
      priceChangePercent24h: 0,
    }))
  }, [tokens])
}

// 交易频率分析 hook
export function useTransactionFrequency(transactions: TransactionInfo[]) {
  return useMemo(() => {
    if (!transactions.length) {
      return {
        dailyAverage: 0,
        weeklyAverage: 0,
        monthlyAverage: 0,
        peakHour: 0,
        quietHour: 0,
      }
    }

    // 按小时统计交易数量
    const hourlyCount = new Array(24).fill(0)
    const dailyCount: Record<string, number> = {}

    transactions.forEach(tx => {
      const date = new Date(tx.timestamp * 1000)
      const hour = date.getHours()
      const dateKey = date.toDateString()

      hourlyCount[hour]++
      dailyCount[dateKey] = (dailyCount[dateKey] || 0) + 1
    })

    const dailyValues = Object.values(dailyCount)
    const dailyAverage = dailyValues.length > 0 
      ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length 
      : 0

    const peakHour = hourlyCount.indexOf(Math.max(...hourlyCount))
    const quietHour = hourlyCount.indexOf(Math.min(...hourlyCount))

    return {
      dailyAverage,
      weeklyAverage: dailyAverage * 7,
      monthlyAverage: dailyAverage * 30,
      peakHour,
      quietHour,
    }
  }, [transactions])
}