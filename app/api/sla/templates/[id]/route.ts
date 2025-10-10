import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { slaService } from '@/lib/sla/sla-service';
import { slaTemplateSchema } from '@/lib/sla/sla-types';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Individual SLA Template API Endpoint
 *
 * Handles operations for specific template instances by ID.
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
async function checkUserPermissions(user: any, action: string): Promise<boolean> {
  try {
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single();

    if (error || !userRole) {
      return false;
    }

    if (userRole.role === 'internal_admin') {
      return true;
    }

    switch (action) {
      case 'read':
        return true;
      case 'update':
      case 'delete':
        return userRole.role.startsWith('internal_');
      default:
        return false;
    }
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// GET /api/sla/templates/[id] - Get a specific template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  const { id } = params;

  try {
    logger.info('Template fetch API request started', { requestId, id });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check read permissions
    const hasPermission = await checkUserPermissions(user, 'read');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access template'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Validate template ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid template ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Fetch template
    const result = await slaService.getTemplate(id);

    if (!result.success) {
      if (result.error === 'Template not found') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          },
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      throw new Error(result.error || 'Failed to fetch template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template fetched successfully', {
      requestId,
      id,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Template retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Template fetch API request failed', {
      requestId,
      id,
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
        message: 'Failed to fetch template'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/sla/templates/[id] - Update a specific template
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  const { id } = params;

  try {
    logger.info('Template update API request started', { requestId, id });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check update permissions
    const hasPermission = await checkUserPermissions(user, 'update');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to update template'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Validate template ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid template ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();

    // Validate updates
    const validatedUpdates = slaTemplateSchema.partial().parse(body);

    // Update template
    const result = await slaService.updateTemplate(id, validatedUpdates);

    if (!result.success) {
      if (result.error === 'Template not found') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          },
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      throw new Error(result.error || 'Failed to update template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template updated successfully', {
      requestId,
      id,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Template updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Template update API request failed', {
      requestId,
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid template data',
          details: error.message
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

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
        message: 'Failed to update template'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE /api/sla/templates/[id] - Delete a specific template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  const { id } = params;

  try {
    logger.info('Template deletion API request started', { requestId, id });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check delete permissions
    const hasPermission = await checkUserPermissions(user, 'delete');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to delete template'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Validate template ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid template ID'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Delete template
    const result = await slaService.deleteTemplate(id);

    if (!result.success) {
      if (result.error === 'Template not found') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          },
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      throw new Error(result.error || 'Failed to delete template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template deleted successfully', {
      requestId,
      id,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Template deletion API request failed', {
      requestId,
      id,
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
        message: 'Failed to delete template'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}