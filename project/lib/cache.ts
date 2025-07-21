interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // 生存时间（毫秒）
  maxSize?: number // 最大缓存条目数
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private accessTimes = new Map<string, number>()
  private maxSize: number
  private defaultTTL: number

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.ttl || 300000 // 5 分钟默认
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
    }

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, entry)
    this.accessTimes.set(key, now)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    
    // 检查是否过期
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    // 更新访问时间
    this.accessTimes.set(key, now)
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): boolean {
    this.accessTimes.delete(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
    }
  }

  // 获取缓存统计信息
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// 全局缓存实例
const globalCache = new MemoryCache({
  ttl: 300000, // 5 分钟
  maxSize: 500,
})

// API 缓存装饰器
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    keyGenerator?: (...args: T) => string
    ttl?: number
    useGlobalCache?: boolean
  } = {}
) {
  const cache = options.useGlobalCache ? globalCache : new MemoryCache({ ttl: options.ttl })
  
  return async (...args: T): Promise<R> => {
    const key = options.keyGenerator 
      ? options.keyGenerator(...args)
      : JSON.stringify(args)
    
    // 尝试从缓存获取
    const cached = cache.get<R>(key)
    if (cached !== null) {
      console.log(`Cache hit for key: ${key}`)
      return cached
    }

    // 缓存未命中，调用原函数
    console.log(`Cache miss for key: ${key}`)
    try {
      const result = await fn(...args)
      cache.set(key, result, options.ttl)
      return result
    } catch (error) {
      console.error(`Error in cached function: ${error}`)
      throw error
    }
  }
}

// 针对区块链 API 的专门缓存
export class BlockchainApiCache {
  private transactionCache = new MemoryCache({ ttl: 600000, maxSize: 100 }) // 10 分钟
  private tokenPriceCache = new MemoryCache({ ttl: 30000, maxSize: 200 }) // 30 秒
  private blockCache = new MemoryCache({ ttl: 300000, maxSize: 50 }) // 5 分钟

  // 缓存交易数据
  cacheTransactions(address: string, transactions: any[]): void {
    this.transactionCache.set(`tx:${address.toLowerCase()}`, transactions)
  }

  getTransactions(address: string): any[] | null {
    return this.transactionCache.get(`tx:${address.toLowerCase()}`)
  }

  // 缓存代币价格
  cacheTokenPrice(symbol: string, address: string, price: number): void {
    this.tokenPriceCache.set(`price:${symbol}:${address.toLowerCase()}`, price)
  }

  getTokenPrice(symbol: string, address: string): number | null {
    return this.tokenPriceCache.get(`price:${symbol}:${address.toLowerCase()}`)
  }

  // 缓存区块数据
  cacheBlock(timestamp: number, blockNumber: number): void {
    this.blockCache.set(`block:${timestamp}`, blockNumber)
  }

  getBlock(timestamp: number): number | null {
    return this.blockCache.get(`block:${timestamp}`)
  }

  // 清理所有缓存
  clearAll(): void {
    this.transactionCache.clear()
    this.tokenPriceCache.clear()
    this.blockCache.clear()
  }

  // 获取缓存统计
  getStats() {
    return {
      transactions: this.transactionCache.getStats(),
      tokenPrices: this.tokenPriceCache.getStats(),
      blocks: this.blockCache.getStats(),
    }
  }
}

// 全局区块链API缓存实例
export const blockchainCache = new BlockchainApiCache()

