type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const payload = meta ? ` ${JSON.stringify(meta)}` : ''
  const timestamp = new Date().toISOString()
  // terse structured logs that still work in plain console output
  // we avoid console[level] because TypeScript does not type it for 'debug'
  switch (level) {
    case 'info':
      console.info(`[${timestamp}] [INFO] ${message}${payload}`)
      break
    case 'warn':
      console.warn(`[${timestamp}] [WARN] ${message}${payload}`)
      break
    case 'error':
      console.error(`[${timestamp}] [ERROR] ${message}${payload}`)
      break
    case 'debug':
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[${timestamp}] [DEBUG] ${message}${payload}`)
      }
      break
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
}
