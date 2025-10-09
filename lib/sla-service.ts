// Service Level Agreement (SLA) Service Layer
// Handles all SLA-related business logic including AI-powered generation

import { supabase } from './supabase';
import { createSupabaseFromRequest } from './supabase-server';
import {
  ServiceAgreement,
  SLATemplate,
  SLAClause,
  SLATemplateVariables,
  SLAGenerationRequest,
  SLAGenerationResponse,
  SLAStatus,
  PerformanceMetricType,
  ESignatureRequest,
  ESignatureResponse,
  BreachCalculation
} from './sla-types';

export class SLAService {
  // Template Management
  static async getSLATemplates(industry?: string): Promise<SLATemplate[]> {
    let query = supabase
      .from('sla_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getSLATemplate(id: string): Promise<SLATemplate | null> {
    const { data, error } = await supabase
      .from('sla_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createSLATemplate(template: Omit<SLATemplate, 'id' | 'created_at' | 'updated_at'>): Promise<SLATemplate> {
    const { data, error } = await supabase
      .from('sla_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSLATemplate(id: string, updates: Partial<SLATemplate>): Promise<SLATemplate> {
    const { data, error } = await supabase
      .from('sla_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteSLATemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('sla_templates')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // Clause Library Management
  static async getSLAClauses(category?: string, industry?: string): Promise<SLAClause[]> {
    let query = supabase
      .from('sla_clause_library')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }
    if (industry) {
      query = query.eq('industry', industry);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async searchSLAClauses(query: string, category?: string, industry?: string): Promise<SLAClause[]> {
    const searchPattern = `%${query}%`;
    let supabaseQuery = supabase
      .from('sla_clause_library')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.${searchPattern},content.ilike.${searchPattern},clause_key.ilike.${searchPattern}`);

    if (category) {
      supabaseQuery = supabaseQuery.eq('category', category);
    }
    if (industry) {
      supabaseQuery = supabaseQuery.eq('industry', industry);
    }

    const { data, error } = await supabaseQuery.order('title');
    if (error) throw error;
    return data || [];
  }

  static async createSLAClause(clause: Omit<SLAClause, 'id' | 'created_at' | 'updated_at'>): Promise<SLAClause> {
    const { data, error } = await supabase
      .from('sla_clause_library')
      .insert(clause)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Enhanced SLA Generation with improved variable mapping and automation support
  static async generateSLAWithAI(request: SLAGenerationRequest, authenticatedSupabase?: any): Promise<SLAGenerationResponse> {
    try {
      // Get quote and client data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (*)
        `)
        .eq('id', request.quote_id)
        .single();

      if (quoteError || !quote) {
        return { success: false, error: 'Quote not found' };
      }

      // Get template if specified
      let template: SLATemplate | null = null;
      if (request.template_id) {
        template = await this.getSLATemplate(request.template_id);
      } else {
        // Get default template for software development
        const templates = await this.getSLATemplates('software_development');
        template = templates[0] || null;
      }

      // Prepare variables for SLA generation
      const variables: SLATemplateVariables = {
        // Client Information
        client_name: quote.clients.name,
        client_company: quote.clients.company,
        client_email: quote.clients.email,
        client_address: quote.clients.billing_address,

        // Service Provider Information (from company settings)
        provider_company: 'INNOVATION IMPERIAL',
        provider_email: 'info@innovationimperial.com',

        // Service Details
        service_description: 'Custom software development services',
        project_scope: `Development of online store as per specification document`,

        // Financial Terms
        total_contract_value: quote.total_incl_vat,
        deposit_percentage: quote.deposit_percentage || 40,
        deposit_amount: quote.deposit_amount || 0,
        balance_percentage: 100 - (quote.deposit_percentage || 40),
        balance_amount: quote.balance_remaining || 0,

        // Performance Metrics
        uptime_guarantee: request.performance_requirements?.uptime || template?.default_uptime_percentage || 99.5,
        response_time_hours: request.performance_requirements?.response_time || template?.default_response_time_hours || 24,
        resolution_time_hours: request.performance_requirements?.resolution_time || template?.default_resolution_time_hours || 72,

        // Timeline
        project_start_date: new Date().toISOString().split('T')[0],
        warranty_months: 3,

        // Legal Terms
        governing_law: template?.governing_law || 'South African Law',
        jurisdiction: template?.legal_jurisdiction || 'South Africa',

        // Custom requirements
        ...request.client_requirements && {
          custom_requirements: request.client_requirements
        }
      };

      // Use CopilotKit MCP for AI-powered content generation
      // const aiPrompt = this.buildAIPrompt(request, variables);

      // For now, we'll use a structured approach since we don't have direct MCP access
      // In a real implementation, this would call the CopilotKit MCP server
      const generatedContent = await this.generateSLAStructure(request, variables);

      // Get current authenticated user using the authenticated client if provided
      const client = authenticatedSupabase || supabase;
      const { data: { user }, error: userError } = await client.auth.getUser();

      // For testing purposes, use a fallback test user ID if not authenticated
      let currentUserId: string;
      if (userError || !user) {
        console.log('No authenticated user found, using test user ID for SLA generation');
        // Use a test user ID - in production this should be replaced with proper authentication
        currentUserId = '550e8400-e29b-41d4-a716-446655440000'; // Test UUID
      } else {
        currentUserId = user.id;
      }

      // Create the service agreement
      const serviceAgreement: Omit<ServiceAgreement, 'id' | 'created_at' | 'updated_at' | 'agreement_number'> = {
        quote_id: request.quote_id,
        client_id: quote.client_id,
        sla_template_id: template?.id,
        agreement_content: generatedContent as Record<string, string | number | boolean>,
        agreement_variables: variables as Record<string, string | number | boolean>,
        uptime_guarantee: variables.uptime_guarantee || 99.5,
        response_time_hours: variables.response_time_hours || 24,
        resolution_time_hours: variables.resolution_time_hours || 72,
        penalty_percentage: 0.5, // Default 0.5% penalty
        penalty_cap_percentage: 10, // Default 10% cap
        status: 'generated',
        requires_signature: true,
        signature_status: 'pending',
        signature_data: {},
        created_by_user_id: currentUserId,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days
      };

      const { data: agreement, error: agreementError } = await supabase
        .from('service_agreements')
        .insert(serviceAgreement)
        .select()
        .single();

      if (agreementError) {
        return { success: false, error: agreementError.message };
      }

      return {
        success: true,
        service_agreement: agreement,
        generated_content: generatedContent as Record<string, string | number | boolean>,
        variables_used: variables
      };

    } catch (error) {
      console.error('Error generating SLA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Build AI prompt for CopilotKit MCP
  private static buildAIPrompt(request: SLAGenerationRequest, variables: SLATemplateVariables): string {
    return `
Generate a comprehensive Service Level Agreement (SLA) for a software development project with the following requirements:

CLIENT INFORMATION:
- Client: ${variables.client_name} (${variables.client_company})
- Email: ${variables.client_email}

SERVICE DETAILS:
- Project: Custom software development (online store)
- Contract Value: ${variables.total_contract_value}
- Deposit: ${variables.deposit_percentage}% (${variables.deposit_amount})

PERFORMANCE REQUIREMENTS:
- Uptime Guarantee: ${variables.uptime_guarantee}%
- Response Time: ${variables.response_time_hours} hours
- Resolution Time: ${variables.resolution_time_hours} hours

LEGAL FRAMEWORK:
- Governing Law: ${variables.governing_law}
- Jurisdiction: ${variables.jurisdiction}

${request.client_requirements ? `ADDITIONAL REQUIREMENTS: ${request.client_requirements}` : ''}

${request.industry_specifics ? `INDUSTRY SPECIFICS: ${request.industry_specifics}` : ''}

Please generate a professional SLA that includes:
1. Service description and scope
2. Performance metrics and guarantees
3. Support and maintenance terms
4. Payment terms integration
5. Intellectual property rights
6. Liability and force majeure clauses
7. Termination conditions
8. Dispute resolution
9. Signatures section

Ensure all placeholders are properly filled and the document follows legal best practices for software development agreements.
    `.trim();
  }

  // Generate SLA structure (fallback when AI is not available)
  private static async generateSLAStructure(
    request: SLAGenerationRequest,
    variables: SLATemplateVariables
  ): Promise<Record<string, string | number | boolean | Record<string, unknown>>> {
    // Get relevant clauses from the library
    // const clauses = await this.getSLAClauses('service_delivery', 'software_development');

    return {
      title: 'Service Level Agreement',
      effective_date: new Date().toISOString().split('T')[0],
      parties: {
        service_provider: {
          name: 'INNOVATION IMPERIAL',
          role: 'Service Provider'
        },
        client: {
          name: variables.client_company || variables.client_name,
          contact_person: variables.client_name,
          email: variables.client_email,
          role: 'Client'
        }
      },
      sections: {
        service_description: {
          title: 'Service Description',
          content: variables.service_description || 'Custom software development services including design, development, testing, and deployment.'
        },
        project_scope: {
          title: 'Project Scope',
          content: `All work will be performed in accordance with the approved specification document and quote #${request.quote_id}.`
        },
        performance_metrics: {
          title: 'Performance Metrics',
          uptime: {
            guarantee: `${variables.uptime_guarantee}%`,
            measurement: 'Monthly availability calculation',
            penalty: `${variables.penalty_percentage}% of monthly fees per 0.1% below guarantee`
          },
          response_time: {
            guarantee: `${variables.response_time_hours} hours`,
            measurement: 'Time from issue report to initial response',
            penalty: `${variables.penalty_percentage}% of monthly fees per hour over guarantee`
          },
          resolution_time: {
            guarantee: `${variables.resolution_time_hours} hours`,
            measurement: 'Time from issue report to resolution',
            penalty: `${variables.penalty_percentage}% of monthly fees per hour over guarantee`
          }
        },
        payment_terms: {
          title: 'Payment Terms',
          content: `Payment terms follow the agreed quote structure with ${variables.deposit_percentage}% deposit due upon project initiation and remaining ${variables.balance_percentage}% due upon completion.`,
          deposit_amount: variables.deposit_amount,
          balance_amount: variables.balance_amount
        },
        support_warranty: {
          title: 'Support and Warranty',
          content: `A ${variables.warranty_months} month support and warranty period is included, covering technical maintenance and bug fixes.`,
          business_hours: 'Monday to Friday, 9:00 AM to 5:00 PM SAST',
          emergency_contact: '24/7 emergency support for critical issues'
        },
        intellectual_property: {
          title: 'Intellectual Property Rights',
          content: 'Upon full payment, all custom development work and intellectual property rights shall transfer to the Client.',
          third_party_licenses: 'Third-party tools and frameworks remain subject to their respective license terms.'
        },
        liability_force_majeure: {
          title: 'Liability and Force Majeure',
          content: 'Service Provider is indemnified from liability for interruptions caused by third-party infrastructure failures, cyber attacks, or force majeure events.',
          covered_events: [
            'Third-party hosting platform failures',
            'Internet service provider outages',
            'Power grid failures',
            'Cyber attacks on infrastructure',
            'Natural disasters affecting service delivery'
          ]
        },
        termination: {
          title: 'Termination',
          content: 'Either party may terminate this agreement with 30 days written notice.',
          immediate_termination: 'Immediate termination is allowed for material breach or non-payment.'
        },
        governing_law: {
          title: 'Governing Law',
          content: `This agreement is governed by ${variables.governing_law} with jurisdiction in ${variables.jurisdiction}.`
        }
      },
      signatures: {
        service_provider: {
          name: 'Mcmarsh Dzwimbu',
          title: 'Chief Operating Officer',
          company: 'INNOVATION IMPERIAL',
          signature_placeholder: true,
          date_placeholder: true
        },
        client: {
          name: variables.client_name,
          title: 'Authorized Signatory',
          company: variables.client_company,
          signature_placeholder: true,
          date_placeholder: true
        }
      },
      appendices: {
        definitions: {
          'Service Availability': 'The percentage of time the service is operational and accessible.',
          'Response Time': 'Time from issue report to initial acknowledgment.',
          'Resolution Time': 'Time from issue report to confirmed resolution.',
          'Business Hours': 'Monday to Friday, 9:00 AM to 5:00 PM SAST, excluding public holidays.'
        },
        sla_calculations: {
          'Uptime Calculation': 'Total operational time divided by total time in measurement period.',
          'Penalty Calculation': `${variables.penalty_percentage}% of monthly service fees per SLA breach.`,
          'Penalty Cap': `Maximum ${variables.penalty_cap_percentage}% of monthly service fees.`
        }
      }
    };
  }

  // Service Agreement Management
  static async getServiceAgreement(id: string): Promise<ServiceAgreement | null> {
    const { data, error } = await supabase
      .from('service_agreements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getServiceAgreementsByQuote(quoteId: string): Promise<ServiceAgreement[]> {
    const { data, error } = await supabase
      .from('service_agreements')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateServiceAgreementStatus(id: string, status: SLAStatus): Promise<ServiceAgreement> {
    const updates: Partial<ServiceAgreement> = {
      status,
      updated_at: new Date().toISOString()
    };

    // Set timestamp based on status
    switch (status) {
      case 'sent':
        updates.sent_at = new Date().toISOString();
        break;
      case 'accepted':
        updates.accepted_at = new Date().toISOString();
        break;
    }

    const { data, error } = await supabase
      .from('service_agreements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // E-signature functionality
  static async requestESignature(request: ESignatureRequest): Promise<ESignatureResponse> {
    try {
      // Update agreement with signature request
      const { error } = await supabase
        .from('service_agreements')
        .update({
          signature_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.agreement_id);

      if (error) {
        return { success: false, error: error.message };
      }

      // In a real implementation, this would integrate with an e-signature service
      // For now, we'll simulate the process
      return {
        success: true,
        signature_id: `sig_${Date.now()}`,
        signed_at: new Date().toISOString(),
        verification_url: `/api/sla/${request.agreement_id}/verify-signature`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Performance tracking
  static async recordPerformanceMetric(
    agreementId: string,
    metricType: PerformanceMetricType,
    targetValue: number,
    actualValue: number,
    measurementUnit: string,
    notes?: string,
    authenticatedSupabase?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('sla_performance_tracking')
      .insert({
        service_agreement_id: agreementId,
        metric_type: metricType,
        metric_date: new Date().toISOString().split('T')[0],
        target_value: targetValue,
        actual_value: actualValue,
        measurement_unit: measurementUnit,
        is_breach: actualValue < targetValue,
        notes,
        recorded_by_user_id: '550e8400-e29b-41d4-a716-446655440000' // Test user ID for development
      });

    if (error) throw error;
  }

  // Breach incident management
  static async reportBreachIncident(
    agreementId: string,
    metricType: PerformanceMetricType,
    description: string,
    penaltyAmount?: number,
    authenticatedSupabase?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('sla_breach_incidents')
      .insert({
        service_agreement_id: agreementId,
        incident_date: new Date().toISOString().split('T')[0],
        metric_type: metricType,
        description,
        penalty_amount: penaltyAmount || 0,
        resolution_status: 'open',
        reported_by_user_id: '550e8400-e29b-41d4-a716-446655440000' // Test user ID for development
      });

    if (error) throw error;
  }

  // Automated SLA Generation for status change triggers
  static async generateSLAAutomatically(quoteId: string, triggerSource: string = 'status_change'): Promise<SLAGenerationResponse> {
    try {
      // Get quote with full details
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (*)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError || !quote) {
        return { success: false, error: 'Quote not found' };
      }

      // Verify quote is in accepted status
      if (quote.status !== 'accepted') {
        return { success: false, error: 'Quote must be in accepted status' };
      }

      // Check if SLA already exists
      const existingSLAs = await this.getServiceAgreementsByQuote(quoteId);
      if (existingSLAs.length > 0) {
        return {
          success: false,
          error: 'SLA already exists for this quote',
          service_agreement: existingSLAs[0]
        };
      }

      // Get default template for software development
      const templates = await this.getSLATemplates('software_development');
      const defaultTemplate = templates.find(t => t.is_active) || templates[0];

      // Enhanced variable mapping with comprehensive data extraction
      const variables = await this.buildComprehensiveSLAVariables(quote);

      // Generate SLA content
      const generatedContent = await this.generateSLAStructure(
        {
          quote_id: quoteId,
          template_id: defaultTemplate?.id,
          performance_requirements: {
            uptime: 99.5,
            response_time: 24,
            resolution_time: 72
          }
        },
        variables
      );

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      const currentUserId = user?.id || '550e8400-e29b-41d4-a716-446655440000';

      // Create the service agreement
      const serviceAgreement: Omit<ServiceAgreement, 'id' | 'created_at' | 'updated_at' | 'agreement_number'> = {
        quote_id: quoteId,
        client_id: quote.client_id,
        sla_template_id: defaultTemplate?.id,
        agreement_content: generatedContent as Record<string, string | number | boolean>,
        agreement_variables: variables as Record<string, string | number | boolean>,
        uptime_guarantee: variables.uptime_guarantee || 99.5,
        response_time_hours: variables.response_time_hours || 24,
        resolution_time_hours: variables.resolution_time_hours || 72,
        penalty_percentage: 0.5,
        penalty_cap_percentage: 10,
        status: 'generated',
        requires_signature: true,
        signature_status: 'pending',
        signature_data: {},
        created_by_user_id: currentUserId,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_generated: true,
        automation_trigger: triggerSource
      };

      const { data: agreement, error: agreementError } = await supabase
        .from('service_agreements')
        .insert(serviceAgreement)
        .select()
        .single();

      if (agreementError) {
        return { success: false, error: agreementError.message };
      }

      return {
        success: true,
        service_agreement: agreement,
        generated_content: generatedContent as Record<string, string | number | boolean>,
        variables_used: variables
      };

    } catch (error) {
      console.error('Error in automated SLA generation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Enhanced variable mapping with comprehensive data extraction
  private static async buildComprehensiveSLAVariables(quote: any): Promise<SLATemplateVariables> {
    // Get client data
    const client = quote.clients;

    // Extract project details from quote items
    const projectItems = quote.quote_items || [];
    const projectDescription = projectItems
      .map((item: any) => item.item?.description || '')
      .filter(Boolean)
      .join(', ') || 'Custom software development project';

    // Calculate project timeline (estimate based on project size)
    const projectValue = quote.total_incl_vat || 0;
    const estimatedTimelineDays = Math.max(3, Math.min(90, Math.floor(projectValue / 10000))); // 3-90 days based on value

    return {
      // Client Information
      client_name: client?.name || '',
      client_company: client?.company || '',
      client_email: client?.email || '',
      client_address: client?.billing_address || '',

      // Service Provider Information
      provider_company: 'INNOVATION IMPERIAL',
      provider_email: 'info@innovationimperial.com',

      // Service Details
      service_description: `Custom software development services for: ${projectDescription}`,
      project_scope: `Development project as specified in quote ${quote.quote_number} with total value of R${projectValue.toLocaleString()}`,

      // Financial Terms
      total_contract_value: projectValue,
      deposit_percentage: quote.deposit_percentage || 40,
      deposit_amount: quote.deposit_amount || 0,
      balance_percentage: 100 - (quote.deposit_percentage || 40),
      balance_amount: quote.balance_remaining || 0,

      // Performance Metrics
      uptime_guarantee: 99.5,
      response_time_hours: 24,
      resolution_time_hours: 72,

      // Timeline
      project_start_date: new Date().toISOString().split('T')[0],
      project_end_date: new Date(Date.now() + estimatedTimelineDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warranty_months: 3,

      // Legal Terms
      governing_law: 'South African Law',
      jurisdiction: 'South Africa',

      // Enhanced project-specific variables
      project_timeline_days: estimatedTimelineDays,
      project_complexity: projectValue > 100000 ? 'enterprise' : projectValue > 50000 ? 'standard' : 'basic',
      support_level: projectValue > 75000 ? 'premium' : 'standard',

      // Quote-specific data
      quote_number: quote.quote_number,
      quote_date: quote.date_issued,
      quote_valid_until: quote.valid_until,

      // Client-specific custom fields
      client_industry: this.inferClientIndustry(client?.company || ''),
      client_size: this.inferClientSize(projectValue),
    };
  }

  // Helper function to infer client industry from company name
  private static inferClientIndustry(companyName: string): string {
    const industryKeywords = {
      'technology': ['tech', 'software', 'digital', 'innovation', 'systems'],
      'finance': ['finance', 'bank', 'investment', 'capital'],
      'healthcare': ['health', 'medical', 'clinic', 'hospital'],
      'retail': ['retail', 'shop', 'store', 'market'],
      'manufacturing': ['manufacturing', 'factory', 'production', 'industrial']
    };

    const lowerName = companyName.toLowerCase();
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  // Helper function to infer client size from project value
  private static inferClientSize(projectValue: number): string {
    if (projectValue > 200000) return 'enterprise';
    if (projectValue > 75000) return 'medium';
    if (projectValue > 25000) return 'small';
    return 'startup';
  }

  // Utility methods
  static replaceTemplateVariables(content: string, variables: SLATemplateVariables): string {
    let processedContent = content;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(placeholder, String(value || ''));
    });

    return processedContent;
  }

  static calculateBreachPenalty(
    monthlyRevenue: number,
    penaltyPercentage: number,
    breachSeverity: number,
    penaltyCapPercentage: number
  ): BreachCalculation {
    const calculatedPenalty = (monthlyRevenue * penaltyPercentage / 100) * breachSeverity;
    const penaltyCap = monthlyRevenue * penaltyCapPercentage / 100;
    const finalPenalty = Math.min(calculatedPenalty, penaltyCap);

    return {
      incident_date: new Date().toISOString().split('T')[0],
      metric_type: 'uptime', // This would be determined by the specific breach
      breach_severity: breachSeverity,
      calculated_penalty: calculatedPenalty,
      penalty_cap_applied: penaltyCap,
      final_penalty_amount: finalPenalty
    };
  }
}