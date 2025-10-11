// SLA-Specific Error Classes
// Custom error types for different SLA operation failures

export enum SLAErrorType {
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  VARIABLE_ERROR = 'VARIABLE_ERROR',
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR'
}

export interface SLAErrorContext {
  operation: string;
  userId?: string;
  clientId?: string;
  templateId?: string;
  agreementId?: string;
  additionalData?: Record<string, any>;
}

export class SLAError extends Error {
  public readonly type: SLAErrorType;
  public readonly details?: string;
  public readonly code?: string;
  public readonly context?: SLAErrorContext;
  public timestamp?: Date;

  constructor(
    type: SLAErrorType,
    message: string,
    details?: string,
    code?: string
  ) {
    super(message);
    this.name = 'SLAError';
    this.type = type;
    this.details = details;
    this.code = code;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SLAError);
    }
  }

  /**
   * Create a NOT_FOUND error
   */
  static notFound(resource: string, identifier?: string): SLAError {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    return new SLAError(SLAErrorType.NOT_FOUND, message, undefined, 'NOT_FOUND');
  }

  /**
   * Create a PERMISSION_DENIED error
   */
  static permissionDenied(operation: string, resource?: string): SLAError {
    const message = resource
      ? `Permission denied for ${operation} on ${resource}`
      : `Permission denied for ${operation}`;
    return new SLAError(SLAErrorType.PERMISSION_DENIED, message, undefined, 'PERMISSION_DENIED');
  }

  /**
   * Create a VALIDATION_ERROR
   */
  static validation(message: string, errors?: any): SLAError {
    return new SLAError(
      SLAErrorType.VALIDATION_ERROR,
      message,
      typeof errors === 'string' ? errors : JSON.stringify(errors),
      'VALIDATION_ERROR'
    );
  }

  /**
   * Create a TEMPLATE_ERROR
   */
  static template(operation: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.TEMPLATE_ERROR,
      `Template ${operation} failed`,
      details,
      'TEMPLATE_ERROR'
    );
  }

  /**
   * Create a VARIABLE_ERROR
   */
  static variable(operation: string, variableName?: string): SLAError {
    const message = variableName
      ? `Variable ${operation} failed for '${variableName}'`
      : `Variable ${operation} failed`;
    return new SLAError(SLAErrorType.VARIABLE_ERROR, message, undefined, 'VARIABLE_ERROR');
  }

  /**
   * Create a PERFORMANCE_ERROR
   */
  static performance(operation: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.PERFORMANCE_ERROR,
      `Performance ${operation} failed`,
      details,
      'PERFORMANCE_ERROR'
    );
  }

  /**
   * Create a DATABASE_ERROR
   */
  static database(operation: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.DATABASE_ERROR,
      `Database ${operation} failed`,
      details,
      'DATABASE_ERROR'
    );
  }

  /**
   * Create a GENERATION_ERROR
   */
  static generation(operation: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.GENERATION_ERROR,
      `Document ${operation} failed`,
      details,
      'GENERATION_ERROR'
    );
  }

  /**
   * Create a NETWORK_ERROR
   */
  static network(operation: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.NETWORK_ERROR,
      `Network ${operation} failed`,
      details,
      'NETWORK_ERROR'
    );
  }

  /**
   * Create an AUTH_ERROR
   */
  static auth(operation: string): SLAError {
    return new SLAError(
      SLAErrorType.AUTH_ERROR,
      `Authentication required for ${operation}`,
      undefined,
      'AUTH_ERROR'
    );
  }

  /**
   * Create a RATE_LIMIT_ERROR
   */
  static rateLimit(operation: string, retryAfter?: number): SLAError {
    const details = retryAfter
      ? `Retry after ${retryAfter} seconds`
      : 'Rate limit exceeded';
    return new SLAError(
      SLAErrorType.RATE_LIMIT_ERROR,
      `Rate limit exceeded for ${operation}`,
      details,
      'RATE_LIMIT_ERROR'
    );
  }

  /**
   * Create a CONFIGURATION_ERROR
   */
  static configuration(setting: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.CONFIGURATION_ERROR,
      `Configuration error for ${setting}`,
      details,
      'CONFIGURATION_ERROR'
    );
  }

  /**
   * Create an INTEGRATION_ERROR
   */
  static integration(service: string, operation: string, details?: string): SLAError {
    return new SLAError(
      SLAErrorType.INTEGRATION_ERROR,
      `Integration with ${service} failed during ${operation}`,
      details,
      'INTEGRATION_ERROR'
    );
  }

  /**
   * Convert error to JSON for logging/API responses
   */
  toJSON(): Record<string, any> {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp?.toISOString(),
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return [
      SLAErrorType.NETWORK_ERROR,
      SLAErrorType.RATE_LIMIT_ERROR,
      SLAErrorType.DATABASE_ERROR
    ].includes(this.type);
  }

  /**
   * Get suggested retry delay in milliseconds
   */
  getRetryDelay(): number {
    switch (this.type) {
      case SLAErrorType.RATE_LIMIT_ERROR:
        return 5000; // 5 seconds
      case SLAErrorType.NETWORK_ERROR:
        return 2000; // 2 seconds
      case SLAErrorType.DATABASE_ERROR:
        return 1000; // 1 second
      default:
        return 0; // Not retryable
    }
  }
}

/**
 * Template-specific error for invalid template variables
 */
export class TemplateVariableError extends SLAError {
  public readonly variableName: string;
  public readonly expectedType?: string;

  constructor(variableName: string, message: string, expectedType?: string) {
    super(SLAErrorType.VARIABLE_ERROR, message, `Variable: ${variableName}, Expected: ${expectedType || 'any'}`);
    this.variableName = variableName;
    this.expectedType = expectedType;
  }
}

/**
 * Template-specific error for content generation failures
 */
export class TemplateGenerationError extends SLAError {
  public readonly templateId?: string;
  public readonly stage?: string;

  constructor(message: string, templateId?: string, stage?: string) {
    super(SLAErrorType.GENERATION_ERROR, message, `Template: ${templateId}, Stage: ${stage}`);
    this.templateId = templateId;
    this.stage = stage;
  }
}

/**
 * Performance-specific error for metric calculations
 */
export class PerformanceMetricError extends SLAError {
  public readonly metricName: string;
  public readonly value?: number;

  constructor(metricName: string, message: string, value?: number) {
    super(SLAErrorType.PERFORMANCE_ERROR, message, `Metric: ${metricName}, Value: ${value}`);
    this.metricName = metricName;
    this.value = value;
  }
}

/**
 * Error handler for SLA operations
 */
export class SLAErrorHandler {
  /**
   * Handle errors and return appropriate error responses
   */
  static handleError(error: unknown, context?: string): {
    success: false;
    error: {
      code: string;
      message: string;
      details?: any;
    };
  } {
    if (error instanceof SLAError) {
      return {
        success: false,
        error: {
          code: error.code || error.type,
          message: error.message,
          details: error.details
        }
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message,
          details: error.stack
        }
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        details: typeof error === 'string' ? error : JSON.stringify(error)
      }
    };
  }

  /**
   * Log errors for debugging
   */
  static logError(error: unknown, context?: string): void {
    console.error(`[SLA Error] ${context || 'Unknown context'}:`, error);

    if (error instanceof SLAError) {
      console.error('SLA Error Details:', {
        type: error.type,
        code: error.code,
        details: error.details,
        context: error.context
      });
    }
  }
}