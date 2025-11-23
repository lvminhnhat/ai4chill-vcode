/**
 * Simple logging utility for the application
 * In production, this could be replaced with a proper logging service
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: any
  userId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  private log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    const formattedLog = this.formatLog(entry)

    if (this.isDevelopment) {
      // In development, use console methods for better debugging
      switch (level) {
        case 'error':
          console.error(formattedLog)
          break
        case 'warn':
          console.warn(formattedLog)
          break
        case 'debug':
          console.debug(formattedLog)
          break
        default:
          console.log(formattedLog)
      }
    } else {
      // In production, you could send to a logging service
      // For now, we'll still use console.error for errors
      if (level === 'error') {
        console.error(formattedLog)
      }
    }

    // In a real app, you might want to store logs or send them to a service
    // this.sendToLoggingService(entry)
  }

  info(message: string, context?: any) {
    this.log('info', message, context)
  }

  warn(message: string, context?: any) {
    this.log('warn', message, context)
  }

  error(message: string, context?: any) {
    this.log('error', message, context)
  }

  debug(message: string, context?: any) {
    this.log('debug', message, context)
  }

  // Specific methods for common use cases
  checkoutError(error: Error, additionalContext?: any) {
    this.error('Checkout process failed', {
      errorMessage: error.message,
      stack: error.stack,
      ...additionalContext,
    })
  }

  paymentError(error: Error, orderId?: string, additionalContext?: any) {
    this.error('Payment processing failed', {
      orderId,
      errorMessage: error.message,
      stack: error.stack,
      ...additionalContext,
    })
  }

  validationError(errors: any, formName?: string) {
    this.error('Form validation failed', {
      formName,
      errors,
    })
  }
}

export const logger = new Logger()
