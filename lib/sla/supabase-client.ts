// SLA Supabase Client Extensions
// Enhanced Supabase client with SLA-specific operations and error handling

import {
  createClient,
  SupabaseClient,
  PostgrestResponse,
  PostgrestSingleResponse
} from '@supabase/supabase-js';
import { Database } from '@/types/database'; // Assuming you have a generated Database type
import {
  SLATemplate,
  ServiceAgreement,
  SLATemplateForm,
  SLACreateForm,
  ServiceAgreementStatus,
  PackageType
} from './sla-types';
import { SLAError, SLAErrorHandler, createSLAErrorContext } from './error-handler';
import { logger } from './logger';
import { slaConfig } from './config';

// ========================================
// Database Table Types
// ========================================

export interface SLATemplateRow {
  id: string;
  name: string;
  description: string;
  package_type: PackageType;
  content: string;
  variables: any; // JSON
  default_metrics: any; // JSON
  default_penalties: any; // JSON
  is_active: boolean;
  is_customizable: boolean;
  requires_legal_review: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  version: number;
  parent_template_id?: string;
}

export interface ServiceAgreementRow {
  id: string;
  client_id: string;
  quote_id?: string;
  template_id: string;
  title: string;
  description: string;
  agreement_number: string;
  version: number;
  final_content: string;
  substituted_variables: any; // JSON
  performance_metrics: any; // JSON
  penalty_structure: any; // JSON
  compliance_requirements: any; // JSON
  status: ServiceAgreementStatus;
  effective_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  last_modified_by_user_id: string;
  template_version_used: number;
  generated_from_draft: boolean;
  user_edits?: string;
  package_type: PackageType;
  total_value?: number;
  signatures?: any; // JSON
}

// ========================================
// Enhanced Supabase Client for SLA
// ========================================

