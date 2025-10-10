import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { slaService } from '@/lib/sla/sla-service';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Template Clone API Endpoint
 *
 * Handles cloning of existing SLA templates with new names and descriptions.
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

    // Only internal users can clone templates
    return userRole.role.startsWith('internal_');
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// POST /api/sla/templates/[id]/clone - Clone a template
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  const { id } = params;

  try {
    logger.info('Template clone API request started', { requestId, id });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check clone permissions
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to clone templates'
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
    const { name, description } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template name is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate name length
    if (name.length > 200) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template name cannot exceed 200 characters'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate description (optional)
    if (description && typeof description !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Description must be a string'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Clone template
    const result = await slaService.cloneTemplate(id, name.trim(), description?.trim());

    if (!result.success) {
      if (result.error === 'Template not found') {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Original template not found'
          },
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
      throw new Error(result.error || 'Failed to clone template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template cloned successfully', {
      requestId,
      originalId: id,
      newId: result.data?.id,
      name,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Template cloned successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Template clone API request failed', {
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
        message: 'Failed to clone template'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}