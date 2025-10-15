import { Types } from 'mongoose'
import { AlertModel, type AlertDirection, type AlertDocument } from '../models/Alert.js'
import type { PriceSnapshot } from './priceService.js'
import { logger } from '../utils/logger.js'

export interface CreateAlertInput {
  userId: string
  coinId: string
  targetPrice: number
  direction: AlertDirection
}

export interface AlertNotificationPayload {
  alertId: string
  coinId: string
  targetPrice: number
  direction: AlertDirection
  currentPrice: number
  triggeredAt: string
}

export const createAlert = async (input: CreateAlertInput) => {
  const alert = await AlertModel.create(input)
  return alert.toObject()
}

export const listAlertsByUser = async (userId: string) => {
  const alerts = await AlertModel.find({ userId }).sort({ createdAt: -1 })
  return alerts.map((alert) => alert.toObject())
}

export const deleteAlert = async (alertId: string, userId: string) => {
  if (!Types.ObjectId.isValid(alertId)) {
    return false
  }
  const deleted = await AlertModel.findOneAndDelete({ _id: alertId, userId })
  return Boolean(deleted)
}

const shouldTrigger = (alert: AlertDocument, price: number) => {
  return (
    (alert.direction === 'above' && price >= alert.targetPrice) ||
    (alert.direction === 'below' && price <= alert.targetPrice)
  )
}

export const evaluateAlerts = async (
  snapshot: PriceSnapshot,
  notify: (userId: string, payload: AlertNotificationPayload) => void
) => {
  const coinIds = snapshot.items.map((item) => item.coinId)
  if (!coinIds.length) {
    return
  }

  const pendingAlerts = await AlertModel.find({
    coinId: { $in: coinIds },
    isTriggered: false,
  })

  if (!pendingAlerts.length) {
    return
  }

  const priceMap = new Map(snapshot.items.map((item) => [item.coinId, item.priceUsd]))
  const updates: AlertDocument[] = []

  pendingAlerts.forEach((alert) => {
    const price = priceMap.get(alert.coinId)
    if (price === undefined) {
      return
    }

    if (shouldTrigger(alert, price)) {
      alert.isTriggered = true
      alert.triggeredAt = new Date()
      updates.push(alert)

      notify(alert.userId, {
        alertId: alert.id,
        coinId: alert.coinId,
        targetPrice: alert.targetPrice,
        direction: alert.direction,
        currentPrice: price,
        triggeredAt: alert.triggeredAt.toISOString(),
      })
    }
  })

  if (!updates.length) {
    return
  }

  await Promise.all(updates.map((alert) => alert.save()))
  logger.info('Triggered alerts', { count: updates.length })
}
