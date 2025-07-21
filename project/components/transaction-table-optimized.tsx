'use client'

import type { TokenInfo, TransactionInfo } from '@/types'
import { Clock, ExternalLink, Filter } from 'lucide-react'
import { motion } from 'motion/react'
import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import alphaTokens from '@/constants/tokens'
import { useLocalStorage } from '@/hooks/use-local-storage'
import dayjs from '@/lib/dayjs'
import { cn, formatAddress, isAddressEqual } from '@/lib/utils'

interface TransactionsTableProps {
  data: {
    transactions: TransactionInfo[]
    tokens: TokenInfo[]
  }
  isLoading: boolean
}

interface TransactionSettings {
  activeTab: '0' | '1'
  filter: 'all' | 'buy' | 'sell'
  showFailed: boolean
  timeFormat: 'relative' | 'absolute'
}

const VIRTUAL_SCROLL_THRESHOLD = 100 // 当交易数量超过100时启用虚拟滚动
const ROW_HEIGHT = 80 // 每行高度
const CONTAINER_HEIGHT = 600 // 容器高度

// 优化的过滤逻辑
const useFilteredTransactions = (
  transactions: TransactionInfo[], 
  settings: TransactionSettings
) => {
  return useMemo(() => {
    if (!transactions.length) return []
    
    let filtered = transactions
    
    // 优化地址比较 - 预先创建 Set 提高查找性能
    if (settings.filter !== 'all') {
      const tokenAddresses = new Set(
        alphaTokens.map(token => token.contractAddress.toLowerCase())
      )
      
      if (settings.filter === 'buy') {
        filtered = transactions.filter(tx => 
          tokenAddresses.has(tx.to.address.toLowerCase())
        )
      } else if (settings.filter === 'sell') {
        filtered = transactions.filter(tx => 
          tokenAddresses.has(tx.from.address.toLowerCase())
        )
      }
    }

    // 状态过滤
    if (!settings.showFailed) {
      filtered = filtered.filter(tx => tx.status === 'success')
    }
    
    return filtered
  }, [transactions, settings.filter, settings.showFailed])
}

