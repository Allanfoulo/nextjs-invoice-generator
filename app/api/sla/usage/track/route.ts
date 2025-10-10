import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { usageTracker } from '@/lib/sla/usage-tracker';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Template Usage Tracking API Endpoint
 *
 * Handles tracking of template usage events for analytics and statistics.
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

    // All authenticated users can track usage
    return true;
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// POST /api/sla/usage/track - Track a template usage event
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Usage tracking API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check permissions
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to track usage'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { template_id, event_type, client_id, quote_id, agreement_id, metadata } = body;

    // Validate required fields
    if (!template_id || !event_type) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template ID and event type are required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate event type
    const validEventTypes = ['preview', 'agreement_created', 'agreement_signed', 'template_viewed', 'template_modified'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Track usage event
    const result = await usageTracker.trackUsageEvent({
      template_id,
      event_type,
      user_id: user.id,
      client_id,
      quote_id,
      agreement_id,
      metadata: metadata || {}
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: result.error || 'Failed to track usage event'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const duration = performance.now() - startTime;
    logger.info('Usage tracking API request completed', {
      requestId,
      template_id,
      event_type,
      eventId: result.event_id,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: {
        event_id: result.event_id
      },
      message: 'Usage event tracked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Usage tracking API request failed', {
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
        message: 'Failed to track usage event'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/sla/usage/track - Track multiple usage events in batch
export async function PUT(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Batch usage tracking API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check permissions
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to track usage'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { events } = body;

    // Validate events array
    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Events array is required and cannot be empty'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate each event
    const validEventTypes = ['preview', 'agreement_created', 'agreement_signed', 'template_viewed', 'template_modified'];
    for (const event of events) {
      if (!event.template_id || !event.event_type) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Each event must have template_id and event_type'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }

      if (!validEventTypes.includes(event.event_type)) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid event type: ${event.event_type}. Must be one of: ${validEventTypes.join(', ')}`
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // Prepare events with user ID
    const eventsWithUserId = events.map(event => ({
      ...event,
      user_id: user.id
    }));

    // Track batch usage events
    const result = await usageTracker.trackUsageEventsBatch(eventsWithUserId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'TRACKING_ERROR',
          message: result.error || 'Failed to track batch usage events'
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const duration = performance.now() - startTime;
    logger.info('Batch usage tracking API request completed', {
      requestId,
      eventCount: events.length,
      eventIds: result.event_ids,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: {
        event_ids: result.event_ids,
        events_tracked: events.length
      },
      message: 'Batch usage events tracked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Batch usage tracking API request failed', {
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
        message: 'Failed to track batch usage events'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}