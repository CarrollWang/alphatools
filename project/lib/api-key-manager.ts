// API 密钥管理和轮换服务
interface APIKeyConfig {
  key: string
  usage: number
  lastUsed: number
  dailyLimit: number
  isActive: boolean
  provider: string
}

interface APIKeyStats {
  totalKeys: number
  activeKeys: number
  totalUsage: number
  averageUsage: number
}

export class APIKeyManager {
  private keyConfigs = new Map<string, APIKeyConfig>()
  private keyRotationInterval: number = 24 * 60 * 60 * 1000 // 24小时
  private usageResetInterval: number = 24 * 60 * 60 * 1000 // 24小时
  private lastUsageReset: number = Date.now()

  constructor() {
    this.initializeKeys()
    this.startKeyRotation()
  }

  private initializeKeys() {
    // 初始化现有的 API 密钥
    const apiKeys = {
      default: ['K4SDMH5SKWHRNK6G3PIXH1UTCWS1RND9DN'],
      txlist: [
        '1BD7WRF9C2TPVB38TCVY9U1R6F2BVFRM8D',
        '6NTVDK2AAP433UNVGAGD3X4YR25GRXW1I4',
        'M2193Y7ZXYRSJYGZEDC8N2MA54JJUB87ZA',
        'DHIIQTBNFU7JTDZNFHSJJKRIHI87Y41ZNG',
        'PAM5T2NCRJESWY9TV96AUF29YBPNE895IE',
        'AYB7PI37YKAKU84C9B4AIKY2PWRVUNSZG3',
        'QQ4TC8B3Z3F91MJWR95N1YTPZVJMZWQQ3C',
        '6B7PWZP4Z4SDN61B58VW1GHBVATHRFPH4H',
        'U1UMTGEDSQSHCH1M2JYPCVWKT1VT5XA7TK',
        '3ZCQ31SJJIJHTWM98QZW5KK18KKC4E7UZM',
        '82YCUG2S2J1FCM1QERU8PIEKA9CGCH9VBE',
        'X3YGWTZ6IUVUTDEZ13IDZBK98G7DDIV76H',
      ],
      txlistinternal: [
        'WU6BJG8GEZFRQXHHS4NWAGUXFQ1NV5VQKY',
        '1S74F22M1R4VZNYAJM6FAE46UDVFTCQIUB',
        'PURC6YBDH9R845NP3YCHUT4CIT1E8NB3XF',
        'TZCZNHGWBHEZ13XYC5JNCT639UBH7PDRKG',
        'VJ96HWYYURF6VYHX1EI53U6PNZQNTHRISJ',
        '4DGG9Z1C1J2EGRQCSDUCENM7SKDUGDAF6N',
        'TNVGQD5H1B46VKGYVXU7823P3V3GNA2N37',
        'FQIUSS616PPA3BXIGV5VM3YYKCKSRYXVRS',
        '3I4NKA8YTPQCDV2NU9D76EMUU67CNNVQE7',
        'FS2251G4TVG54DGF5HZ4A4X33E9IITAW9V',
        '6AUFM7CJIS1RPCRWVUIRP59XGJJHPTUXMV',
        'KATCVPX9JZJ6A9RSV7D5SHC5AZEYC4ZH3R',
      ],
      tokentx: [
        'Y5X8M19FJT8F1Q74A64C11WHGHCFXBY827',
        'PQ7WTNE1G94KAQHPG7TBNUQFQCK451IGCV',
        'Z175JK283IND6VV785RSF33HEES6E9PG3Y',
        'AUD8N76NDUMH4GG2J46CB8RVU9FZ8465E6',
        'UZ2BWTSK9D385PYINEN36D77WV96DX9639',
        'H859Z4W5FFG8MQRE6MHV6QRYCPIUUQ61GP',
        'C99ISPCTBGY4VKAJQ5ZHAQ8IPFWBYVHRIG',
        'A94RSZYSCW9QCS79BNZH1S8DA9KM2ENAEJ',
        'TREFDHHPJY7UFPSTZXSI5PX9TE3VB5S1X7',
        'T4S323ETPFFTT4WGKM3NNV4Z7P72I1YX1H',
        'RW3T58UUIIE3TE66ZRXH4EATKN2GFZN7VB',
        '7TN7C9WME1783WZZYAJSJFRHCR9ZBVUD45',
      ],
    }

    // 初始化密钥配置
    Object.entries(apiKeys).forEach(([category, keys]) => {
      keys.forEach(key => {
        this.keyConfigs.set(key, {
          key,
          usage: 0,
          lastUsed: 0,
          dailyLimit: this.getDailyLimit(category),
          isActive: true,
          provider: category,
        })
      })
    })
  }