export class SLASupabaseClient {
  private client: SupabaseClient<Database>;
  private errorHandler: SLAErrorHandler;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient<Database>(supabaseUrl, supabaseKey);
    this.errorHandler = SLAErrorHandler.getInstance();
  }

  // ========================================
  // Template Operations
  // ========================================

  /**
   * Get SLA templates with optional filtering
   */
  async getTemplates(filters?: {
    package_type?: PackageType;
    is_active?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: SLATemplate[]; total: number }> {
    const context = createSLAErrorContext('getTemplates', {
      metadata: { filters }
    });

    try {
      let query = this.client
        .from('sla_templates')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.package_type) {
        query = query.eq('package_type', filters.package_type);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      // Order by usage count and created date
      query = query.order('usage_count', { ascending: false })
                    .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      // Transform rows to SLATemplate objects
      const templates: SLATemplate[] = (data || []).map(this.mapRowToTemplate);

      logger.info('template', 'getTemplates', `Retrieved ${templates.length} templates`, {
        metadata: { count: templates.length, total: count || 0, filters }
      });

      return { data: templates, total: count || 0 };
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Get a specific SLA template by ID
   */
  async getTemplate(id: string): Promise<SLATemplate> {
    const context = createSLAErrorContext('getTemplate', { templateId: id });

    try {
      const { data, error } = await this.client
        .from('sla_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      if (!data) {
        throw SLAError.notFound('SLA template', id);
      }

      const template = this.mapRowToTemplate(data);

      logger.info('template', 'getTemplate', `Retrieved template: ${template.name}`, {
        templateId: id,
        metadata: { templateName: template.name, packageType: template.package_type }
      });

      return template;
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Create a new SLA template
   */
  async createTemplate(templateData: SLATemplateForm, userId: string): Promise<SLATemplate> {
    const context = createSLAErrorContext('createTemplate', {
      userId,
      metadata: { templateName: templateData.name, packageType: templateData.package_type }
    });

    try {
      const templateRow = {
        name: templateData.name,
        description: templateData.description,
        package_type: templateData.package_type,
        content: templateData.content,
        variables: templateData.variables,
        default_metrics: templateData.default_metrics,
        default_penalties: templateData.default_penalties,
        is_active: templateData.is_active,
        is_customizable: templateData.is_customizable,
        requires_legal_review: templateData.requires_legal_review,
        created_by_user_id: userId,
        version: 1,
        usage_count: 0
      };

      const { data, error } = await this.client
        .from('sla_templates')
        .insert(templateRow)
        .select()
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      if (!data) {
        throw SLAError.generation('template creation', 'No data returned from insert operation');
      }

      const template = this.mapRowToTemplate(data);

      logger.info('template', 'createTemplate', `Created template: ${template.name}`, {
        userId,
        templateId: template.id,
        metadata: { templateName: template.name, packageType: template.package_type }
      });

      return template;
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Update an existing SLA template
   */
  async updateTemplate(id: string, updates: Partial<SLATemplateForm>, userId: string): Promise<SLATemplate> {
    const context = createSLAErrorContext('updateTemplate', {
      templateId: id,
      userId,
      metadata: { updates: Object.keys(updates) }
    });

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.client
        .from('sla_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      if (!data) {
        throw SLAError.notFound('SLA template', id);
      }

      const template = this.mapRowToTemplate(data);

      logger.info('template', 'updateTemplate', `Updated template: ${template.name}`, {
        templateId: id,
        userId,
        metadata: { templateName: template.name, updatedFields: Object.keys(updates) }
      });

      return template;
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Delete a template (soft delete by setting is_active to false)
   */
  async deleteTemplate(id: string, userId: string): Promise<void> {
    const context = createSLAErrorContext('deleteTemplate', {
      templateId: id,
      userId
    });

    try {
      const { error } = await this.client
        .from('sla_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      logger.info('template', 'deleteTemplate', `Deleted template: ${id}`, {
        templateId: id,
        userId
      });
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Increment template usage count
   */
  async incrementTemplateUsage(id: string): Promise<void> {
    const context = createSLAErrorContext('incrementTemplateUsage', {
      templateId: id
    });

    try {
      const { error } = await this.client.rpc('increment_sla_template_usage', {
        template_id: id
      });

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      logger.debug('template', 'incrementTemplateUsage', `Incremented usage for template: ${id}`, {
        templateId: id
      });
    } catch (error) {
      // Don't throw error for usage tracking - it's not critical
      logger.warn('template', 'incrementTemplateUsage', `Failed to increment usage for template: ${id}`, undefined, {
        templateId: id
      });
    }
  }

  // ========================================
  // Service Agreement Operations
  // ========================================

  /**
   * Get service agreements with filtering
   */
  async getAgreements(filters?: {
    client_id?: string;
    status?: ServiceAgreementStatus;
    package_type?: PackageType;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ServiceAgreement[]; total: number }> {
    const context = createSLAErrorContext('getAgreements', {
      clientId: filters?.client_id,
      metadata: { filters }
    });

    try {
      let query = this.client
        .from('service_agreements')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.package_type) {
        query = query.eq('package_type', filters.package_type);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      // Order by created date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      // Transform rows to ServiceAgreement objects
      const agreements: ServiceAgreement[] = (data || []).map(this.mapRowToAgreement);

      logger.info('agreement', 'getAgreements', `Retrieved ${agreements.length} agreements`, {
        metadata: { count: agreements.length, total: count || 0, filters }
      });

      return { data: agreements, total: count || 0 };
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Get a specific service agreement by ID
   */
  async getAgreement(id: string): Promise<ServiceAgreement> {
    const context = createSLAErrorContext('getAgreement', { agreementId: id });

    try {
      const { data, error } = await this.client
        .from('service_agreements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      if (!data) {
        throw SLAError.notFound('Service agreement', id);
      }

      const agreement = this.mapRowToAgreement(data);

      logger.info('agreement', 'getAgreement', `Retrieved agreement: ${agreement.title}`, {
        agreementId: id,
        clientId: agreement.client_id,
        metadata: { agreementTitle: agreement.title, status: agreement.status }
      });

      return agreement;
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  /**
   * Create a new service agreement
   */
  async createAgreement(agreementData: SLACreateForm, userId: string): Promise<ServiceAgreement> {
    const context = createSLAErrorContext('createAgreement', {
      userId,
      clientId: agreementData.client_id,
      templateId: agreementData.template_id,
      metadata: { agreementTitle: agreementData.title, packageType: agreementData.package_type }
    });

    try {
      // Generate agreement number
      const agreementNumber = await this.generateAgreementNumber();

      const agreementRow = {
        client_id: agreementData.client_id,
        template_id: agreementData.template_id,
        title: agreementData.title,
        description: agreementData.description,
        agreement_number: agreementNumber,
        version: 1,
        performance_metrics: agreementData.performance_metrics,
        status: 'draft' as ServiceAgreementStatus,
        effective_date: agreementData.effective_date.toISOString(),
        expiry_date: agreementData.expiry_date.toISOString(),
        created_by_user_id: userId,
        last_modified_by_user_id: userId,
        template_version_used: slaConfig.getSLASettings().default_template_version,
        generated_from_draft: false,
        package_type: agreementData.package_type
      };

      const { data, error } = await this.client
        .from('service_agreements')
        .insert(agreementRow)
        .select()
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError(error, context);
      }

      if (!data) {
        throw SLAError.generation('agreement creation', 'No data returned from insert operation');
      }

      const agreement = this.mapRowToAgreement(data);

      logger.info('agreement', 'createAgreement', `Created agreement: ${agreement.title}`, {
        userId,
        agreementId: agreement.id,
        clientId: agreement.client_id,
        templateId: agreement.template_id,
        metadata: { agreementTitle: agreement.title, agreementNumber: agreement.agreement_number }
      });

      return agreement;
    } catch (error) {
      if (error instanceof SLAError) {
        throw error;
      }
      throw this.errorHandler.handleError(error, context);
    }
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Generate a unique agreement number
   */
  private async generateAgreementNumber(): Promise<string> {
    const prefix = 'SLA';
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();

    return `${prefix}-${year}-${timestamp}`;
  }

  /**
   * Map database row to SLATemplate object
   */
  private mapRowToTemplate(row: SLATemplateRow): SLATemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      package_type: row.package_type,
      content: row.content,
      variables: row.variables || [],
      default_metrics: row.default_metrics || {},
      default_penalties: row.default_penalties || {},
      is_active: row.is_active,
      is_customizable: row.is_customizable,
      requires_legal_review: row.requires_legal_review,
      created_by_user_id: row.created_by_user_id,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      usage_count: row.usage_count,
      version: row.version,
      parent_template_id: row.parent_template_id
    };
  }

  /**
   * Map database row to ServiceAgreement object
   */
  private mapRowToAgreement(row: ServiceAgreementRow): ServiceAgreement {
    return {
      id: row.id,
      client_id: row.client_id,
      quote_id: row.quote_id,
      template_id: row.template_id,
      title: row.title,
      description: row.description,
      agreement_number: row.agreement_number,
      version: row.version,
      final_content: row.final_content,
      substituted_variables: row.substituted_variables || [],
      performance_metrics: row.performance_metrics || {},
      penalty_structure: row.penalty_structure || {},
      compliance_requirements: row.compliance_requirements || [],
      status: row.status,
      effective_date: new Date(row.effective_date),
      expiry_date: new Date(row.expiry_date),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by_user_id: row.created_by_user_id,
      last_modified_by_user_id: row.last_modified_by_user_id,
      template_version_used: row.template_version_used,
      generated_from_draft: row.generated_from_draft,
      user_edits: row.user_edits,
      package_type: row.package_type,
      total_value: row.total_value,
      signatures: row.signatures
    };
  }

  // ========================================
  // Health Check
  // ========================================

  /**
   * Check database connectivity
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
    try {
      const { data, error } = await this.client
        .from('sla_templates')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      return { status: 'healthy', message: 'SLA database connection successful' };
    } catch (error) {
      logger.error('sla', 'healthCheck', 'SLA database health check failed', error as Error);
      return { status: 'unhealthy', message: 'SLA database connection failed' };
    }
  }
}

// ========================================
// Create SLA Supabase Client Instance
// ========================================

export function createSLASupabaseClient(): SLASupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw SLAError.configuration('supabase', 'Supabase URL and key are required');
  }

  return new SLASupabaseClient(supabaseUrl, supabaseKey);
}

// Export singleton instance
export const slaSupabase = createSLASupabaseClient();