// 虚拟化行组件
const VirtualTransactionRow = React.memo<ListChildComponentProps>(({ index, style, data }) => {
  const { transactions, settings } = data
  const transaction = transactions[index]
  
  const formatTime = useCallback((timestamp: number, timeFormat: TransactionSettings['timeFormat']) => {
    if (timeFormat === 'relative') {
      return dayjs.unix(timestamp).fromNow()
    }
    return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
  }, [])

  return (
    <div style={style} className="border-b">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center px-4 py-2 h-full transition-colors hover:bg-muted/50',
          transaction.status === 'failed' && 'bg-destructive/10 hover:bg-destructive/20',
        )}
      >
        {/* 序号 */}
        <div className="w-16 font-medium">{transactions.length - index}</div>
        
        {/* 交易哈希 */}
        <div className="flex-1 min-w-0">
          <a
            href={`https://bscscan.com/tx/${transaction.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary font-medium"
          >
            {formatAddress(transaction.hash)}
            <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
          </a>
        </div>
        
        {/* 时间 */}
        <div className="w-32">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm">{formatTime(transaction.timestamp, settings.timeFormat)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs">{formatTime(transaction.timestamp, 'absolute')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* 源代币 */}
        <div className="w-32">
          <div className="flex flex-col">
            <span className="text-green-600 font-semibold text-sm">{transaction.from.amount}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">{transaction.from.symbol}</span>
              <span className="text-xs text-muted-foreground">
                {formatAddress(transaction.from.address)}
              </span>
            </div>
          </div>
        </div>
        
        {/* 目标代币 */}
        <div className="w-32">
          <div className="flex flex-col">
            <span className="text-green-600 font-semibold text-sm">{transaction.to.amount}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs">{transaction.to.symbol}</span>
              <span className="text-xs text-muted-foreground">
                {formatAddress(transaction.to.address)}
              </span>
            </div>
          </div>
        </div>
        
        {/* 手续费 */}
        <div className="w-24 text-right text-sm">
          ${(transaction.gasUsed * transaction.gasPrice * transaction.from.price).toFixed(4)}
        </div>
      </motion.div>
    </div>
  )
})

VirtualTransactionRow.displayName = 'VirtualTransactionRow'

// 常规表格行组件（用于小数据量）
const RegularTransactionRow = React.memo<{ 
  transaction: TransactionInfo
  index: number
  total: number
  settings: TransactionSettings 
}>(({ transaction, index, total, settings }) => {
  const formatTime = useCallback((timestamp: number, timeFormat: TransactionSettings['timeFormat']) => {
    if (timeFormat === 'relative') {
      return dayjs.unix(timestamp).fromNow()
    }
    return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
  }, [])

  return (
    <motion.tr
      key={transaction.hash}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.2, 
        delay: Math.min(index * 0.02, 0.1) // 限制最大延迟
      }}
      className={cn(
        'border-b transition-colors hover:bg-muted/50',
        transaction.status === 'failed' && 'bg-destructive/10 hover:bg-destructive/20',
      )}
    >
      <TableCell className="font-medium">{total - index}</TableCell>
      <TableCell className="font-medium">
        <a
          href={`https://bscscan.com/tx/${transaction.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:text-primary"
        >
          {formatAddress(transaction.hash)}
          <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{formatTime(transaction.timestamp, settings.timeFormat)}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-mono text-xs">{formatTime(transaction.timestamp, 'absolute')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-green-600 font-semibold">{transaction.from.amount}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span>{transaction.from.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatAddress(transaction.from.address)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-mono text-xs">{transaction.from.address}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-green-600 font-semibold">{transaction.to.amount}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <span>{transaction.to.symbol}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatAddress(transaction.to.address)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-mono text-xs">{transaction.to.address}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      <TableCell className="text-right">
        ${(transaction.gasUsed * transaction.gasPrice * transaction.from.price).toFixed(4)}
      </TableCell>
    </motion.tr>
  )
})

RegularTransactionRow.displayName = 'RegularTransactionRow'