// 缓存中间件用于 API 路由
export function withApiCache(
  handler: (request: Request, context?: any) => Promise<Response>,
  options: {
    ttl?: number
    keyGenerator?: (request: Request) => string
    shouldCache?: (request: Request, response: Response) => boolean
  } = {}
) {
  const cache = new MemoryCache({ ttl: options.ttl || 300000 })

  return async (request: Request, context?: any): Promise<Response> => {
    const key = options.keyGenerator 
      ? options.keyGenerator(request)
      : `${request.method}:${request.url}`

    // GET 请求才缓存
    if (request.method === 'GET') {
      const cached = cache.get<{
        status: number
        headers: Record<string, string>
        body: string
      }>(key)

      if (cached) {
        console.log(`API cache hit: ${key}`)
        return new Response(cached.body, {
          status: cached.status,
          headers: cached.headers,
        })
      }
    }

    // 调用原处理器
    const response = await handler(request, context)
    
    // 缓存成功的 GET 请求响应
    if (request.method === 'GET' && response.ok) {
      const shouldCache = options.shouldCache 
        ? options.shouldCache(request, response)
        : true

      if (shouldCache) {
        const body = await response.text()
        const headers: Record<string, string> = {}
        
        response.headers.forEach((value, key) => {
          headers[key] = value
        })

        cache.set(key, {
          status: response.status,
          headers,
          body,
        })

        console.log(`API response cached: ${key}`)
        
        // 返回新的响应对象，因为原来的已经被读取
        return new Response(body, {
          status: response.status,
          headers: response.headers,
        })
      }
    }

    return response
  }
}

// React Query 缓存配置
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 300000, // 5 分钟
      cacheTime: 900000, // 15 分钟
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount: number, error: any) => {
        // API 速率限制错误不重试
        if (error?.response?.status === 429) {
          return false
        }
        // 其他错误最多重试 2 次
        return failureCount < 2
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
}

// 缓存键生成器
export const cacheKeys = {
  transactions: (address: string) => `transactions:${address.toLowerCase()}`,
  tokens: (address: string) => `tokens:${address.toLowerCase()}`,
  blockByTimestamp: (timestamp: number) => `block:${timestamp}`,
  tokenPrice: (symbol: string, address: string) => `price:${symbol}:${address.toLowerCase()}`,
  alphaTokens: () => 'alpha-tokens',
  spotTokens: () => 'spot-tokens',
}

// 智能缓存：根据数据类型使用不同的缓存策略
export class SmartCache {
  private static instance: SmartCache
  private fastCache = new MemoryCache({ ttl: 30000, maxSize: 200 }) // 快速变化数据
  private slowCache = new MemoryCache({ ttl: 600000, maxSize: 500 }) // 慢速变化数据
  private staticCache = new MemoryCache({ ttl: 3600000, maxSize: 100 }) // 静态数据

  static getInstance(): SmartCache {
    if (!SmartCache.instance) {
      SmartCache.instance = new SmartCache()
    }
    return SmartCache.instance
  }

  // 根据数据类型选择合适的缓存
  private getCache(type: 'fast' | 'slow' | 'static') {
    switch (type) {
      case 'fast': return this.fastCache
      case 'slow': return this.slowCache
      case 'static': return this.staticCache
      default: return this.slowCache
    }
  }

  set<T>(key: string, data: T, type: 'fast' | 'slow' | 'static' = 'slow'): void {
    this.getCache(type).set(key, data)
  }

  get<T>(key: string, type: 'fast' | 'slow' | 'static' = 'slow'): T | null {
    return this.getCache(type).get(key)
  }

  // 价格数据使用快速缓存
  cachePrice(key: string, price: number): void {
    this.set(key, price, 'fast')
  }

  getPrice(key: string): number | null {
    return this.get(key, 'fast')
  }

  // 交易数据使用慢速缓存
  cacheTransactionData<T>(key: string, data: T): void {
    this.set(key, data, 'slow')
  }

  getTransactionData<T>(key: string): T | null {
    return this.get(key, 'slow')
  }

  // 配置数据使用静态缓存
  cacheConfig<T>(key: string, data: T): void {
    this.set(key, data, 'static')
  }

  getConfig<T>(key: string): T | null {
    return this.get(key, 'static')
  }
}

export const smartCache = SmartCache.getInstance()

export { globalCache, MemoryCache }