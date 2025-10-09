// SLA Logging Infrastructure
// Provides structured logging for SLA operations and auditing

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: 'sla' | 'template' | 'agreement' | 'performance' | 'compliance' | 'security';
  operation: string;
  message: string;
  userId?: string;
  clientId?: string;
  templateId?: string;
  agreementId?: string;
  metadata?: Record<string, any>;
  duration?: number;
  error?: {
    type: string;
    message: string;
    details?: string;
  };
}

export interface LogContext {
  userId?: string;
  clientId?: string;
  templateId?: string;
  agreementId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

export class SLALogger {
  private static instance: SLALogger;
  private logs: LogEntry[] = [];
  private maxLogSize: number = 1000; // Keep last 1000 logs in memory

  static getInstance(): SLALogger {
    if (!SLALogger.instance) {
      SLALogger.instance = new SLALogger();
    }
    return SLALogger.instance;
  }

  /**
   * Log debug information
   */
  debug(
    category: LogEntry['category'],
    operation: string,
    message: string,
    context?: LogContext
  ): void {
    this.log(LogLevel.DEBUG, category, operation, message, context);
  }

  /**
   * Log general information
   */
  info(
    category: LogEntry['category'],
    operation: string,
    message: string,
    context?: LogContext
  ): void {
    this.log(LogLevel.INFO, category, operation, message, context);
  }

  /**
   * Log warnings
   */
  warn(
    category: LogEntry['category'],
    operation: string,
    message: string,
    context?: LogContext
  ): void {
    this.log(LogLevel.WARN, category, operation, message, context);
  }

  /**
   * Log errors
   */
  error(
    category: LogEntry['category'],
    operation: string,
    message: string,
    error?: Error,
    context?: LogContext
  ): void {
    this.log(LogLevel.ERROR, category, operation, message, context, error);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogEntry['category'],
    operation: string,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      operation,
      message,
      userId: context?.userId,
      clientId: context?.clientId,
      templateId: context?.templateId,
      agreementId: context?.agreementId,
      metadata: context?.metadata,
      error: error ? {
        type: error.constructor.name,
        message: error.message,
        details: error.stack
      } : undefined
    };

    // Add to memory log
    this.addToMemory(logEntry);

    // Output to console in development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(logEntry);
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Add log to memory buffer
   */
  private addToMemory(logEntry: LogEntry): void {
    this.logs.push(logEntry);

    // Keep only the last maxLogSize entries
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize);
    }
  }

  /**
   * Output to console with formatting
   */
  private outputToConsole(logEntry: LogEntry): void {
    const prefix = `[${logEntry.timestamp}] [${logEntry.level.toUpperCase()}] [${logEntry.category}] [${logEntry.operation}]`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, logEntry.message, logEntry.metadata || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, logEntry.message, logEntry.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, logEntry.message, logEntry.metadata || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, logEntry.message, logEntry.error || '', logEntry.metadata || '');
        break;
    }
  }

  /**
   * Send to external logging service (production)
   */
  private sendToLoggingService(logEntry: LogEntry): void {
    // TODO: Integrate with your logging service (e.g., LogRocket, Sentry, DataDog)
    // This is a placeholder for production logging integration
    try {
      // Example: Send to your logging API
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // }).catch(err => console.error('Failed to send log:', err));
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: LogEntry['category']): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get logs by operation
   */
  getLogsByOperation(operation: string): LogEntry[] {
    return this.logs.filter(log => log.operation === operation);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): LogEntry[] {
    return this.logs.filter(log => log.level === LogLevel.ERROR);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<LogEntry['category'], number>;
    errorRate: number;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0
      },
      byCategory: {
        sla: 0,
        template: 0,
        agreement: 0,
        performance: 0,
        compliance: 0,
        security: 0
      },
      errorRate: 0
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category]++;
    });

    stats.errorRate = this.logs.length > 0
      ? (stats.byLevel[LogLevel.ERROR] / this.logs.length) * 100
      : 0;

    return stats;
  }
}

/**
 * Performance logging decorator
 */
export function logPerformance(
  category: LogEntry['category'],
  operation: string,
  context?: LogContext
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = SLALogger.getInstance();
      const startTime = Date.now();

      logger.debug(category, operation, `Starting ${propertyName}`, context);

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;

        logger.info(category, operation, `Completed ${propertyName} in ${duration}ms`, {
          ...context,
          metadata: { ...context?.metadata, duration, args: args.length }
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error(category, operation, `Failed ${propertyName} after ${duration}ms`, error as Error, {
          ...context,
          metadata: { ...context?.metadata, duration, args: args.length }
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Create a logger instance with preset context
 */
export function createLogger(
  category: LogEntry['category'],
  baseContext: LogContext = {}
): {
  debug: (operation: string, message: string, context?: LogContext) => void;
  info: (operation: string, message: string, context?: LogContext) => void;
  warn: (operation: string, message: string, context?: LogContext) => void;
  error: (operation: string, message: string, error?: Error, context?: LogContext) => void;
} {
  const logger = SLALogger.getInstance();

  return {
    debug: (operation: string, message: string, context?: LogContext) =>
      logger.debug(category, operation, message, { ...baseContext, ...context }),

    info: (operation: string, message: string, context?: LogContext) =>
      logger.info(category, operation, message, { ...baseContext, ...context }),

    warn: (operation: string, message: string, context?: LogContext) =>
      logger.warn(category, operation, message, { ...baseContext, ...context }),

    error: (operation: string, message: string, error?: Error, context?: LogContext) =>
      logger.error(category, operation, message, error, { ...baseContext, ...context })
  };
}

// Export singleton instance for convenience
export const logger = SLALogger.getInstance();