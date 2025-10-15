import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGO_URI: z.string().url(),
  REDIS_URL: z.string(),
  COINGECKO_API_KEY: z.string().optional(),
  COIN_IDS: z
    .string()
    .default('bitcoin,ethereum,solana')
    .transform((value: string) =>
      value
        .split(',')
        .map((coin: string) => coin.trim())
        .filter((coin: string) => coin.length > 0)
    ),
  PRICE_REFRESH_CRON: z.string().default('*/1 * * * *'),
})

export const env = envSchema.parse(process.env)

export const isProd = env.NODE_ENV === 'production'
