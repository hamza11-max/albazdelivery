/**
 * Structured logging utility
 * Addresses technical debt: Consistent logging across application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  environment: string
}

class Logger {
  private readonly logLevel: LogLevel
  private readonly isDevelopment: boolean
  private readonly isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    
    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    }
  }

  private writeLog(entry: LogEntry): void {
    const { level, message, context } = entry

    // In production, send to external logging service
    if (this.isProduction) {
      // TODO: Send to logging service (Datadog, LogRocket, etc.)
      // For now, just use console
    }

    // Format for console
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`
    const fullMessage = `${prefix} ${message}`

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(fullMessage, context || '')
        }
        break
      case 'info':
        console.log(fullMessage, context || '')
        break
      case 'warn':
        console.warn(fullMessage, context || '')
        break
      case 'error':
        console.error(fullMessage, context || '')
        break
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.writeLog(this.formatMessage('debug', message, context))
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.writeLog(this.formatMessage('info', message, context))
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.writeLog(this.formatMessage('warn', message, context))
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext: LogContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
      }
      this.writeLog(this.formatMessage('error', message, errorContext))
    }
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context)
  }

  /**
   * Log API response
   */
  apiResponse(method: string, path: string, statusCode: number, context?: LogContext): void {
    const level: LogLevel = statusCode >= 400 ? 'error' : 'info'
    this[level](`API ${method} ${path} - ${statusCode}`, context)
  }

  /**
   * Log database query (only in development with query logging enabled)
   */
  query(operation: string, table: string, context?: LogContext): void {
    if (this.isDevelopment && process.env.ENABLE_QUERY_LOGGING === 'true') {
      this.debug(`DB ${operation} ${table}`, context)
    }
  }

  /**
   * Log authentication event
   */
  auth(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, { ...context, userId })
  }

  /**
   * Log payment event
   */
  payment(event: string, orderId: string, amount: number, context?: LogContext): void {
    this.info(`Payment: ${event}`, { ...context, orderId, amount })
  }

  /**
   * Log order event
   */
  order(event: string, orderId: string, context?: LogContext): void {
    this.info(`Order: ${event}`, { ...context, orderId })
  }

  /**
   * Log delivery event
   */
  delivery(event: string, deliveryId: string, context?: LogContext): void {
    this.info(`Delivery: ${event}`, { ...context, deliveryId })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error | unknown, ctx?: LogContext) => logger.error(msg, err, ctx),
  api: {
    request: (method: string, path: string, ctx?: LogContext) => logger.apiRequest(method, path, ctx),
    response: (method: string, path: string, code: number, ctx?: LogContext) => logger.apiResponse(method, path, code, ctx),
  },
  db: {
    query: (op: string, table: string, ctx?: LogContext) => logger.query(op, table, ctx),
  },
  auth: (event: string, userId?: string, ctx?: LogContext) => logger.auth(event, userId, ctx),
  payment: (event: string, orderId: string, amount: number, ctx?: LogContext) => logger.payment(event, orderId, amount, ctx),
  order: (event: string, orderId: string, ctx?: LogContext) => logger.order(event, orderId, ctx),
  delivery: (event: string, deliveryId: string, ctx?: LogContext) => logger.delivery(event, deliveryId, ctx),
}

