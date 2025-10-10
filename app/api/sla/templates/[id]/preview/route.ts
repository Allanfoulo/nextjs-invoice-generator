import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { slaService } from '@/lib/sla/sla-service';
import { variableMapper } from '@/lib/sla/variable-mapper';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Template Preview API Endpoint
 *
 * Handles real-time preview generation for SLA templates with variable substitution.
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

    // All authenticated users can generate previews
    return true;
  } catch (error) {
    logger.error('Permission check failed', { error, userId: user.id });
    return false;
  }
}

// POST /api/sla/templates/[id]/preview - Generate template preview
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = performance.now();
  const requestId = crypto.randomUUID();
  const { id } = params;

  try {
    logger.info('Template preview API request started', { requestId, id });

    // Get authenticated user
    const user = await getAuthenticatedUser();

    // Check read permissions
    const hasPermission = await checkUserPermissions(user);
    if (!hasPermission) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to preview template'
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
    const { variables, quoteData } = body;

    // Validate variables
    if (!variables || typeof variables !== 'object') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Variables object is required'
        },
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get template
    const templateResult = await slaService.getTemplate(id);
    if (!templateResult.success || !templateResult.data) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found'
        },
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const template = templateResult.data;

    try {
      let previewContent: string;
      let substitutions: any[];

      if (quoteData) {
        // Use variable mapper for enhanced preview with quote data
        const extractedData = variableMapper.extractVariablesFromQuote(
          quoteData.quote,
          quoteData.client,
          quoteData.companySettings,
          quoteData.additionalContext || {}
        );

        previewContent = variableMapper.generatePreview(template, extractedData, variables);
        substitutions = variableMapper.substituteVariables(template, extractedData, variables);
      } else {
        // Use basic template preview
        previewContent = template.content;
        substitutions = [];

        // Replace variables with provided values
        for (const [variableName, value] of Object.entries(variables)) {
          const placeholder = `{{${variableName}}}`;
          if (previewContent.includes(placeholder)) {
            previewContent = previewContent.replace(
              new RegExp(placeholder, 'g'),
              String(value || `[${variableName}]`)
            );

            const templateVariable = template.variables.find(v => v.name === variableName);
            if (templateVariable) {
              substitutions.push({
                variable_name: variableName,
                value: value || templateVariable.default_value || `[${variableName}]`,
                data_source: templateVariable.data_source || 'user_input',
                substituted_at: new Date()
              });
            }
          }
        }

        // Replace remaining variables with defaults
        for (const variable of template.variables) {
          const placeholder = `{{${variable.name}}}`;
          if (previewContent.includes(placeholder)) {
            const defaultValue = variable.default_value || `[${variable.display_name}]`;
            previewContent = previewContent.replace(new RegExp(placeholder, 'g'), defaultValue);

            if (!substitutions.find(s => s.variable_name === variable.name)) {
              substitutions.push({
                variable_name: variable.name,
                value: defaultValue,
                data_source: variable.data_source || 'default_value',
                substituted_at: new Date()
              });
            }
          }
        }
      }

      // Validate required variables
      const missingVariables = template.variables
        .filter(v => v.is_required && !variables[v.name] && !substitutions.find(s => s.variable_name === v.name))
        .map(v => v.display_name);

      // Validate variable values
      const validationErrors: string[] = [];
      substitutions.forEach(substitution => {
        const variable = template.variables.find(v => v.name === substitution.variable_name);
        if (variable && variable.validation) {
          const value = substitution.value;

          if (variable.type === 'number' && typeof value === 'number') {
            if (variable.validation.min !== undefined && value < variable.validation.min) {
              validationErrors.push(`${variable.display_name} must be at least ${variable.validation.min}`);
            }
            if (variable.validation.max !== undefined && value > variable.validation.max) {
              validationErrors.push(`${variable.display_name} must be at most ${variable.validation.max}`);
            }
          }

          if (variable.type === 'text' && variable.validation?.pattern) {
            const regex = new RegExp(variable.validation.pattern);
            if (!regex.test(String(value))) {
              validationErrors.push(`${variable.display_name} format is invalid`);
            }
          }

          if (variable.validation?.options && !variable.validation.options.includes(String(value))) {
            validationErrors.push(`${variable.display_name} must be one of: ${variable.validation.options.join(', ')}`);
          }
        }
      });

      const duration = performance.now() - startTime;
      logger.info('Template preview generated successfully', {
        requestId,
        templateId: id,
        substitutionCount: substitutions.length,
        duration: `${duration.toFixed(2)}ms`
      });

      return NextResponse.json({
        success: true,
        data: {
          preview_content: previewContent,
          substituted_variables: substitutions,
          missing_variables: missingVariables,
          validation_errors: validationErrors
        },
        message: 'Preview generated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (previewError) {
      logger.error('Preview generation failed', {
        requestId,
        templateId: id,
        error: previewError instanceof Error ? previewError.message : 'Unknown error'
      });

      throw previewError;
    }

  } catch (error) {
    const duration = performance.now() - startTime;
    logger.error('Template preview API request failed', {
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
        message: 'Failed to generate template preview'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}