  private getDailyLimit(category: string): number {
    // 根据 API 类型设置不同的日限额
    switch (category) {
      case 'txlist':
        return 8000
      case 'txlistinternal':
        return 8000
      case 'tokentx':
        return 8000
      case 'default':
        return 5000
      default:
        return 5000
    }
  }

  // 获取可用的 API 密钥
  getAvailableKey(category: string): string | null {
    const categoryKeys = Array.from(this.keyConfigs.values())
      .filter(config => 
        config.provider === category && 
        config.isActive && 
        config.usage < config.dailyLimit
      )
      .sort((a, b) => a.usage - b.usage) // 优先使用使用量少的

    if (categoryKeys.length === 0) {
      console.warn(`No available API keys for category: ${category}`)
      return null
    }

    const selectedKey = categoryKeys[0]
    this.recordUsage(selectedKey.key)
    return selectedKey.key
  }

  // 记录 API 密钥使用
  private recordUsage(key: string) {
    const config = this.keyConfigs.get(key)
    if (config) {
      config.usage++
      config.lastUsed = Date.now()
    }
  }

  // 标记密钥为不可用（达到限额或出错）
  markKeyAsUnavailable(key: string, reason: string = 'rate_limit') {
    const config = this.keyConfigs.get(key)
    if (config) {
      config.isActive = false
      console.warn(`API key marked as unavailable: ${key}, reason: ${reason}`)
    }
  }

  // 重置密钥使用统计
  private resetUsageStats() {
    const now = Date.now()
    if (now - this.lastUsageReset >= this.usageResetInterval) {
      this.keyConfigs.forEach(config => {
        config.usage = 0
        config.isActive = true
      })
      this.lastUsageReset = now
      console.log('API key usage stats reset')
    }
  }

  // 启动密钥轮换定时器
  private startKeyRotation() {
    setInterval(() => {
      this.resetUsageStats()
      this.performHealthCheck()
    }, this.keyRotationInterval)
  }

  // 健康检查
  private async performHealthCheck() {
    console.log('Performing API key health check...')
    
    // 检查每个密钥的状态
    for (const [key, config] of this.keyConfigs.entries()) {
      if (config.usage >= config.dailyLimit * 0.9) {
        console.warn(`API key ${key} is approaching daily limit: ${config.usage}/${config.dailyLimit}`)
      }
    }

    // 如果可用密钥过少，发出警告
    const activeKeys = Array.from(this.keyConfigs.values()).filter(c => c.isActive)
    if (activeKeys.length < 3) {
      console.error('Warning: Low number of active API keys!')
    }
  }

  // 获取密钥使用统计
  getUsageStats(): APIKeyStats {
    const configs = Array.from(this.keyConfigs.values())
    const activeKeys = configs.filter(c => c.isActive)
    const totalUsage = configs.reduce((sum, c) => sum + c.usage, 0)

    return {
      totalKeys: configs.length,
      activeKeys: activeKeys.length,
      totalUsage,
      averageUsage: totalUsage / configs.length,
    }
  }

  // 添加新的 API 密钥
  addAPIKey(key: string, category: string, dailyLimit?: number) {
    if (this.keyConfigs.has(key)) {
      console.warn(`API key already exists: ${key}`)
      return false
    }

    this.keyConfigs.set(key, {
      key,
      usage: 0,
      lastUsed: 0,
      dailyLimit: dailyLimit || this.getDailyLimit(category),
      isActive: true,
      provider: category,
    })

    console.log(`New API key added: ${key} for category: ${category}`)
    return true
  }

  // 移除 API 密钥
  removeAPIKey(key: string) {
    const deleted = this.keyConfigs.delete(key)
    if (deleted) {
      console.log(`API key removed: ${key}`)
    }
    return deleted
  }

  // 获取指定类别的随机密钥（兼容现有代码）
  getRandomKey(category: string): string {
    const availableKey = this.getAvailableKey(category)
    if (!availableKey) {
      // 如果没有可用密钥，返回该类别的第一个密钥作为后备
      const fallbackKey = Array.from(this.keyConfigs.values())
        .find(config => config.provider === category)?.key
      
      if (fallbackKey) {
        console.warn(`Using fallback API key for category: ${category}`)
        return fallbackKey
      }
      
      throw new Error(`No API keys available for category: ${category}`)
    }
    return availableKey
  }
}

export const apiKeyManager = new APIKeyManager()