import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Request failed', { err })

  if (err instanceof ZodError) {
    const { issues } = err
    res.status(400).json({
      message: 'Validation failed',
      issues,
    })
    return
  }

  if (err instanceof Error) {
    res.status(500).json({ message: err.message })
    return
  }

  res.status(500).json({ message: 'Unknown error' })
}
