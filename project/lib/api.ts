import type { Hex } from 'viem'
import type { AlphaTokenInfo, TransactionActionMap } from '@/types'
import axios from 'axios'
import { zeroAddress } from 'viem'
import { apiKeys } from '@/configs'
import { WBNB_ADDRESS } from '@/constants'
import { getRandomElementFromArray } from '@/lib/utils'
import { blockchainCache, withCache, cacheKeys } from '@/lib/cache'

const client = axios.create({
  baseURL: 'https://api.etherscan.io',
  params: {
    chainId: 56,
  },
})

client.interceptors.request.use(
  (config) => {
    if (config.params) {
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
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
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

// 原始的价格获取函数
async function _getTokenPrice({ symbol, address }: { symbol: string, address: Hex }): Promise<number> {
  if (symbol === 'USDT')
    return 1

  const priceFetchStrategies = [
    () => fetchTokenPriceFromCryptoCompare(symbol),
    () => fetchTokenPriceFromGeckoTerminal(symbol, address),
    () => fetchTokenPriceFromDexScreener(symbol, address),
  ]

  for (const strategy of priceFetchStrategies) {
    try {
      const price = await strategy()
      if (price !== undefined)
        return price
    }
    catch (e: any) {
      console.warn(`Price fetch failed: ${e.message}`)
    }
  }
  throw new Error('All token price fetching strategies failed')
}

// 带缓存的价格获取函数
export const getTokenPrice = withCache(
  _getTokenPrice,
  {
    keyGenerator: ({ symbol, address }) => cacheKeys.tokenPrice(symbol, address),
    ttl: 30000, // 30秒缓存
    useGlobalCache: true,
  }
)

// 原始的区块号获取函数
async function _getBlockNumberByTimestamp(timestamp: number): Promise<number> {
  const res = await client.get('/v2/api', {
    params: {
      module: 'block',
      action: 'getblocknobytime',
      timestamp,
      closest: 'before',
    },
  })
  const blockNumber = Number(res.data.result)
  return Number.isNaN(blockNumber) ? 99999999 : blockNumber
}

// 带缓存的区块号获取函数
export const getBlockNumberByTimestamp = withCache(
  _getBlockNumberByTimestamp,
  {
    keyGenerator: (timestamp) => cacheKeys.blockByTimestamp(timestamp),
    ttl: 300000, // 5分钟缓存
    useGlobalCache: true,
  }
)

// 原始的 Alpha 代币获取函数
async function _getAlphaTokens(): Promise<AlphaTokenInfo[]> {
  const res = await axios.get(
    'https://www.binance.com/bapi/defi/v1/public/wallet-direct/buw/wallet/cex/alpha/all/token/list',
  )
  return res.data.data.filter((token: AlphaTokenInfo) => token.chainId === '56')
}

// 带缓存的 Alpha 代币获取函数
export const getAlphaTokens = withCache(
  _getAlphaTokens,
  {
    keyGenerator: () => cacheKeys.alphaTokens(),
    ttl: 600000, // 10分钟缓存
    useGlobalCache: true,
  }
)

// 原始的现货代币获取函数
async function _getSpotTokens(): Promise<string[]> {
  const res = await axios.get(
    'https://api.binance.com/api/v3/exchangeInfo',
  )
  return res.data.symbols.map((symbol: { baseAsset: string }) => symbol.baseAsset)
}

// 带缓存的现货代币获取函数
export const getSpotTokens = withCache(
  _getSpotTokens,
  {
    keyGenerator: () => cacheKeys.spotTokens(),
    ttl: 3600000, // 1小时缓存
    useGlobalCache: true,
  }
)

// 增强的交易获取函数，带缓存支持
export async function getTransactions<T extends keyof TransactionActionMap>({
  action,
  address,
  startblock = 0,
  endblock = 99999999,
  useCache = true,
}: {
  action: T
  address: Hex
  startblock?: number
  endblock?: number
  useCache?: boolean
}): Promise<TransactionActionMap[T][]> {

  // 尝试从缓存获取
  if (useCache) {
    const cacheKey = `${action}:${address.toLowerCase()}:${startblock}:${endblock}`
    const cached = blockchainCache.getTransactions(cacheKey)
    if (cached) {
      console.log(`Transaction cache hit: ${cacheKey}`)
      return cached
    }
  }

  const res = await client.get<{ result: TransactionActionMap[T][] }>('/v2/api', {
    params: {
      module: 'account',
      action,
      address,
      startblock,
      endblock,
      sort: 'desc',
    },
  })

  if (typeof res.data.result === 'string' && (res.data.result as string)?.includes('rate limit reached')) {
    console.log(res.config.params.action, res.config.params.apikey)
    throw new Error('Max daily rate limit reached. 110000 (100%) of 100000 day/limit')
  }

  const result = res.data.result

  // 缓存结果
  if (useCache) {
    const cacheKey = `${action}:${address.toLowerCase()}:${startblock}:${endblock}`
    blockchainCache.cacheTransactions(cacheKey, result)
    console.log(`Transaction cached: ${cacheKey}`)
  }

  return result
}
