// DeFi 协议监控服务
import type { Hex } from 'viem'
import { parseAbiItem } from 'viem'
import type { TransactionAlertInfo } from '../types'

// 常见 DeFi 协议事件
const DEFI_EVENTS = {
  // Uniswap V2/V3
  SWAP: parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)'),
  MINT: parseAbiItem('event Mint(address indexed sender, uint256 amount0, uint256 amount1)'),
  BURN: parseAbiItem('event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)'),
  
  // PancakeSwap
  PANCAKE_SWAP: parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)'),
  
  // Lending 协议 (Compound, Aave)
  SUPPLY: parseAbiItem('event Supply(address indexed user, address indexed reserve, uint256 amount, address indexed onBehalfOf, uint16 referralCode)'),
  WITHDRAW: parseAbiItem('event Withdraw(address indexed user, address indexed reserve, uint256 amount, address indexed to)'),
  BORROW: parseAbiItem('event Borrow(address indexed user, address indexed reserve, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, address indexed onBehalfOf, uint16 referralCode)'),
  REPAY: parseAbiItem('event Repay(address indexed user, address indexed reserve, uint256 amount, address indexed onBehalfOf)'),
  
  // Staking
  STAKE: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
  UNSTAKE: parseAbiItem('event Unstaked(address indexed user, uint256 amount)'),
  
  // Yield Farming
  DEPOSIT: parseAbiItem('event Deposit(address indexed user, uint256 indexed pid, uint256 amount)'),
  WITHDRAW_FARM: parseAbiItem('event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)'),
  HARVEST: parseAbiItem('event Harvest(address indexed user, uint256 indexed pid, uint256 amount)'),
}

// 知名 DeFi 协议合约地址 (BSC)
const DEFI_CONTRACTS = {
  // PancakeSwap
  PANCAKE_ROUTER: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  PANCAKE_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  
  // Venus Protocol
  VENUS_COMPTROLLER: '0xfD36E2c2a6789Db23113685031d7F16329158384',
  
  // Alpaca Finance
  ALPACA_FAIR_LAUNCH: '0xA625AB01B08ce023B2a342Dbb12a16f2C8489A8F',
  
  // Biswap
  BISWAP_ROUTER: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
  
  // ApeSwap
  APESWAP_ROUTER: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
}

interface DeFiMonitorConfig {
  address: Hex
  protocols: string[]
  minAmount?: number
}

export class DeFiMonitor {
  private monitoredProtocols: Set<string> = new Set()

  constructor() {
    this.initializeProtocolList()
  }

  private initializeProtocolList() {
    // 初始化支持的协议列表
    this.monitoredProtocols.add('pancakeswap')
    this.monitoredProtocols.add('venus')
    this.monitoredProtocols.add('alpaca')
    this.monitoredProtocols.add('biswap')
    this.monitoredProtocols.add('apeswap')
  }

  // 检测 DeFi 交互
  async detectDeFiInteraction(
    transaction: any,
    logs: any[]
  ): Promise<TransactionAlertInfo | null> {
    try {
      // 检查交易目标地址是否为 DeFi 协议
      const protocol = this.identifyProtocol(transaction.to)
      if (!protocol) return null

      // 解析交易日志
      const interaction = await this.parseInteractionType(logs, protocol)
      if (!interaction) return null

      return {
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        value: interaction.amount || '0',
        token: interaction.token || 'Unknown',
        timestamp: new Date().toISOString(),
        type: 'defi',
        protocol,
        action: interaction.action,
      }
    } catch (error) {
      console.error('DeFi 交互检测失败:', error)
      return null
    }
  }

  private identifyProtocol(contractAddress: Hex): string | null {
    const address = contractAddress.toLowerCase()
    
    if (address === DEFI_CONTRACTS.PANCAKE_ROUTER.toLowerCase() ||
        address === DEFI_CONTRACTS.PANCAKE_FACTORY.toLowerCase()) {
      return 'PancakeSwap'
    }
    
    if (address === DEFI_CONTRACTS.VENUS_COMPTROLLER.toLowerCase()) {
      return 'Venus Protocol'
    }
    
    if (address === DEFI_CONTRACTS.ALPACA_FAIR_LAUNCH.toLowerCase()) {
      return 'Alpaca Finance'
    }
    
    if (address === DEFI_CONTRACTS.BISWAP_ROUTER.toLowerCase()) {
      return 'Biswap'
    }
    
    if (address === DEFI_CONTRACTS.APESWAP_ROUTER.toLowerCase()) {
      return 'ApeSwap'
    }
    
    return null
  }

  private async parseInteractionType(logs: any[], protocol: string) {
    for (const log of logs) {
      try {
        // 根据协议类型解析不同的事件
        if (protocol.includes('Swap')) {
          return this.parseSwapEvents(log)
        } else if (protocol.includes('Venus')) {
          return this.parseLendingEvents(log)
        } else if (protocol.includes('Alpaca')) {
          return this.parseYieldFarmingEvents(log)
        }
      } catch (error) {
        // 继续尝试其他日志
        continue
      }
    }
    
    return null
  }

  private parseSwapEvents(log: any) {
    // 尝试解析 Swap 事件
    try {
      // 这里需要根据实际的 ABI 解析
      return {
        action: 'swap',
        amount: log.data ? this.parseAmount(log.data) : '0',
        token: 'Token',
      }
    } catch {
      return null
    }
  }

  private parseLendingEvents(log: any) {
    // 解析借贷事件
    try {
      return {
        action: 'lending',
        amount: log.data ? this.parseAmount(log.data) : '0',
        token: 'Token',
      }
    } catch {
      return null
    }
  }

  private parseYieldFarmingEvents(log: any) {
    // 解析收益农场事件
    try {
      return {
        action: 'farming',
        amount: log.data ? this.parseAmount(log.data) : '0',
        token: 'Token',
      }
    } catch {
      return null
    }
  }

  private parseAmount(data: string): string {
    // 简单的金额解析，实际应该根据具体事件结构
    try {
      const amount = BigInt(data)
      return (amount / 10n**18n).toString()
    } catch {
      return '0'
    }
  }

  // 获取支持的协议列表
  getSupportedProtocols(): string[] {
    return Array.from(this.monitoredProtocols)
  }

  // 添加自定义协议监控
  addCustomProtocol(name: string, contractAddress: Hex) {
    this.monitoredProtocols.add(name)
    // 这里可以添加到动态合约地址映射
  }
}

export const defiMonitor = new DeFiMonitor()