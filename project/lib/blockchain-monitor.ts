// 区块链监控服务
import type { Hex, PublicClient } from 'viem'
import type { TransactionAlertInfo } from '../types'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { bsc } from 'viem/chains'
import { emailService } from './email'
import { defiMonitor } from './defi-monitor'

interface MonitorConfig {
  id: string
  address: Hex
  email: string
  label: string
  isActive: boolean
}

interface TokenInfo {
  symbol: string
  decimals: number
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

export class BlockchainMonitor {
  private client!: PublicClient
  private activeMonitors = new Map<string, any>()
  private tokenCache = new Map<string, TokenInfo>()
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    this.client = createPublicClient({
      chain: bsc,
      transport: http('https://bsc.blockrazor.xyz', {
        retryCount: this.retryConfig.maxRetries,
        retryDelay: this.retryConfig.baseDelay,
      }),
    })
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string = ''
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        console.warn(`操作失败 (尝试 ${attempt}/${this.retryConfig.maxRetries}) ${context}:`, error)
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
            this.retryConfig.maxDelay
          )
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw new Error(`操作失败，已重试 ${this.retryConfig.maxRetries} 次: ${lastError?.message}`)
  }

  private async handleConnectionError(error: Error, configId: string) {
    console.error(`连接错误 (${configId}):`, error)
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.retryConfig.baseDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`${delay}ms 后尝试重新连接 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(async () => {
        try {
          this.initializeClient()
          const monitor = this.activeMonitors.get(configId)
          if (monitor) {
            await this.restartMonitoring(monitor.config)
          }
          this.reconnectAttempts = 0
        } catch (error) {
          console.error('重新连接失败:', error)
        }
      }, delay)
    } else {
      console.error('已达到最大重连次数，停止重连')
    }
  }

  private async restartMonitoring(config: MonitorConfig) {
    await this.stopMonitoring(config.id)
    await this.startMonitoring(config)
  }

  async startMonitoring(config: MonitorConfig) {
    if (this.activeMonitors.has(config.id)) {
      console.log(`监控 ${config.id} 已存在`)
      return
    }

    console.log(`开始监控地址: ${config.address}`)

    try {
      // 监听 ERC-20 Transfer 事件 - 发出
      const unsubscribeTransfer = this.client.watchEvent({
        address: undefined,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        args: {
          from: config.address,
        },
        onLogs: (logs) => this.handleTransferLogs(config, logs, 'outgoing'),
        onError: (error) => this.handleConnectionError(error, config.id),
      })

      // 监听 ERC-20 Transfer 事件 - 接收
      const unsubscribeReceive = this.client.watchEvent({
        address: undefined,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
        args: {
          to: config.address,
        },
        onLogs: (logs) => this.handleTransferLogs(config, logs, 'incoming'),
        onError: (error) => this.handleConnectionError(error, config.id),
      })

      // 监听原生代币转账
      const unsubscribeBlocks = this.client.watchBlocks({
        onBlock: (block) => this.handleNewBlock(config, block),
        onError: (error) => this.handleConnectionError(error, config.id),
      })

      // 监听 NFT Transfer 事件
      const unsubscribeNFT = this.client.watchEvent({
        address: undefined,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
        args: {
          from: config.address,
        },
        onLogs: (logs) => this.handleNFTLogs(config, logs, 'outgoing'),
        onError: (error) => this.handleConnectionError(error, config.id),
      })

      const unsubscribeNFTReceive = this.client.watchEvent({
        address: undefined,
        event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
        args: {
          to: config.address,
        },
        onLogs: (logs) => this.handleNFTLogs(config, logs, 'incoming'),
        onError: (error) => this.handleConnectionError(error, config.id),
      })

      this.activeMonitors.set(config.id, {
        unsubscribeTransfer,
        unsubscribeReceive,
        unsubscribeBlocks,
        unsubscribeNFT,
        unsubscribeNFTReceive,
        config,
      })
    } catch (error) {
      console.error(`启动监控失败 (${config.id}):`, error)
      await this.handleConnectionError(error as Error, config.id)
    }
  }

  async stopMonitoring(configId: string) {
    const monitor = this.activeMonitors.get(configId)
    if (!monitor) return

    console.log(`停止监控: ${configId}`)

    try {
      // 取消所有订阅
      monitor.unsubscribeTransfer?.()
      monitor.unsubscribeReceive?.()
      monitor.unsubscribeBlocks?.()
      monitor.unsubscribeNFT?.()
      monitor.unsubscribeNFTReceive?.()
    } catch (error) {
      console.error(`停止监控时出错 (${configId}):`, error)
    }

    this.activeMonitors.delete(configId)
  }

  private async handleTransferLogs(
    config: MonitorConfig,
    logs: any[],
    type: 'incoming' | 'outgoing'
  ) {
    const batchSize = 10
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(log => this.processTransferLog(config, log, type))
      )
    }
  }

  private async processTransferLog(
    config: MonitorConfig,
    log: any,
    type: 'incoming' | 'outgoing'
  ) {
    try {
      const tokenInfo = await this.getTokenInfo(log.address)
      const value = this.formatTokenAmount(log.args.value, tokenInfo.decimals)

      const transaction: TransactionAlertInfo = {
        hash: log.transactionHash,
        from: log.args.from,
        to: log.args.to,
        value,
        token: tokenInfo.symbol,
        timestamp: new Date().toISOString(),
        type,
      }

      await this.withRetry(
        () => emailService.sendTransactionAlert(config.email, config.label, transaction),
        `发送${type}邮件通知`
      )

      console.log(`发送${type}通知:`, transaction)
    } catch (error) {
      console.error(`处理转账日志失败 (${log.transactionHash}):`, error)
    }
  }

  private async handleNFTLogs(
    config: MonitorConfig,
    logs: any[],
    type: 'incoming' | 'outgoing'
  ) {
    for (const log of logs) {
      try {
        const tokenInfo = await this.getNFTInfo(log.address)
        
        const transaction: TransactionAlertInfo = {
          hash: log.transactionHash,
          from: log.args.from,
          to: log.args.to,
          value: `#${log.args.tokenId}`,
          token: tokenInfo.symbol,
          timestamp: new Date().toISOString(),
          type,
        }

        await this.withRetry(
          () => emailService.sendTransactionAlert(config.email, config.label, transaction),
          `发送NFT${type}邮件通知`
        )

        console.log(`发送NFT${type}通知:`, transaction)
      } catch (error) {
        console.error(`处理NFT日志失败 (${log.transactionHash}):`, error)
      }
    }
  }

  private async handleNewBlock(config: MonitorConfig, block: any) {
    try {
      const blockWithTxs = await this.withRetry(
        () => this.client.getBlock({
          blockHash: block.hash,
          includeTransactions: true,
        }),
        '获取区块交易'
      )

      const relevantTxs = blockWithTxs.transactions.filter(tx => 
        tx.to?.toLowerCase() === config.address.toLowerCase() ||
        tx.from?.toLowerCase() === config.address.toLowerCase()
      )

      await Promise.allSettled(
        relevantTxs.map(tx => this.processNativeTransaction(config, tx))
      )
    } catch (error) {
      console.error(`处理新区块失败 (${block.hash}):`, error)
    }
  }

  private async processNativeTransaction(config: MonitorConfig, tx: any) {
    try {
      const type: 'incoming' | 'outgoing' = 
        tx.to?.toLowerCase() === config.address.toLowerCase() ? 'incoming' : 'outgoing'

      // 检查是否为 DeFi 交互
      if (tx.to && type === 'outgoing') {
        const defiInteraction = await defiMonitor.detectDeFiInteraction(tx, [])
        if (defiInteraction) {
          await this.withRetry(
            () => emailService.sendTransactionAlert(config.email, config.label, defiInteraction),
            `发送DeFi交互邮件通知`
          )
          console.log(`发送DeFi交互通知:`, defiInteraction)
        }
      }

      // 如果金额大于 0，发送常规转账通知
      if (tx.value > 0n) {
        const transaction: TransactionAlertInfo = {
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '0x',
          value: this.formatTokenAmount(tx.value, 18),
          token: 'BNB',
          timestamp: new Date().toISOString(),
          type,
        }

        await this.withRetry(
          () => emailService.sendTransactionAlert(config.email, config.label, transaction),
          `发送BNB${type}邮件通知`
        )

        console.log(`发送BNB${type}通知:`, transaction)
      }
    } catch (error) {
      console.error(`处理原生代币交易失败 (${tx.hash}):`, error)
    }
  }

  private async getTokenInfo(address: Hex): Promise<TokenInfo> {
    const cacheKey = address.toLowerCase()
    
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!
    }

    try {
      const [symbol, decimals] = await this.withRetry(
        () => Promise.all([
          this.client.readContract({
            address,
            abi: [parseAbiItem('function symbol() view returns (string)')],
            functionName: 'symbol',
          }),
          this.client.readContract({
            address,
            abi: [parseAbiItem('function decimals() view returns (uint8)')],
            functionName: 'decimals',
          }),
        ]),
        `获取代币信息 ${address}`
      )

      const tokenInfo = { symbol: symbol as string, decimals: decimals as number }
      this.tokenCache.set(cacheKey, tokenInfo)
      return tokenInfo
    } catch (error) {
      console.error(`获取代币信息失败 (${address}):`, error)
      const fallbackInfo = { symbol: 'UNKNOWN', decimals: 18 }
      this.tokenCache.set(cacheKey, fallbackInfo)
      return fallbackInfo
    }
  }

  private async getNFTInfo(address: Hex): Promise<TokenInfo> {
    const cacheKey = `nft_${address.toLowerCase()}`
    
    if (this.tokenCache.has(cacheKey)) {
      return this.tokenCache.get(cacheKey)!
    }

    try {
      const [name, symbol] = await this.withRetry(
        () => Promise.all([
          this.client.readContract({
            address,
            abi: [parseAbiItem('function name() view returns (string)')],
            functionName: 'name',
          }).catch(() => 'Unknown NFT'),
          this.client.readContract({
            address,
            abi: [parseAbiItem('function symbol() view returns (string)')],
            functionName: 'symbol',
          }).catch(() => 'NFT'),
        ]),
        `获取NFT信息 ${address}`
      )

      const nftInfo = { symbol: `${name} (${symbol})`, decimals: 0 }
      this.tokenCache.set(cacheKey, nftInfo)
      return nftInfo
    } catch (error) {
      console.error(`获取NFT信息失败 (${address}):`, error)
      const fallbackInfo = { symbol: 'Unknown NFT', decimals: 0 }
      this.tokenCache.set(cacheKey, fallbackInfo)
      return fallbackInfo
    }
  }

  clearCache() {
    this.tokenCache.clear()
    console.log('代币缓存已清空')
  }

  private formatTokenAmount(value: bigint, decimals: number): string {
    const divisor = 10n ** BigInt(decimals)
    const quotient = value / divisor
    const remainder = value % divisor
    
    if (remainder === 0n) {
      return quotient.toString()
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0')
    const trimmedRemainder = remainderStr.replace(/0+$/, '')
    
    return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString()
  }
}

// 全局监控实例
export const blockchainMonitor = new BlockchainMonitor()