import http from 'http'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env, isProd } from './config/env.js'
import { connectMongo } from './db/mongo.js'
import { connectRedis, redisClient } from './db/redis.js'
import { logger } from './utils/logger.js'
import { priceRouter } from './routes/priceRoutes.js'
import { alertRouter } from './routes/alertRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { createSocketServer } from './socket/manager.js'
import { evaluateAlerts } from './services/alertService.js'
import { fetchAndCachePrices, getCachedPrices } from './services/priceService.js'
import cron from 'node-cron'

const createApp = () => {
    const app = express()
    app.use(cors({ origin: '*', credentials: true }))
    app.use(express.json())
    app.use(cookieParser())

    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', env: env.NODE_ENV })
    })

    app.use('/api/prices', priceRouter)
    app.use('/api/alerts', alertRouter)

    app.use(errorHandler)
    return app
}

const bootstrap = async () => {
    await Promise.all([connectMongo(), connectRedis()])

    const app = createApp()
    const server = http.createServer(app)
    const socketManager = createSocketServer(server)

    const runPriceJob = async () => {
        try {
            const snapshot = await fetchAndCachePrices()
            socketManager.emitPriceUpdate(snapshot)
            await evaluateAlerts(snapshot, (userId, payload) => {
                socketManager.emitAlert(userId, payload)
            })
        } catch (error) {
            logger.error('Failed to execute price refresh job', { error })
        }
    }

        const tasks: cron.ScheduledTask[] = []

        const startCron = () => {
        if (!cron.validate(env.PRICE_REFRESH_CRON)) {
            logger.warn('Invalid cron expression, falling back to 1 minute interval', {
                cron: env.PRICE_REFRESH_CRON,
            })
                const task = cron.schedule('*/1 * * * *', runPriceJob, { runOnInit: true })
                tasks.push(task)
            return
        }
            const task = cron.schedule(env.PRICE_REFRESH_CRON, runPriceJob, { runOnInit: true })
            tasks.push(task)
    }

    const preloadCache = async () => {
        const cached = await getCachedPrices()
        if (!cached) {
            await runPriceJob()
        }
    }

    startCron()
    await preloadCache()

    const port = env.PORT
    server.listen(port, () => {
        logger.info(`API listening on port ${port}`, { env: env.NODE_ENV })
    })

    const gracefulShutdown = async () => {
        logger.info('Shutting down...')
            server.close()
            tasks.forEach((task) => task.stop())
            if (redisClient.isOpen) {
                await redisClient.disconnect()
            }
        process.exit(0)
    }

    process.on('SIGINT', gracefulShutdown)
    process.on('SIGTERM', gracefulShutdown)

    if (!isProd) {
        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection', { reason })
        })
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception', { error })
            gracefulShutdown().catch(() => process.exit(1))
        })
    }
}

bootstrap().catch((error) => {
    logger.error('Failed to bootstrap application', { error })
    process.exit(1)
})
