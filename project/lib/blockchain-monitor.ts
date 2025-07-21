// 区块链监控服务
import type { Hex } from 'viem'
import type { TransactionAlertInfo } from '../types'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { bsc } from 'viem/chains'
import { emailService } from './email'

interface MonitorConfig {
  id: string
  address: Hex
  email: string
  label: string
  isActive: boolean
}

export class BlockchainMonitor {
  private client
  private activeMonitors = new Map<string, any>()

  constructor() {
    this.client = createPublicClient({
      chain: bsc,
      transport: http('https://bsc.blockrazor.xyz'),
    })
  }

  async startMonitoring(config: MonitorConfig) {
    if (this.activeMonitors.has(config.id)) {
      console.log(`监控 ${config.id} 已存在`)
      return
    }

    console.log(`开始监控地址: ${config.address}`)

    // 监听 ERC-20 Transfer 事件
    const unsubscribeTransfer = this.client.watchEvent({
      address: undefined, // 监听所有合约
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        from: config.address, // 监听从该地址发出的转账
      },
      onLogs: (logs) => this.handleTransferLogs(config, logs, 'outgoing'),
    })

    const unsubscribeReceive = this.client.watchEvent({
      address: undefined,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        to: config.address, // 监听转入该地址的转账
      },
      onLogs: (logs) => this.handleTransferLogs(config, logs, 'incoming'),
    })

    // 监听原生代币转账（通过区块监听）
    const unsubscribeBlocks = this.client.watchBlocks({
      onBlock: (block) => this.handleNewBlock(config, block),
    })

    this.activeMonitors.set(config.id, {
      unsubscribeTransfer,
      unsubscribeReceive,
      unsubscribeBlocks,
      config,
    })
  }

  async stopMonitoring(configId: string) {
    const monitor = this.activeMonitors.get(configId)
    if (!monitor) return

    console.log(`停止监控: ${configId}`)

    // 取消所有订阅
    monitor.unsubscribeTransfer?.()
    monitor.unsubscribeReceive?.()
    monitor.unsubscribeBlocks?.()

    this.activeMonitors.delete(configId)
  }

  private async handleTransferLogs(
    config: MonitorConfig,
    logs: any[],
    type: 'incoming' | 'outgoing'
  ) {
    for (const log of logs) {
      try {
        // 获取代币信息
        const tokenInfo = await this.getTokenInfo(log.address)
        
        // 格式化转账金额
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

        // 发送邮件通知
        await emailService.sendTransactionAlert(
          config.email,
          config.label,
          transaction
        )

        console.log(`发送${type}通知:`, transaction)
      } catch (error) {
        console.error('处理转账日志失败:', error)
      }
    }
  }

  private async handleNewBlock(config: MonitorConfig, block: any) {
    try {
      // 获取区块中的所有交易
      const blockWithTxs = await this.client.getBlock({
        blockHash: block.hash,
        includeTransactions: true,
      })

      // 检查是否有涉及监控地址的原生代币转账
      for (const tx of blockWithTxs.transactions) {
        if (
          tx.to?.toLowerCase() === config.address.toLowerCase() ||
          tx.from?.toLowerCase() === config.address.toLowerCase()
        ) {
          const type: 'incoming' | 'outgoing' = tx.to?.toLowerCase() === config.address.toLowerCase() ? 'incoming' : 'outgoing'
          
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

            await emailService.sendTransactionAlert(
              config.email,
              config.label,
              transaction
            )

            console.log(`发送BNB${type}通知:`, transaction)
          }
        }
      }
    } catch (error) {
      console.error('处理新区块失败:', error)
    }
  }

  private async getTokenInfo(address: Hex) {
    try {
      // 这里应该缓存代币信息以提高性能
      const [symbol, decimals] = await Promise.all([
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
      ])

      return { symbol: symbol as string, decimals: decimals as number }
    } catch (error) {
      console.error('获取代币信息失败:', error)
      return { symbol: 'UNKNOWN', decimals: 18 }
    }
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