function TransactionTableSkeleton() {
  return (
    <Tabs value="0" className="w-full">
      <TabsList>
        <TabsTrigger value="0">
          交易视图
          <Badge variant="secondary" className="flex items-center justify-center rounded-full bg-muted-foreground/30">
            0
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="1">
          代币视图
          <Badge variant="secondary" className="flex items-center justify-center rounded-full bg-muted-foreground/30">
            0
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="0" className="mt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>交易哈希</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>源代币</TableHead>
                <TableHead>目标代币</TableHead>
                <TableHead className="text-right">手续费</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default function TransactionTable({ data, isLoading }: TransactionsTableProps) {
  const { transactions, tokens } = data
  
  const [settings, setSettings] = useLocalStorage<TransactionSettings>('transactionSettings', {
    activeTab: '0',
    filter: 'all',
    showFailed: false,
    timeFormat: 'relative',
  })

  // 使用优化的过滤 hook
  const filteredTransactions = useFilteredTransactions(transactions, settings)
  
  // 判断是否使用虚拟滚动
  const useVirtualScrolling = filteredTransactions.length > VIRTUAL_SCROLL_THRESHOLD

  // 优化的计算函数 - 使用 memoization
  const tokenCalculations = useMemo(() => {
    const getPnL = (token: TokenInfo): string => {
      const netFlow = token.in - token.out
      if (netFlow === 0) return '0.00'
      const profit = netFlow * token.price
      return profit.toFixed(2)
    }

    const getValueColor = (value: number): string => {
      if (value > 0) return 'text-green-600'
      if (value < 0) return 'text-red-600'
      return 'text-muted-foreground'
    }

    return { getPnL, getValueColor }
  }, [])

  const updateSettings = useCallback((updates: Partial<TransactionSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [setSettings])

  const filterTitle = useMemo(() => {
    switch (settings.filter) {
      case 'buy': return '买入'
      case 'sell': return '卖出'
      default: return '全部'
    }
  }, [settings.filter])

  if (isLoading) {
    return <TransactionTableSkeleton />
  }

  return (
    <Tabs
      value={settings.activeTab}
      onValueChange={value => updateSettings({ activeTab: value as '0' | '1' })}
      className="w-full"
    >
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="0">
            交易视图
            <Badge variant="secondary" className="flex items-center justify-center rounded-full bg-muted-foreground/30">
              {filteredTransactions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="1">
            代币视图
            <Badge variant="secondary" className="flex items-center justify-center rounded-full bg-muted-foreground/30">
              {tokens.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {settings.activeTab === '0' && (
          <div className="flex items-center">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>
                  <Filter className="h-4 w-4" />
                  <span className="ml-1">{filterTitle}</span>
                </MenubarTrigger>
                <MenubarContent>
                  <MenubarRadioGroup
                    value={settings.filter}
                    onValueChange={value => updateSettings({ filter: value as any })}
                  >
                    <MenubarRadioItem value="all">全部交易</MenubarRadioItem>
                    <MenubarRadioItem value="buy">买入交易</MenubarRadioItem>
                    <MenubarRadioItem value="sell">卖出交易</MenubarRadioItem>
                  </MenubarRadioGroup>
                  <MenubarSeparator />
                  <MenubarCheckboxItem
                    checked={settings.showFailed}
                    onCheckedChange={checked => updateSettings({ showFailed: checked })}
                  >
                    显示失败交易
                  </MenubarCheckboxItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        )}
      </div>

      <TabsContent value="0" className="mt-6">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-md border">
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              暂无交易记录
            </div>
          </div>
        ) : useVirtualScrolling ? (
          // 虚拟滚动版本
          <div className="rounded-md border">
            <div className="border-b bg-muted/50">
              <div className="flex items-center px-4 py-3 font-medium text-sm">
                <div className="w-16">#</div>
                <div className="flex-1">交易哈希</div>
                <div className="w-32 flex items-center">
                  时间
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      updateSettings({
                        timeFormat: settings.timeFormat === 'absolute' ? 'relative' : 'absolute',
                      })
                    }
                    className="h-6 w-6 p-0 ml-1"
                  >
                    <Clock className="h-3 w-3" />
                  </Button>
                </div>
                <div className="w-32">源代币</div>
                <div className="w-32">目标代币</div>
                <div className="w-24 text-right">手续费</div>
              </div>
            </div>
            <List
              height={CONTAINER_HEIGHT}
              itemCount={filteredTransactions.length}
              itemSize={ROW_HEIGHT}
              itemData={{ transactions: filteredTransactions, settings }}
            >
              {VirtualTransactionRow}
            </List>
          </div>
        ) : (
          // 常规表格版本
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>交易哈希</TableHead>
                  <TableHead className="flex items-center">
                    时间
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateSettings({
                          timeFormat: settings.timeFormat === 'absolute' ? 'relative' : 'absolute',
                        })
                      }
                      className="h-6 w-6 p-0"
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>源代币</TableHead>
                  <TableHead>目标代币</TableHead>
                  <TableHead className="text-right">手续费</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => (
                  <RegularTransactionRow
                    key={transaction.hash}
                    transaction={transaction}
                    index={index}
                    total={filteredTransactions.length}
                    settings={settings}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="1" className="mt-6">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>代币</TableHead>
                <TableHead className="text-right">流入</TableHead>
                <TableHead className="text-right">流出</TableHead>
                <TableHead className="text-right">净流量</TableHead>
                <TableHead className="text-right">当前价格</TableHead>
                <TableHead className="text-right">盈亏</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    暂无代币记录
                  </TableCell>
                </TableRow>
              ) : (
                tokens.map((token, index) => (
                  <TableRow key={token.address}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatAddress(token.address)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {token.in.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {token.out.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={tokenCalculations.getValueColor(token.in - token.out)}>
                        {(token.in - token.out).toFixed(6)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      ${token.price.toFixed(6)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={tokenCalculations.getValueColor(Number(tokenCalculations.getPnL(token)))}>
                        ${tokenCalculations.getPnL(token)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  )
}