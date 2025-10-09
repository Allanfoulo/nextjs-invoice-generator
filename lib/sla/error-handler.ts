// SLA Error Handling Utilities
// Provides specialized error handling for SLA operations

import { SLAError } from './sla-errors';

export interface SLAErrorContext {
  operation: string;
  userId?: string;
  clientId?: string;
  templateId?: string;
  agreementId?: string;
  additionalData?: Record<string, any>;
}

export class SLAErrorHandler {
  private static instance: SLAErrorHandler;
  private errorCallbacks: Map<string, ((error: SLAError) => void)[]> = new Map();

  static getInstance(): SLAErrorHandler {
    if (!SLAErrorHandler.instance) {
      SLAErrorHandler.instance = new SLAErrorHandler();
    }
    return SLAErrorHandler.instance;
  }

  /**
   * Handle an SLA error with proper logging and user feedback
   */
  handleError(error: SLAError, context: SLAErrorContext): SLAError {
    // Enhance error with context
    error.context = context;
    error.timestamp = new Date();

    // Log the error
    this.logError(error, context);

    // Notify callbacks
    this.notifyCallbacks(error);

    return error;
  }

  /**
   * Handle database errors specifically
   */
  handleDatabaseError(error: any, context: SLAErrorContext): SLAError {
    let slaError: SLAError;

    // Map common database errors to SLA errors
    if (error.code === 'PGRST116') {
      slaError = new SLAError('NOT_FOUND', 'Requested resource not found', error.details);
    } else if (error.code === 'PGRST301') {
      slaError = new SLAError('PERMISSION_DENIED', 'Insufficient permissions for this operation', error.details);
    } else if (error.code === '23505') {
      slaError = new SLAError('VALIDATION_ERROR', 'Resource already exists or violates unique constraint', error.details);
    } else if (error.code === '23503') {
      slaError = new SLAError('VALIDATION_ERROR', 'Foreign key constraint violation', error.details);
    } else if (error.code === '23514') {
      slaError = new SLAError('VALIDATION_ERROR', 'Check constraint violation', error.details);
    } else {
      slaError = new SLAError('DATABASE_ERROR', 'Database operation failed', error.message);
    }

    return this.handleError(slaError, context);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: any, context: SLAErrorContext): SLAError {
    const message = error.errors?.map((e: any) => e.message).join(', ') || error.message || 'Validation failed';
    const slaError = new SLAError('VALIDATION_ERROR', message, error.errors);
    return this.handleError(slaError, context);
  }

  /**
   * Handle template-specific errors
   */
  handleTemplateError(errorType: string, message: string, context: SLAErrorContext): SLAError {
    const slaError = new SLAError(errorType as any, message, 'Template operation failed');
    return this.handleError(slaError, context);
  }

  /**
   * Log error details
   */
  private logError(error: SLAError, context: SLAErrorContext): void {
    const logEntry = {
      timestamp: error.timestamp.toISOString(),
      error: {
        type: error.type,
        message: error.message,
        details: error.details,
        stack: error.stack
      },
      context: {
        operation: context.operation,
        userId: context.userId,
        clientId: context.clientId,
        templateId: context.templateId,
        agreementId: context.agreementId,
        additionalData: context.additionalData
      }
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[SLA Error]', JSON.stringify(logEntry, null, 2));
    }

    // In production, you would send this to your logging service
    // TODO: Integrate with production logging service
  }

  /**
   * Register error callback
   */
  onError(errorType: string, callback: (error: SLAError) => void): void {
    if (!this.errorCallbacks.has(errorType)) {
      this.errorCallbacks.set(errorType, []);
    }
    this.errorCallbacks.get(errorType)!.push(callback);
  }

  /**
   * Notify all registered callbacks
   */
  private notifyCallbacks(error: SLAError): void {
    const callbacks = this.errorCallbacks.get(error.type) || [];
    callbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }
}

/**
 * Create an error context for SLA operations
 */
export function createSLAErrorContext(
  operation: string,
  overrides?: Partial<SLAErrorContext>
): SLAErrorContext {
  return {
    operation,
    ...overrides
  };
}

/**
 * Handle async SLA operations with error catching
 */
export async function withSLAErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  contextOverrides?: Partial<SLAErrorContext>
): Promise<T> {
  const errorHandler = SLAErrorHandler.getInstance();
  const context = createSLAErrorContext(operation, contextOverrides);

  try {
    return await fn();
  } catch (error) {
    if (error instanceof SLAError) {
      throw errorHandler.handleError(error, context);
    } else {
      throw errorHandler.handleDatabaseError(error, context);
    }
  }
}

/**
 * Create a user-friendly error message
 */
export function createUserFriendlyMessage(error: SLAError): string {
  switch (error.type) {
    case 'NOT_FOUND':
      return 'The requested SLA resource could not be found. Please check your selection and try again.';

    case 'PERMISSION_DENIED':
      return 'You do not have permission to perform this action. Please contact your administrator.';

    case 'VALIDATION_ERROR':
      return `Please check your input: ${error.message}`;

    case 'TEMPLATE_ERROR':
      return 'There was an issue with the SLA template. Please try again or contact support.';

    case 'VARIABLE_ERROR':
      return 'There was an issue processing the template variables. Please review your data and try again.';

    case 'PERFORMANCE_ERROR':
      return 'There was an issue calculating performance metrics. Please check your targets and try again.';

    case 'DATABASE_ERROR':
      return 'A database error occurred. Please try again in a few moments.';

    case 'GENERATION_ERROR':
      return 'Failed to generate the SLA document. Please try again or contact support.';

    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection and try again.';

    case 'AUTH_ERROR':
      return 'Authentication required. Please log in and try again.';

    default:
      return 'An unexpected error occurred. Please try again or contact support.';
  }
}