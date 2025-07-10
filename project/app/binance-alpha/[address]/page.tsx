'use client'

import type { Hex } from 'viem'
import { AlertCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { use } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import TransactionSearch from '@/components/transaction-search'
import TransactionTable from '@/components/transaction-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import WalletOverview from '@/components/wallet-overview'
import WalletSelector from '@/components/wallet-selector'
import { useBlockNumber } from '@/hooks/use-block'
import { useTransaction } from '@/hooks/use-transaction'
import dayjs from '@/lib/dayjs'
import { getDynamicTimeRange, isAddressEqual } from '@/lib/utils'

export default function BinanceAlphaAddressPage({ params }: { params: Promise<{ address: Hex }> }) {
  const { address } = use(params)
  const today = dayjs(getDynamicTimeRange()[0]).unix()
  const { data: blockNumber } = useBlockNumber(today)
  const {
    data: { transactions = [], tokens = [] } = {},
    isFetching,
    error,
    isError,
    refetch,
  } = useTransaction(address, blockNumber)

  const handleSearch = (searchAddress: Hex) => {
    if (isAddressEqual(searchAddress, address)) {
      refetch()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">币安 Alpha 交易统计</h1>
            <p className="text-muted-foreground text-sm">
              {getDynamicTimeRange()[0].format('YYYY-MM-DD HH:mm:ss')}
              {' ~ '}
              {getDynamicTimeRange()[1].format('YYYY-MM-DD HH:mm:ss')}
            </p>
          </div>
          
          {/* 搜索工具栏 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-muted/30 p-4 rounded-lg">
            <WalletSelector />
            <TransactionSearch isLoading={isFetching} defaultAddress={address} onSearch={handleSearch} />
          </div>
          
          {/* 错误提示 */}
          {isError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>
                  {error instanceof Error ? error.message : '获取交易数据时发生错误，请稍后再试。'}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
          
          {/* 钱包概览 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WalletOverview data={{ address, transactions, tokens }} isLoading={isFetching} />
          </motion.div>
          
          {/* 交易表格 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <TransactionTable data={{ transactions, tokens }} isLoading={isFetching} />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}