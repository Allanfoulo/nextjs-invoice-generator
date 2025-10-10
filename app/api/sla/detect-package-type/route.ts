import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { packageDetector } from '@/lib/sla/package-detector';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Package Type Detection API Endpoint
 *
 * Provides intelligent package type detection from quote data.
 * Supports detailed analysis with confidence scores and reasoning.
 */

const supabase = createClient();
const errorHandler = new SLAErrorHandler();

// Helper function to get authenticated user
async function getAuthenticatedUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error('Unauthorized: No valid user session');
    }

    return user;
  } catch (error) {
    throw new Error('Unauthorized: Authentication failed');
  }
}

// Helper function to check user permissions
async function checkUserPermissions(user: any): Promise<boolean> {
  try {
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single();

    if (error || !userRole) {
      return false;
    }

    // All authenticated users can detect package types
    return true;
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// POST /api/sla/detect-package-type - Detect package type from quote data
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Package type detection API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check permissions
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to detect package type'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { quote, client, additionalContext, detailedAnalysis } = body;

    // Validate required fields
    if (!quote || !client) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quote and client data are required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate quote structure
    if (!quote.id || !quote.items || !Array.isArray(quote.items)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid quote structure. Quote must have id and items array.'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate client structure
    if (!client.id || (!client.name && !client.company)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client structure. Client must have id and either name or company.'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    try {
      let result;

      if (detailedAnalysis) {
        // Get detailed analysis with reasoning
        result = packageDetector.getDetailedAnalysis(
          quote,
          client,
          additionalContext || {}
        );

        // Add validation information
        const validation = packageDetector.validateDetection(
          result.detected_type,
          quote,
          client
        );

        result.validation = validation;

        logger.info('Detailed package type analysis completed', {
          requestId,
          quoteId: quote.id,
          detectedType: result.detected_type,
          confidence: result.confidence
        });
      } else {
        // Simple detection
        const detectedType = packageDetector.detectPackageType(
          quote,
          client,
          additionalContext || {}
        );

        // Get validation for simple detection
        const validation = packageDetector.validateDetection(
          detectedType,
          quote,
          client
        );

        result = {
          detected_type: detectedType,
          confidence: validation.confidence,
          validation
        };

        logger.info('Package type detection completed', {
          requestId,
          quoteId: quote.id,
          detectedType: detectedType,
          confidence: validation.confidence
        });
      }

      const duration = performance.now() - startTime;
      logger.info('Package type detection API request completed', {
        requestId,
        quoteId: quote.id,
        duration: `${duration.toFixed(2)}ms`
      });

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Package type detection completed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (detectionError) {
      logger.error('Package type detection failed', {
        requestId,
        quoteId: quote?.id,
        error: detectionError instanceof Error ? detectionError.message : 'Unknown error'
      });

      throw detectionError;
    }

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Package type detection API request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to detect package type'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET /api/sla/detect-package-type - Get supported package types and patterns
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Package type patterns API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check permissions
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access package type information'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Return package type information
    const packageTypeInfo = {
      supported_types: [
        {
          type: 'ecom_site',
          display_name: 'E-commerce Site',
          description: 'Online stores with product catalogs, shopping carts, and payment processing',
          typical_value_range: { min: 50000, max: 500000 },
          typical_item_count: { min: 10, max: 50 }
        },
        {
          type: 'general_website',
          display_name: 'General Website',
          description: 'Corporate websites, portfolios, and informational sites',
          typical_value_range: { min: 15000, max: 150000 },
          typical_item_count: { min: 5, max: 20 }
        },
        {
          type: 'business_process_systems',
          display_name: 'Business Process Systems',
          description: 'CRM, ERP, and custom business management systems',
          typical_value_range: { min: 100000, max: 1000000 },
          typical_item_count: { min: 8, max: 30 }
        },
        {
          type: 'marketing',
          display_name: 'Marketing Platform',
          description: 'Digital marketing, campaign management, and lead generation systems',
          typical_value_range: { min: 25000, max: 200000 },
          typical_item_count: { min: 5, max: 25 }
        }
      ],
      detection_methodology: {
        approaches: [
          'Keyword matching with weighted scoring',
          'Item pattern analysis',
          'Value-based validation',
          'Item count correlation',
          'Text semantic analysis'
        ],
        confidence_thresholds: {
          high: 80,
          medium: 60,
          low: 40
        }
      }
    };

    const duration = performance.now() - startTime;
    logger.info('Package type patterns API request completed', {
      requestId,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: packageTypeInfo,
      message: 'Package type information retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Package type patterns API request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve package type information'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}