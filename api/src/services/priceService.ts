import axios from 'axios'
import { redisClient } from '../db/redis.js'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export interface PriceEntry {
  coinId: string
  priceUsd: number
  change24h?: number
  lastUpdated: string
}

export interface PriceSnapshot {
  items: PriceEntry[]
  timestamp: string
}

const PRICE_CACHE_KEY = 'prices:latest'
const PRICE_CACHE_TTL_SECONDS = 50
const COINGECKO_PUBLIC_ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price'
const COINGECKO_PRO_ENDPOINT = 'https://pro-api.coingecko.com/api/v3/simple/price'

const buildHeaders = () => {
  if (!env.COINGECKO_API_KEY) {
    return undefined
  }
  return {
    'x-cg-pro-api-key': env.COINGECKO_API_KEY,
  }
}

const resolveEndpoint = () => {
  if (env.COINGECKO_API_KEY) {
    return COINGECKO_PRO_ENDPOINT
  }
  return COINGECKO_PUBLIC_ENDPOINT
}

const requestPrices = (url: string, headers?: Record<string, string>) => {
  return axios.get<Record<string, { usd: number; usd_24h_change?: number }>>(url, {
    params: {
      ids: env.COIN_IDS.join(','),
      vs_currencies: 'usd',
      include_24hr_change: true,
      precision: 4,
    },
    ...(headers ? { headers } : {}),
  })
}

export const fetchAndCachePrices = async (): Promise<PriceSnapshot> => {
  try {
    const headers = buildHeaders()
    let response
    try {
      response = await requestPrices(resolveEndpoint(), headers)
    } catch (error) {
      if (headers && axios.isAxiosError(error) && error.response && [400, 401, 403, 429].includes(error.response.status)) {
        logger.warn('CoinGecko pro request failed, retrying without API key', {
          status: error.response.status,
        })
        response = await requestPrices(COINGECKO_PUBLIC_ENDPOINT)
      } else {
        throw error
      }
    }

    const timestamp = new Date().toISOString()
    const data = response.data as Record<string, { usd: number; usd_24h_change?: number }>
    const entries = Object.entries(data)

    const items: PriceEntry[] = entries.map(([coinId, value]) => {
      const result: PriceEntry = {
        coinId,
        priceUsd: value.usd,
        lastUpdated: timestamp,
      }
      if (typeof value.usd_24h_change === 'number') {
        result.change24h = value.usd_24h_change
      }
      return result
    })

    const snapshot: PriceSnapshot = { items, timestamp }
    await redisClient.set(PRICE_CACHE_KEY, JSON.stringify(snapshot), {
      EX: PRICE_CACHE_TTL_SECONDS,
    })

    logger.debug('Fetched prices from CoinGecko', { count: items.length })
    return snapshot
  } catch (error) {
    logger.error('Failed to fetch prices from CoinGecko', { error })
    throw error
  }
}

export const getCachedPrices = async (): Promise<PriceSnapshot | null> => {
  const cached = await redisClient.get(PRICE_CACHE_KEY)
  if (!cached) {
    return null
  }
  try {
    return JSON.parse(cached) as PriceSnapshot
  } catch (error) {
    logger.warn('Failed to parse cached price payload, purging cache', { error })
    await redisClient.del(PRICE_CACHE_KEY)
    return null
  }
}

export const getOrFetchPrices = async (): Promise<PriceSnapshot> => {
  const cached = await getCachedPrices()
  if (cached) {
    return cached
  }
  return fetchAndCachePrices()
}
