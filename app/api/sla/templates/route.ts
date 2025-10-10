import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { slaService } from '@/lib/sla/sla-service';
import { SLATemplate, PackageType, slaTemplateSchema } from '@/lib/sla/sla-types';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * SLA Templates API Endpoint
 *
 * Handles CRUD operations for SLA templates with proper authentication,
 * authorization, and validation according to the API contracts specification.
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
    // Get user role from user_roles table
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single();

    if (error || !userRole) {
      logger.warn('User role not found', { userId: user.id });
      return false;
    }

    // Admin users have full access
    if (userRole.role === 'internal_admin') {
      return true;
    }

    // Check specific permissions based on action
    switch (action) {
      case 'read':
        // All authenticated users can read templates
        return true;

      case 'create':
      case 'update':
      case 'delete':
        // Only internal users can modify templates
        return userRole.role.startsWith('internal_');

      default:
        return false;
    }
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// GET /api/sla/templates - Retrieve SLA templates
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Templates API request started', { requestId });

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const package_type = searchParams.get('package_type') as PackageType | null;
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate query parameters
    const validPackageTypes: PackageType[] = ['ecom_site', 'general_website', 'business_process_systems', 'marketing'];
    if (package_type && !validPackageTypes.includes(package_type)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid package_type parameter',
          details: `Valid options: ${validPackageTypes.join(', ')}`
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse is_active parameter
    let isActiveFilter: boolean | undefined;
    if (is_active !== null) {
      if (is_active === 'true') {
        isActiveFilter = true;
      } else if (is_active === 'false') {
        isActiveFilter = false;
      } else {
        return NextResponse.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid is_active parameter',
            details: 'Must be "true" or "false"'
          },
          timestamp: new Date().toISOString()
        }, { status: 400 });
      }
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pagination parameters',
          details: 'Page must be >= 1, Limit must be between 1 and 100'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check read permissions
    const hasPermission = await checkUserPermissions(user, 'read');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access templates'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Fetch templates
    const result = await slaService.getTemplates({
      package_type: package_type || undefined,
      is_active: isActiveFilter,
      search: search || undefined,
      page,
      limit
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch templates');
    }

    const duration = performance.now() - startTime;
    logger.info('Templates fetched successfully', {
      requestId,
      count: result.data.length,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: {
        templates: result.data
      },
      pagination: result.pagination,
      message: 'Templates retrieved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Templates API request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          timestamp: new Date().toISOString()
        }, { status: 401 });
      }

      if (error.message.includes('Forbidden')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions'
          },
          timestamp: new Date().toISOString()
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST /api/sla/templates - Create a new SLA template
export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Template creation API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check create permissions
    const hasPermission = await checkUserPermissions(user, 'create');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to create templates'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate request body
    const validatedData = slaTemplateSchema.parse(body);

    // Create template
    const result = await slaService.createTemplate({
      ...validatedData,
      created_by_user_id: user.id
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to create template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template created successfully', {
      requestId,
      templateId: result.data?.id,
      duration: `${duration.toFixed(2)}ms`
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: 'Template created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Template creation API request failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    // Handle validation errors
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

    // Handle authentication errors
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

    // Handle permission errors
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create template'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT /api/sla/templates - Update an existing SLA template (not standard REST, but included for flexibility)
export async function PUT(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Template update API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check update permissions
    const hasPermission = await checkUserPermissions(user, 'update');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to update templates'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template ID is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate updates
    const validatedUpdates = slaTemplateSchema.partial().parse(updates);

    // Update template
    const result = await slaService.updateTemplate(id, validatedUpdates);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template updated successfully', {
      requestId,
      templateId: id,
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
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    // Handle validation errors
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

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
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

// DELETE /api/sla/templates - Delete an SLA template (not standard REST, but included for completeness)
export async function DELETE(request: NextRequest) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();

  try {
    logger.info('Template deletion API request started', { requestId });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check delete permissions
    const hasPermission = await checkUserPermissions(user, 'delete');
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to delete templates'
        },
        timestamp: new Date().toISOString()
      }, { status: 403 });
    }

    // Parse request body for template ID
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template ID is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Delete template
    const result = await slaService.deleteTemplate(id);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete template');
    }

    const duration = performance.now() - startTime;
    logger.info('Template deleted successfully', {
      requestId,
      templateId: id,
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
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration.toFixed(2)}ms`
    });

    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
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