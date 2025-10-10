import { createClient } from '@/lib/supabase-client';
import {
  SLATemplate,
  ServiceAgreement,
  PackageType,
  SLATemplateResponse,
  ServiceAgreementResponse,
  SLATemplateListResponse,
  ServiceAgreementListResponse,
  SLAPreviewData,
  VariableMapping,
  slaTemplateSchema,
  serviceAgreementSchema,
  TemplateVariable,
  PerformanceMetrics,
  PenaltyStructure,
  VariableSubstitution
} from './sla-types';
import { logger } from './logger';
import { SLAErrorHandler, SLAError } from './sla-errors';
import { config } from './config';
import { usageTracker } from './usage-tracker';

/**
 * SLA Template Management Service
 *
 * Provides comprehensive template management functionality including:
 * - Template CRUD operations with RLS enforcement
 * - Variable substitution and preview generation
 * - Package-based template filtering
 * - Usage tracking and statistics
 * - Template versioning and cloning
 */
export class SLAService {
  private supabase = createClient();
  private errorHandler = new SLAErrorHandler();

  // ========================================
  // Template Management
  // ========================================

  /**
   * Get all SLA templates with optional filtering
   */
  async getTemplates(options: {
    package_type?: PackageType;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<SLATemplateListResponse> {
    const startTime = performance.now();

    try {
      logger.info('Fetching SLA templates', { options });

      let query = this.supabase
        .from('sla_templates')
        .select(`
          *,
          template_variables (*)
        `);

      // Apply filters
      if (options.package_type) {
        query = query.eq('package_type', options.package_type);
      }

      if (options.is_active !== undefined) {
        query = query.eq('is_active', options.is_active);
      }

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply pagination
      const limit = options.limit || 20;
      const page = options.page || 1;
      const offset = (page - 1) * limit;

      query = query
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: templates, error, count } = await query;

      if (error) {
        throw this.errorHandler.handleDatabaseError('templates fetch', error);
      }

      // Transform database rows to SLATemplate interface
      const transformedTemplates: SLATemplate[] = templates?.map(template =>
        this.transformDatabaseTemplate(template)
      ) || [];

      const duration = performance.now() - startTime;
      logger.info('Templates fetched successfully', {
        count: transformedTemplates.length,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: transformedTemplates,
        pagination: {
          page,
          limit,
          total: count || 0
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to fetch templates', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0 },
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      };
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<SLATemplateResponse> {
    const startTime = performance.now();

    try {
      logger.info('Fetching SLA template', { id });

      const { data: template, error } = await this.supabase
        .from('sla_templates')
        .select(`
          *,
          template_variables (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Template not found'
          };
        }
        throw this.errorHandler.handleDatabaseError('template fetch', error);
      }

      const transformedTemplate = this.transformDatabaseTemplate(template);

      const duration = performance.now() - startTime;
      logger.info('Template fetched successfully', {
        id,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: transformedTemplate
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to fetch template', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template'
      };
    }
  }

  /**
   * Create a new SLA template
   */
  async createTemplate(templateData: Omit<SLATemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'version'>): Promise<SLATemplateResponse> {
    const startTime = performance.now();

    try {
      logger.info('Creating SLA template', { name: templateData.name, package_type: templateData.package_type });

      // Validate input data
      const validatedData = slaTemplateSchema.parse(templateData);

      // Get current user for created_by field
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new SLAError('UNAUTHORIZED', 'User not authenticated');
      }

      // Prepare template data for database
      const dbTemplate = {
        name: validatedData.name,
        description: validatedData.description,
        package_type: validatedData.package_type,
        content: validatedData.content,
        is_active: validatedData.is_active,
        is_customizable: validatedData.is_customizable,
        requires_legal_review: validatedData.requires_legal_review,
        default_metrics: validatedData.default_metrics,
        default_penalties: validatedData.default_penalties,
        created_by_user_id: user.id,
        version: 1,
        parent_template_id: validatedData.parent_template_id || null,
        usage_count: 0
      };

      // Insert template
      const { data: template, error } = await this.supabase
        .from('sla_templates')
        .insert([dbTemplate])
        .select()
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError('template creation', error);
      }

      // Insert template variables
      if (validatedData.variables.length > 0) {
        const variablesData = validatedData.variables.map(variable => ({
          template_id: template.id,
          name: variable.name,
          display_name: variable.display_name,
          type: variable.type,
          default_value: variable.default_value,
          description: variable.description,
          data_source: variable.data_source,
          validation: variable.validation,
          is_required: variable.is_required
        }));

        const { error: variablesError } = await this.supabase
          .from('template_variables')
          .insert(variablesData);

        if (variablesError) {
          // Rollback template creation if variables fail
          await this.supabase
            .from('sla_templates')
            .delete()
            .eq('id', template.id);

          throw this.errorHandler.handleDatabaseError('template variables creation', variablesError);
        }
      }

      // Get complete template with variables
      const { data: completeTemplate, error: fetchError } = await this.supabase
        .from('sla_templates')
        .select(`
          *,
          template_variables (*)
        `)
        .eq('id', template.id)
        .single();

      if (fetchError) {
        throw this.errorHandler.handleDatabaseError('template fetch after creation', fetchError);
      }

      const transformedTemplate = this.transformDatabaseTemplate(completeTemplate);

      const duration = performance.now() - startTime;
      logger.info('Template created successfully', {
        id: template.id,
        name: templateData.name,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: transformedTemplate
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to create template', {
        name: templateData.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create template'
      };
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, updates: Partial<SLATemplate>): Promise<SLATemplateResponse> {
    const startTime = performance.now();

    try {
      logger.info('Updating SLA template', { id });

      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new SLAError('UNAUTHORIZED', 'User not authenticated');
      }

      // Validate updates
      const validatedUpdates = slaTemplateSchema.partial().parse(updates);

      // Prepare update data
      const updateData: any = {
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      };

      // Remove fields that shouldn't be directly updated
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.usage_count;
      delete updateData.created_by_user_id;

      // Update template
      const { data: template, error } = await this.supabase
        .from('sla_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Template not found'
          };
        }
        throw this.errorHandler.handleDatabaseError('template update', error);
      }

      // Update variables if provided
      if (updates.variables) {
        // Delete existing variables
        await this.supabase
          .from('template_variables')
          .delete()
          .eq('template_id', id);

        // Insert new variables
        if (updates.variables.length > 0) {
          const variablesData = updates.variables.map(variable => ({
            template_id: id,
            name: variable.name,
            display_name: variable.display_name,
            type: variable.type,
            default_value: variable.default_value,
            description: variable.description,
            data_source: variable.data_source,
            validation: variable.validation,
            is_required: variable.is_required
          }));

          const { error: variablesError } = await this.supabase
            .from('template_variables')
            .insert(variablesData);

          if (variablesError) {
            throw this.errorHandler.handleDatabaseError('template variables update', variablesError);
          }
        }
      }

      // Get complete updated template
      const { data: completeTemplate, error: fetchError } = await this.supabase
        .from('sla_templates')
        .select(`
          *,
          template_variables (*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        throw this.errorHandler.handleDatabaseError('template fetch after update', fetchError);
      }

      const transformedTemplate = this.transformDatabaseTemplate(completeTemplate);

      const duration = performance.now() - startTime;
      logger.info('Template updated successfully', {
        id,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: transformedTemplate
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to update template', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update template'
      };
    }
  }

  /**
   * Delete a template (soft delete by setting is_active to false)
   */
  async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    const startTime = performance.now();

    try {
      logger.info('Deleting SLA template', { id });

      const { error } = await this.supabase
        .from('sla_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Template not found'
          };
        }
        throw this.errorHandler.handleDatabaseError('template deletion', error);
      }

      const duration = performance.now() - startTime;
      logger.info('Template deleted successfully', {
        id,
        duration: `${duration.toFixed(2)}ms`
      });

      return { success: true };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to delete template', {
        id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete template'
      };
    }
  }

  /**
   * Clone an existing template
   */
  async cloneTemplate(id: string, newName: string, description?: string): Promise<SLATemplateResponse> {
    const startTime = performance.now();

    try {
      logger.info('Cloning SLA template', { id, newName });

      // Get original template
      const originalResult = await this.getTemplate(id);
      if (!originalResult.success || !originalResult.data) {
        return {
          success: false,
          error: originalResult.error || 'Failed to fetch original template'
        };
      }

      const original = originalResult.data;

      // Create cloned template
      const cloneData: Omit<SLATemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'version'> = {
        name: newName,
        description: description || `${original.description} (Clone)`,
        package_type: original.package_type,
        content: original.content,
        variables: original.variables,
        default_metrics: original.default_metrics,
        default_penalties: original.default_penalties,
        is_active: true,
        is_customizable: original.is_customizable,
        requires_legal_review: original.requires_legal_review,
        created_by_user_id: original.created_by_user_id, // Will be overridden in createTemplate
        parent_template_id: original.id
      };

      const result = await this.createTemplate(cloneData);

      const duration = performance.now() - startTime;
      logger.info('Template cloned successfully', {
        originalId: id,
        newId: result.data?.id,
        duration: `${duration.toFixed(2)}ms`
      });

      return result;

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to clone template', {
        id,
        newName,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clone template'
      };
    }
  }

  // ========================================
  // Template Preview and Variable Substitution
  // ========================================

  /**
   * Generate preview of template with variable substitution
   */
  async previewAgreement(
    templateId: string,
    variables: Record<string, any>,
    userEdits?: string
  ): Promise<{
    success: boolean;
    data?: {
      preview_content: string;
      substituted_variables: VariableSubstitution[];
      missing_variables: string[];
      validation_errors: string[];
    };
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      logger.info('Generating agreement preview', { templateId });

      // Get template
      const templateResult = await this.getTemplate(templateId);
      if (!templateResult.success || !templateResult.data) {
        return {
          success: false,
          error: templateResult.error || 'Failed to fetch template'
        };
      }

      const template = templateResult.data;
      const currentTime = new Date();

      // Apply variable substitution
      const substitutionResult = this.performVariableSubstitution(
        template.content,
        template.variables,
        variables
      );

      // Apply user edits if provided
      let finalContent = substitutionResult.content;
      if (userEdits) {
        finalContent = userEdits;
      }

      // Track preview event
      try {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (user) {
          await usageTracker.trackUsageEvent({
            template_id: templateId,
            event_type: 'preview',
            user_id: user.id,
            metadata: {
              variable_count: Object.keys(variables).length,
              has_user_edits: !!userEdits,
              substitution_count: substitutionResult.substitutions.length,
              validation_errors: substitutionResult.validation_errors.length
            }
          });
        }
      } catch (trackingError) {
        // Don't fail the request if tracking fails
        logger.warn('Failed to track preview event', {
          templateId,
          error: trackingError instanceof Error ? trackingError.message : 'Unknown error'
        });
      }

      const duration = performance.now() - startTime;
      logger.info('Agreement preview generated successfully', {
        templateId,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: {
          preview_content: finalContent,
          substituted_variables: substitutionResult.substitutions,
          missing_variables: substitutionResult.missing_variables,
          validation_errors: substitutionResult.validation_errors
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to generate agreement preview', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate preview'
      };
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(): Promise<{
    success: boolean;
    data?: {
      total_templates: number;
      total_agreements_generated: number;
      most_used_template: SLATemplate | null;
      usage_by_package_type: Record<PackageType, number>;
    };
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      logger.info('Fetching template statistics');

      // Get template counts and usage
      const { data: templates, error: templatesError } = await this.supabase
        .from('sla_templates')
        .select('package_type, usage_count');

      if (templatesError) {
        throw this.errorHandler.handleDatabaseError('template stats fetch', templatesError);
      }

      // Get agreement count
      const { count: agreementsCount, error: agreementsError } = await this.supabase
        .from('service_agreements')
        .select('*', { count: 'exact', head: true });

      if (agreementsError) {
        throw this.errorHandler.handleDatabaseError('agreement count fetch', agreementsError);
      }

      // Calculate statistics
      const totalTemplates = templates?.length || 0;
      const totalAgreements = agreementsCount || 0;

      const usageByPackageType: Record<PackageType, number> = {
        ecom_site: 0,
        general_website: 0,
        business_process_systems: 0,
        marketing: 0
      };

      let mostUsedTemplate: SLATemplate | null = null;
      let maxUsage = 0;

      templates?.forEach(template => {
        const packageType = template.package_type as PackageType;
        usageByPackageType[packageType] = (usageByPackageType[packageType] || 0) + (template.usage_count || 0);

        if (template.usage_count > maxUsage) {
          maxUsage = template.usage_count;
          mostUsedTemplate = this.transformDatabaseTemplate(template);
        }
      });

      const duration = performance.now() - startTime;
      logger.info('Template statistics fetched successfully', {
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: {
          total_templates: totalTemplates,
          total_agreements_generated: totalAgreements,
          most_used_template: mostUsedTemplate,
          usage_by_package_type: usageByPackageType
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to fetch template statistics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics'
      };
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Transform database template row to SLATemplate interface
   */
  private transformDatabaseTemplate(dbTemplate: any): SLATemplate {
    return {
      id: dbTemplate.id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      package_type: dbTemplate.package_type,
      content: dbTemplate.content,
      variables: dbTemplate.template_variables?.map((variable: any) => ({
        name: variable.name,
        display_name: variable.display_name,
        type: variable.type,
        default_value: variable.default_value,
        description: variable.description,
        data_source: variable.data_source,
        validation: variable.validation,
        is_required: variable.is_required
      })) || [],
      default_metrics: dbTemplate.default_metrics,
      default_penalties: dbTemplate.default_penalties,
      is_active: dbTemplate.is_active,
      is_customizable: dbTemplate.is_customizable,
      requires_legal_review: dbTemplate.requires_legal_review,
      created_by_user_id: dbTemplate.created_by_user_id,
      created_at: new Date(dbTemplate.created_at),
      updated_at: new Date(dbTemplate.updated_at),
      usage_count: dbTemplate.usage_count || 0,
      version: dbTemplate.version || 1,
      parent_template_id: dbTemplate.parent_template_id
    };
  }

  /**
   * Perform variable substitution in template content
   */
  private performVariableSubstitution(
    content: string,
    templateVariables: TemplateVariable[],
    providedVariables: Record<string, any>
  ): {
    content: string;
    substitutions: VariableSubstitution[];
    missing_variables: string[];
    validation_errors: string[];
  } {
    const substitutions: VariableSubstitution[] = [];
    const missing_variables: string[] = [];
    const validation_errors: string[] = [];
    let processedContent = content;

    // Find all variables in template content
    const contentVarMatches = content.match(/\{\{(\w+)\}\}/g) || [];
    const contentVariables = contentVarMatches.map(match => match.slice(2, -2));

    // Process each variable found in content
    contentVariables.forEach(varName => {
      const templateVar = templateVariables.find(v => v.name === varName);

      if (!templateVar) {
        missing_variables.push(varName);
        return;
      }

      let value = providedVariables[varName];
      const dataSource = providedVariables[varName] ? 'user_input' : templateVar.data_source || 'manual';

      // Use default value if no value provided
      if (value === undefined || value === null) {
        if (templateVar.is_required) {
          missing_variables.push(varName);
          return;
        }
        value = templateVar.default_value;
        dataSource = 'default';
      }

      // Validate the value
      if (templateVar.validation && value !== undefined && value !== null) {
        const validationError = this.validateVariableValue(value, templateVar);
        if (validationError) {
          validation_errors.push(`${varName}: ${validationError}`);
        }
      }

      // Perform substitution
      const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value));

      // Record substitution
      substitutions.push({
        variable_name: varName,
        value,
        data_source: dataSource,
        substituted_at: new Date()
      });
    });

    return {
      content: processedContent,
      substitutions,
      missing_variables,
      validation_errors
    };
  }

  /**
   * Validate a variable value against its validation rules
   */
  private validateVariableValue(value: any, variable: TemplateVariable): string | null {
    if (!variable.validation) {
      return null;
    }

    const { min, max, pattern, options } = variable.validation;

    // Type-specific validation
    if (variable.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return 'Value must be a number';
      }
      if (min !== undefined && numValue < min) {
        return `Value must be at least ${min}`;
      }
      if (max !== undefined && numValue > max) {
        return `Value must be at most ${max}`;
      }
    }

    // Pattern validation
    if (pattern && typeof value === 'string') {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return 'Value does not match required pattern';
      }
    }

    // Options validation
    if (options && options.length > 0) {
      if (!options.includes(String(value))) {
        return `Value must be one of: ${options.join(', ')}`;
      }
    }

    return null;
  }
}

// Export singleton instance
export const slaService = new SLAService();