import { Router } from 'express'
import { getOrFetchPrices } from '../services/priceService.js'

export const priceRouter = Router()

priceRouter.get('/', async (_req, res, next) => {
  try {
    const payload = await getOrFetchPrices()
    res.json(payload)
  } catch (error) {
    next(error)
  }
})
