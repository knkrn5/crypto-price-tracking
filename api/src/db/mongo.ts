import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export const connectMongo = async () => {
  try {
    await mongoose.connect(env.MONGO_URI)
    logger.info('Connected to MongoDB')
  } catch (error) {
    logger.error('MongoDB connection failed', { error })
    throw error
  }
}
