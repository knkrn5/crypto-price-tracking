import { Router } from 'express'
import { z } from 'zod'
import { createAlert, deleteAlert, listAlertsByUser } from '../services/alertService.js'

export const alertRouter = Router()

const createAlertSchema = z.object({
  userId: z.string().min(1, 'userId is required').trim(),
  coinId: z.string().min(1, 'coinId is required').trim(),
  targetPrice: z.coerce.number().positive('targetPrice must be positive'),
  direction: z.enum(['above', 'below']),
})

const userIdQuerySchema = z.object({
  userId: z.string().min(1, 'userId is required').trim(),
})

alertRouter.get('/', async (req, res, next) => {
  try {
    const { userId } = userIdQuerySchema.parse(req.query)
    const alerts = await listAlertsByUser(userId)
    res.json({ alerts })
  } catch (error) {
    next(error)
  }
})

alertRouter.post('/', async (req, res, next) => {
  try {
    const payload = createAlertSchema.parse(req.body)
    const alert = await createAlert(payload)
    res.status(201).json({ alert })
  } catch (error) {
    next(error)
  }
})

alertRouter.delete('/:alertId', async (req, res, next) => {
  try {
    const { userId } = userIdQuerySchema.parse(req.query)
    const deleted = await deleteAlert(req.params.alertId, userId)
    if (!deleted) {
      res.status(404).json({ message: 'Alert not found' })
      return
    }
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
