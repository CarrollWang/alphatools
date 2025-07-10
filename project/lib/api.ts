import type { Hex } from 'viem'
import type { AlphaTokenInfo, TransactionActionMap } from '@/types'
import axios from 'axios'
import { zeroAddress } from 'viem'
import { apiKeys } from '@/configs'
import { WBNB_ADDRESS } from '@/constants'
import { getRandomElementFromArray } from '@/lib/utils'
import { apiKeyManager } from './api-key-manager'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  
  set<T>(key: string, data: T, ttl: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  clear() {
    this.cache.clear()
  }
}

const apiCache = new APICache()

const client = axios.create({
  baseURL: 'https://api.bscscan.com',
  params: {
    chainId: 56,
  },
  timeout: 30000, // 增加到30秒
})

let requestCount = 0
const REQUEST_INTERVAL = 200

client.interceptors.request.use(
  async (config) => {
    if (config.params) {
      try {
        if (config.params.action === 'txlist') {
          config.params.apikey = apiKeyManager.getRandomKey('txlist')
        }
        else if (config.params.action === 'txlistinternal') {
          config.params.apikey = apiKeyManager.getRandomKey('txlistinternal')
        }
        else if (config.params.action === 'tokentx') {
          config.params.apikey = apiKeyManager.getRandomKey('tokentx')
        }
        else {
          config.params.apikey = apiKeyManager.getRandomKey('default')
        }
      } catch (error) {
        console.error('Failed to get API key:', error)
        // 回退到原有逻辑
        if (config.params.action === 'txlist') {
          config.params.apikey = getRandomElementFromArray(apiKeys.txlist)
        }
        else if (config.params.action === 'txlistinternal') {
          config.params.apikey = getRandomElementFromArray(apiKeys.txlistinternal)
        }
        else if (config.params.action === 'tokentx') {
          config.params.apikey = getRandomElementFromArray(apiKeys.tokentx)
        }
        else {
          config.params.apikey = getRandomElementFromArray(apiKeys.default)
        }
      }
    }
    
    // 简单的限流控制
    if (requestCount > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL))
    }
    requestCount++
    
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

client.interceptors.response.use(
  (response) => {
    requestCount = Math.max(0, requestCount - 1)
    return response
  },
  (error) => {
    requestCount = Math.max(0, requestCount - 1)
    
    // 处理 API 限额错误
    if (error.response?.data?.result?.includes('rate limit reached')) {
      const apikey = error.config?.params?.apikey
      if (apikey) {
        apiKeyManager.markKeyAsUnavailable(apikey, 'rate_limit')
        console.warn(`API key marked as rate limited: ${apikey}`)
      }
    }
    
    return Promise.reject(error)
  }
)

async function fetchTokenPriceFromCryptoCompare(symbol: string): Promise<number> {
  const resolvedSymbol = symbol === 'WBNB' ? 'BNB' : symbol
  const res = await axios.get('https://min-api.cryptocompare.com/data/price', {
    params: { fsym: resolvedSymbol, tsyms: 'USD' },
  })
  if (res.data?.Message?.includes('does not exist')) {
    throw new Error(`CryptoCompare doesn't support ${resolvedSymbol}`)
  }
  return res.data.USD
}

async function fetchTokenPriceFromGeckoTerminal(symbol: string, address: Hex): Promise<number> {
  const resolvedAddress = ['BNB', 'WBNB'].includes(symbol) ? zeroAddress : address.toLowerCase()
  const res = await axios.get(`https://api.geckoterminal.com/api/v2/simple/networks/bsc/token_price/${resolvedAddress}`)
  const price = res.data?.data?.attributes?.token_prices?.[resolvedAddress]
  if (price === undefined) {
    throw new Error(`GeckoTerminal price not found for ${address}`)
  }
  return Number(price)
}

