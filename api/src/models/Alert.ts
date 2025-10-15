import { Schema, model, type Document } from 'mongoose'

export type AlertDirection = 'above' | 'below'

export interface AlertDocument extends Document {
  userId: string
  coinId: string
  targetPrice: number
  direction: AlertDirection
  isTriggered: boolean
  triggeredAt?: Date
  createdAt: Date
  updatedAt: Date
}

const alertSchema = new Schema<AlertDocument>(
  {
    userId: { type: String, required: true, index: true },
    coinId: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    direction: { type: String, required: true, enum: ['above', 'below'] },
    isTriggered: { type: Boolean, default: false },
    triggeredAt: { type: Date },
  },
  { timestamps: true }
)

alertSchema.index({ userId: 1, coinId: 1 })

export const AlertModel = model<AlertDocument>('Alert', alertSchema)
