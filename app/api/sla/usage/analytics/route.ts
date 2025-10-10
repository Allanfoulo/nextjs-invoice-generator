import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { usageTracker } from '@/lib/sla/usage-tracker';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Usage Analytics API Endpoint
 *
 * Provides comprehensive usage analytics and statistics for SLA templates.
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
async function checkUserPermissions(user: any, requireAdmin: boolean = false): Promise<boolean> {
  try {
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single();

    if (error || !userRole) {
      return false;
    }

    if (requireAdmin) {
      return userRole.role === 'internal_admin';
    }

    return true;
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// GET /api/sla/usage/analytics - Get comprehensive usage analytics
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Usage analytics API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check permissions (admin required for global analytics)
    const hasPermission = await checkUserPermissions(user, true);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access usage analytics'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const template_id = searchParams.get('template_id');
    const user_id = searchParams.get('user_id');

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Days parameter must be between 1 and 365'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    let result;

    if (template_id) {
      // Get specific template usage stats
      result = await usageTracker.getTemplateUsageStats(template_id, days);
    } else if (user_id) {
      // Get specific user usage stats
      result = await usageTracker.getUserUsageStats(user_id, days);
    } else {
      // Get comprehensive analytics
      result = await usageTracker.getUsageAnalytics(days);
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: result.error || 'Failed to fetch usage analytics'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const duration = performance.now() - startTime;
    logger.info('Usage analytics API request completed', {
      requestId,
      days,
      template_id,
      user_id,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Usage analytics retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Usage analytics API request failed', {
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
        message: 'Failed to retrieve usage analytics'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}