async function fetchTokenPriceFromDexScreener(symbol: string, address: Hex): Promise<number> {
  const resolvedAddress = symbol === 'BNB' ? WBNB_ADDRESS.toLowerCase() : address.toLowerCase()
  const res = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${resolvedAddress}`)
  const price = res.data.pairs.filter((pair: any) => pair.chainId === 'bsc')?.[0]?.priceUsd
  if (!price) {
    throw new Error(`DexScreener price not found for ${address}`)
  }
  return Number(price)
}

export async function getTokenPrice({ symbol, address }: { symbol: string, address: Hex }): Promise<number> {
  if (symbol === 'USDT') return 1

  const cacheKey = `price_${symbol}_${address}`
  const cached = apiCache.get<number>(cacheKey)
  if (cached !== null) return cached

  const priceFetchStrategies = [
    () => fetchTokenPriceFromCryptoCompare(symbol),
    () => fetchTokenPriceFromGeckoTerminal(symbol, address),
    () => fetchTokenPriceFromDexScreener(symbol, address),
  ]

  for (const strategy of priceFetchStrategies) {
    try {
      const price = await strategy()
      if (price !== undefined) {
        apiCache.set(cacheKey, price, 120000) // 缓存2分钟
        return price
      }
    }
    catch (e: any) {
      console.warn(`Price fetch failed: ${e.message}`)
    }
  }
  throw new Error('All token price fetching strategies failed')
}

export async function getBlockNumberByTimestamp(timestamp: number): Promise<number> {
  const cacheKey = `block_${timestamp}`
  const cached = apiCache.get<number>(cacheKey)
  if (cached !== null) return cached

  try {
    const res = await client.get('/api', {
      params: {
        module: 'block',
        action: 'getblocknobytime',
        timestamp,
        closest: 'before',
      },
    })
    const blockNumber = Number(res.data.result)
    const result = Number.isNaN(blockNumber) ? 99999999 : blockNumber
    
    apiCache.set(cacheKey, result, 300000) // 缓存5分钟
    return result
  } catch (error) {
    console.error('Error fetching block number:', error)
    // 如果API调用失败，返回一个较大的块号，这样可以确保查询不会失败
    const fallbackResult = 99999999
    apiCache.set(cacheKey, fallbackResult, 60000) // 缓存1分钟
    return fallbackResult
  }
}

export async function getAlphaTokens(): Promise<AlphaTokenInfo[]> {
  const res = await axios.get(
    'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list',
  )
  return res.data.data.filter((token: AlphaTokenInfo) => token.chainId === '56')
}

export async function getSpotTokens(): Promise<string[]> {
  const res = await axios.get(
    'https://api.binance.com/api/v3/exchangeInfo',
  )
  return res.data.symbols.map((symbol: { baseAsset: string }) => symbol.baseAsset)
}

export async function getTransactions<T extends keyof TransactionActionMap>({
  action,
  address,
  startblock = 0,
  endblock = 99999999,
}: {
  action: T
  address: Hex
  startblock?: number
  endblock?: number
}): Promise<TransactionActionMap[T][]> {
  const cacheKey = `tx_${action}_${address}_${startblock}_${endblock}`
  const cached = apiCache.get<TransactionActionMap[T][]>(cacheKey)
  if (cached !== null) return cached

  const res = await client.get<{ result: TransactionActionMap[T][] | string }>('/api', {
    params: {
      module: 'account',
      action,
      address,
      startblock,
      endblock,
      sort: 'desc',
    },
  })
  
  // 检查是否是错误消息
  if (typeof res.data.result === 'string') {
    if (res.data.result.includes('rate limit reached')) {
      console.log(res.config.params.action, res.config.params.apikey)
      throw new Error('Max daily rate limit reached. 110000 (100%) of 100000 day/limit')
    }
    console.log('API error:', res.data.result)
    // 返回空数组而不是错误字符串
    return []
  }
  
  // 确保返回的是数组
  const result = Array.isArray(res.data.result) ? res.data.result : []
  apiCache.set(cacheKey, result, 30000) // 缓存30秒
  return result
}

// 批量获取交易数据
export async function getBatchTransactions(
  requests: Array<{
    action: keyof TransactionActionMap
    address: Hex
    startblock?: number
    endblock?: number
  }>
): Promise<Array<TransactionActionMap[keyof TransactionActionMap][]>> {
  const batchSize = 5
  const results: Array<TransactionActionMap[keyof TransactionActionMap][]> = []
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map(req => getTransactions(req))
    )
    
    results.push(
      ...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : []
      )
    )
  }
  
  return results
}

export function clearAPICache() {
  apiCache.clear()
}
