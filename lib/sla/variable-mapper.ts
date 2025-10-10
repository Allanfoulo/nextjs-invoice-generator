import { Quote, Client, Item, CompanySettings } from '@/lib/invoice-types';
import {
  SLATemplate,
  TemplateVariable,
  VariableMapping,
  VariableSubstitution,
  PackageType
} from '@/lib/sla/sla-types';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';
import { packageDetector } from './package-detector';

/**
 * Variable Mapper Service
 *
 * Handles extraction and mapping of variables from quote data for use in SLA templates.
 * Supports intelligent field mapping, package type detection, and variable substitution.
 */

export class VariableMapper {
  private errorHandler = new SLAErrorHandler();

  // ========================================
  // Variable Field Mapping Configuration
  // ========================================

  private readonly QUOTE_FIELD_MAPPINGS: Record<string, string[]> = {
    // Client Information
    'client_name': ['client.name', 'client.company'],
    'client_company': ['client.company'],
    'client_email': ['client.email'],
    'client_phone': ['client.phone'],
    'client_billing_address': ['client.billingAddress'],
    'client_delivery_address': ['client.deliveryAddress'],
    'client_vat_number': ['client.vatNumber'],

    // Quote Information
    'quote_number': ['quoteNumber'],
    'quote_date': ['dateIssued'],
    'valid_until': ['validUntil'],
    'subtotal_excl_vat': ['subtotalExclVat'],
    'vat_amount': ['vatAmount'],
    'total_incl_vat': ['totalInclVat'],
    'deposit_percentage': ['depositPercentage'],
    'deposit_amount': ['depositAmount'],
    'balance_remaining': ['balanceRemaining'],

    // Project Information
    'project_title': ['client.name', 'client.company'],
    'project_description': ['notes'],
    'project_value': ['totalInclVat'],
    'project_duration': ['estimated_duration'],

    // Company Information
    'company_name': ['companySettings.companyName'],
    'company_address': ['companySettings.address'],
    'company_email': ['companySettings.email'],
    'company_phone': ['companySettings.phone'],
    'company_vat_percentage': ['companySettings.vatPercentage'],

    // Technical Specifications
    'domain_name': ['domain', 'website_url'],
    'hosting_platform': ['hosting_provider'],
    'website_type': ['website_type'],
    'features': ['features'],
    'pages_count': ['pages'],
    'products_count': ['products'],
    'users_expected': ['expected_users'],

    // Service Level Requirements
    'uptime_requirement': ['uptime_target'],
    'response_time_requirement': ['response_time_hours'],
    'resolution_time_requirement': ['resolution_time_hours'],
    'support_hours': ['support_hours'],
    'maintenance_window': ['maintenance_window'],

    // Compliance and Security
    'compliance_requirements': ['compliance_frameworks'],
    'security_requirements': ['security_level'],
    'data_protection_level': ['data_protection'],
    'backup_frequency': ['backup_frequency'],
    'retention_period': ['data_retention_days']
  };

  private readonly PACKAGE_TYPE_PATTERNS = {
    'ecom_site': [
      'ecommerce', 'e-commerce', 'online store', 'shopping cart', 'product catalog',
      'payment gateway', 'checkout', 'products', 'inventory', 'woocommerce', 'shopify'
    ],
    'general_website': [
      'website', 'web site', 'portfolio', 'brochure', 'informational', 'blog',
      'corporate', 'business website', 'landing page', 'company website'
    ],
    'business_process_systems': [
      'crm', 'erp', 'business process', 'workflow', 'automation', 'system',
      'management system', 'dashboard', 'reporting', 'analytics', 'database'
    ],
    'marketing': [
      'marketing', 'campaign', 'lead generation', 'seo', 'sem', 'social media',
      'email marketing', 'content marketing', 'digital marketing', 'advertising'
    ]
  };

  // ========================================
  // Variable Extraction Methods
  // ========================================

  /**
   * Extracts all possible variables from quote data
   */
  extractVariablesFromQuote(
    quote: Quote,
    client: Client,
    companySettings: CompanySettings,
    additionalContext: Record<string, any> = {}
  ): Record<string, any> {
    try {
      logger.info('Extracting variables from quote data', { quoteId: quote.id });

      const extractedData: Record<string, any> = {
        // Quote data
        ...quote,

        // Client data
        client: {
          ...client,
          name: client.name || client.company, // Fallback for missing name
        },

        // Company settings
        companySettings: {
          ...companySettings,
        },

        // Additional context
        ...additionalContext,

        // Derived fields
        derived: this.deriveAdditionalFields(quote, client, companySettings)
      };

      logger.info('Variables extracted successfully', {
        quoteId: quote.id,
        variableCount: Object.keys(extractedData).length
      });

      return extractedData;
    } catch (error) {
      logger.error('Variable extraction failed', {
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.errorHandler.handleServiceError(
        'VARIABLE_EXTRACTION_ERROR',
        'Failed to extract variables from quote data',
        { quoteId: quote.id, originalError: error }
      );
    }
  }

  /**
   * Maps template variables to quote data fields
   */
  mapTemplateVariables(
    template: SLATemplate,
    quoteData: Record<string, any>
  ): VariableMapping[] {
    try {
      logger.info('Mapping template variables', {
        templateId: template.id,
        variableCount: template.variables.length
      });

      const mappings: VariableMapping[] = [];

      for (const variable of template.variables) {
        const mapping = this.findBestMapping(variable, quoteData, template.package_type);
        if (mapping) {
          mappings.push(mapping);
        }
      }

      logger.info('Variable mapping completed', {
        templateId: template.id,
        mappingCount: mappings.length
      });

      return mappings;
    } catch (error) {
      logger.error('Variable mapping failed', {
        templateId: template.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.errorHandler.handleServiceError(
        'VARIABLE_MAPPING_ERROR',
        'Failed to map template variables to quote data',
        { templateId: template.id, originalError: error }
      );
    }
  }

  /**
   * Performs variable substitution in template content
   */
  substituteVariables(
    template: SLATemplate,
    quoteData: Record<string, any>,
    customVariables: Record<string, any> = {}
  ): VariableSubstitution[] {
    try {
      logger.info('Performing variable substitution', {
        templateId: template.id,
        customVariableCount: Object.keys(customVariables).length
      });

      const substitutions: VariableSubstitution[] = [];
      const allData = { ...quoteData, ...customVariables };

      // Process each template variable
      for (const variable of template.variables) {
        const value = this.extractVariableValue(variable, allData);

        substitutions.push({
          variable_name: variable.name,
          value,
          data_source: variable.data_source || 'quote_data',
          substituted_at: new Date()
        });
      }

      logger.info('Variable substitution completed', {
        templateId: template.id,
        substitutionCount: substitutions.length
      });

      return substitutions;
    } catch (error) {
      logger.error('Variable substitution failed', {
        templateId: template.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.errorHandler.handleServiceError(
        'VARIABLE_SUBSTITUTION_ERROR',
        'Failed to substitute variables in template content',
        { templateId: template.id, originalError: error }
      );
    }
  }

  /**
   * Detects package type from quote items and description
   */
  detectPackageType(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any> = {}
  ): PackageType {
    try {
      logger.info('Detecting package type from quote data', { quoteId: quote.id });

      // Use the dedicated package detector for more accurate detection
      const detectedType = packageDetector.detectPackageType(quote, client, additionalContext);

      logger.info('Package type detected', {
        quoteId: quote.id,
        detectedType: detectedType
      });

      return detectedType;
    } catch (error) {
      logger.error('Package type detection failed', {
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to general website
      return 'general_website';
    }
  }

  /**
   * Generates preview content with substituted variables
   */
  generatePreview(
    template: SLATemplate,
    quoteData: Record<string, any>,
    customVariables: Record<string, any> = {}
  ): string {
    try {
      logger.info('Generating preview content', { templateId: template.id });

      const substitutions = this.substituteVariables(template, quoteData, customVariables);
      let previewContent = template.content;

      // Replace variables in template content
      for (const substitution of substitutions) {
        const placeholder = `{{${substitution.variable_name}}}`;
        const displayValue = this.formatValueForDisplay(substitution.value);
        previewContent = previewContent.replace(
          new RegExp(placeholder, 'g'),
          displayValue
        );
      }

      // Replace any remaining variables with default values or empty strings
      for (const variable of template.variables) {
        const placeholder = `{{${variable.name}}}`;
        if (previewContent.includes(placeholder)) {
          const defaultValue = variable.default_value || `[${variable.display_name}]`;
          previewContent = previewContent.replace(
            new RegExp(placeholder, 'g'),
            this.formatValueForDisplay(defaultValue)
          );
        }
      }

      logger.info('Preview content generated successfully', {
        templateId: template.id,
        contentLength: previewContent.length
      });

      return previewContent;
    } catch (error) {
      logger.error('Preview generation failed', {
        templateId: template.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw this.errorHandler.handleServiceError(
        'PREVIEW_GENERATION_ERROR',
        'Failed to generate preview content',
        { templateId: template.id, originalError: error }
      );
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Finds the best mapping for a template variable
   */
  private findBestMapping(
    variable: TemplateVariable,
    quoteData: Record<string, any>,
    packageType: PackageType
  ): VariableMapping | null {
    const possibleFields = this.QUOTE_FIELD_MAPPINGS[variable.name] || [];

    // Try exact field matches first
    for (const field of possibleFields) {
      const value = this.getNestedValue(quoteData, field);
      if (value !== undefined && value !== null && value !== '') {
        return {
          template_variable: variable.name,
          quote_field: field,
          confidence: 0.9,
          suggested_value: value
        };
      }
    }

    // Try fuzzy matching based on variable name
    const fuzzyMatch = this.findFuzzyMatch(variable, quoteData);
    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // Try package-specific mappings
    const packageSpecificMatch = this.findPackageSpecificMatch(variable, quoteData, packageType);
    if (packageSpecificMatch) {
      return packageSpecificMatch;
    }

    return null;
  }

  /**
   * Extracts the value for a variable from the data
   */
  private extractVariableValue(
    variable: TemplateVariable,
    allData: Record<string, any>
  ): any {
    // Check if variable has a specific data source
    if (variable.data_source) {
      const value = this.getNestedValue(allData, variable.data_source);
      if (value !== undefined) {
        return this.validateAndTransformValue(value, variable);
      }
    }

    // Try to find value in common fields
    const possibleFields = this.QUOTE_FIELD_MAPPINGS[variable.name] || [];
    for (const field of possibleFields) {
      const value = this.getNestedValue(allData, field);
      if (value !== undefined && value !== null && value !== '') {
        return this.validateAndTransformValue(value, variable);
      }
    }

    // Use default value if available
    if (variable.default_value !== undefined) {
      return variable.default_value;
    }

    // Return placeholder for required variables
    if (variable.is_required) {
      return `[${variable.display_name}]`;
    }

    return null;
  }

  /**
   * Gets a nested value from an object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) =>
      current && current[key] !== undefined ? current[key] : undefined,
      obj
    );
  }

  /**
   * Validates and transforms a value based on variable type
   */
  private validateAndTransformValue(value: any, variable: TemplateVariable): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (variable.type) {
      case 'text':
        return String(value);

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          logger.warn('Invalid number value', {
            variableName: variable.name,
            value,
            type: typeof value
          });
          return 0;
        }

        // Apply validation rules
        if (variable.validation?.min !== undefined && num < variable.validation.min) {
          return variable.validation.min;
        }
        if (variable.validation?.max !== undefined && num > variable.validation.max) {
          return variable.validation.max;
        }

        return num;

      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          logger.warn('Invalid date value', {
            variableName: variable.name,
            value
          });
          return new Date();
        }
        return date;

      case 'boolean':
        if (typeof value === 'boolean') {
          return value;
        }
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        if (typeof value === 'number') {
          return value !== 0;
        }
        return Boolean(value);

      default:
        return value;
    }
  }

  /**
   * Derives additional fields from quote data
   */
  private deriveAdditionalFields(
    quote: Quote,
    client: Client,
    companySettings: CompanySettings
  ): Record<string, any> {
    return {
      // Duration calculations
      estimated_duration: this.estimateProjectDuration(quote),

      // Value calculations
      monthly_value: quote.totalInclVat / 12, // Estimate

      // Technical specifications
      pages: this.estimatePageCount(quote),
      products: this.estimateProductCount(quote),

      // Service level defaults
      uptime_target: this.getDefaultUptimeTarget(quote),
      response_time_hours: this.getDefaultResponseTime(quote),
      resolution_time_hours: this.getDefaultResolutionTime(quote),

      // Compliance defaults
      compliance_frameworks: this.detectComplianceRequirements(quote),
      security_level: this.detectSecurityRequirements(quote),
      data_protection: this.detectDataProtectionRequirements(quote),

      // Support defaults
      support_hours: '9:00 - 17:00, Monday - Friday',
      maintenance_window: 'Sunday 2:00 AM - 4:00 AM',
      backup_frequency: 'Daily',
      data_retention_days: 365
    };
  }

  /**
   * Prepares text data for package type detection
   */
  private prepareTextDataForDetection(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any>
  ): string {
    const textData = [
      // Quote description and notes
      quote.termsText || '',
      quote.notes || '',

      // Client information
      client.name || '',
      client.company || '',

      // Item descriptions
      ...quote.items.map(item => item.description),

      // Additional context
      ...Object.values(additionalContext).map(value => String(value))
    ];

    return textData.join(' ').toLowerCase();
  }

  /**
   * Calculates scores for each package type
   */
  private calculatePackageTypeScores(textData: string): Record<PackageType, number> {
    const scores: Record<PackageType, number> = {
      'ecom_site': 0,
      'general_website': 0,
      'business_process_systems': 0,
      'marketing': 0
    };

    for (const [packageType, patterns] of Object.entries(this.PACKAGE_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (textData.includes(pattern.toLowerCase())) {
          scores[packageType as PackageType] += 1;
        }
      }
    }

    return scores;
  }

  /**
   * Finds fuzzy matches for variables
   */
  private findFuzzyMatch(
    variable: TemplateVariable,
    quoteData: Record<string, any>
  ): VariableMapping | null {
    const searchTerms = variable.name.split('_');
    let bestMatch: VariableMapping | null = null;
    let bestScore = 0;

    const searchInObject = (obj: any, path: string = ''): void => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const keyLower = key.toLowerCase();

        // Calculate similarity score
        let score = 0;
        for (const term of searchTerms) {
          if (keyLower.includes(term.toLowerCase())) {
            score += 1;
          }
        }

        if (score > bestScore && value !== null && value !== undefined && value !== '') {
          bestScore = score;
          bestMatch = {
            template_variable: variable.name,
            quote_field: currentPath,
            confidence: Math.min(score / searchTerms.length, 0.7),
            suggested_value: value
          };
        }

        // Recursively search nested objects
        if (typeof value === 'object') {
          searchInObject(value, currentPath);
        }
      }
    };

    searchInObject(quoteData);
    return bestMatch;
  }

  /**
   * Finds package-specific variable matches
   */
  private findPackageSpecificMatch(
    variable: TemplateVariable,
    quoteData: Record<string, any>,
    packageType: PackageType
  ): VariableMapping | null {
    const packageSpecificFields: Record<PackageType, Record<string, string[]>> = {
      'ecom_site': {
        'products_count': ['items.length', 'products'],
        'payment_gateway': ['payment_gateway', 'payment_provider'],
        'shipping_integration': ['shipping', 'delivery']
      },
      'general_website': {
        'pages_count': ['pages', 'items.length'],
        'contact_form': ['contact', 'form'],
        'cms_platform': ['cms', 'wordpress', 'content_management']
      },
      'business_process_systems': {
        'user_roles': ['roles', 'permissions'],
        'automation_rules': ['automation', 'workflows'],
        'reporting_frequency': ['reports', 'analytics']
      },
      'marketing': {
        'campaign_types': ['campaigns', 'marketing'],
        'lead_sources': ['leads', 'sources'],
        'conversion_goals': ['conversion', 'goals']
      }
    };

    const specificFields = packageSpecificFields[packageType]?.[variable.name] || [];

    for (const field of specificFields) {
      const value = this.getNestedValue(quoteData, field);
      if (value !== undefined && value !== null && value !== '') {
        return {
          template_variable: variable.name,
          quote_field: field,
          confidence: 0.8,
          suggested_value: value
        };
      }
    }

    return null;
  }

  /**
   * Formats a value for display in preview content
   */
  private formatValueForDisplay(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (typeof value === 'number') {
      return value.toLocaleString('en-ZA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }

  // ========================================
  // Estimation Helper Methods
  // ========================================

  private estimateProjectDuration(quote: Quote): string {
    // Simple estimation based on total value
    const totalValue = quote.totalInclVat;

    if (totalValue < 50000) return '2-4 weeks';
    if (totalValue < 100000) return '1-2 months';
    if (totalValue < 250000) return '2-3 months';
    if (totalValue < 500000) return '3-6 months';
    return '6+ months';
  }

  private estimatePageCount(quote: Quote): number {
    // Estimate based on item descriptions
    const pageKeywords = ['page', 'pages', 'landing', 'home', 'about', 'contact'];
    let pageCount = 5; // Default minimum

    for (const item of quote.items) {
      const description = item.description.toLowerCase();
      for (const keyword of pageKeywords) {
        if (description.includes(keyword)) {
          pageCount += 2;
        }
      }
    }

    return Math.min(pageCount, 50); // Cap at 50 pages
  }

  private estimateProductCount(quote: Quote): number {
    // Look for product-related keywords in items
    const productKeywords = ['product', 'products', 'item', 'catalog', 'inventory'];
    let productCount = 0;

    for (const item of quote.items) {
      const description = item.description.toLowerCase();
      for (const keyword of productKeywords) {
        if (description.includes(keyword)) {
          productCount += item.qty || 1;
        }
      }
    }

    return Math.min(productCount, 1000); // Cap at 1000 products
  }

  private getDefaultUptimeTarget(quote: Quote): number {
    const totalValue = quote.totalInclVat;

    // Higher value projects get better uptime guarantees
    if (totalValue > 500000) return 99.9;
    if (totalValue > 100000) return 99.5;
    return 99.0;
  }

  private getDefaultResponseTime(quote: Quote): number {
    const totalValue = quote.totalInclVat;

    // Higher value projects get faster response times
    if (totalValue > 500000) return 1; // 1 hour
    if (totalValue > 100000) return 4; // 4 hours
    return 8; // 8 hours
  }

  private getDefaultResolutionTime(quote: Quote): number {
    const totalValue = quote.totalInclVat;

    // Higher value projects get faster resolution times
    if (totalValue > 500000) return 4; // 4 hours
    if (totalValue > 100000) return 24; // 24 hours
    return 72; // 72 hours
  }

  private detectComplianceRequirements(quote: Quote): string[] {
    const requirements: string[] = [];
    const text = (quote.termsText + ' ' + quote.notes).toLowerCase();

    if (text.includes('popia') || text.includes('protection of personal information')) {
      requirements.push('POPIA');
    }
    if (text.includes('gdpr') || text.includes('general data protection')) {
      requirements.push('GDPR');
    }
    if (text.includes('paia') || text.includes('promotion of access to information')) {
      requirements.push('PAIA');
    }
    if (text.includes('pci') || text.includes('payment card industry')) {
      requirements.push('PCI DSS');
    }

    return requirements.length > 0 ? requirements : ['POPIA'];
  }

  private detectSecurityRequirements(quote: Quote): string {
    const text = (quote.termsText + ' ' + quote.notes).toLowerCase();

    if (text.includes('ssl') || text.includes('https')) {
      return 'Standard (SSL/HTTPS)';
    }
    if (text.includes('firewall') || text.includes('security')) {
      return 'Enhanced (Firewall, SSL/HTTPS)';
    }
    if (text.includes('encryption') || text.includes('advanced security')) {
      return 'Advanced (Encryption, Firewall, SSL/HTTPS)';
    }

    return 'Basic (Standard security measures)';
  }

  private detectDataProtectionRequirements(quote: Quote): string {
    const text = (quote.termsText + ' ' + quote.notes).toLowerCase();

    if (text.includes('backup') || text.includes('backups')) {
      return 'Daily backups with 30-day retention';
    }
    if (text.includes('redundancy') || text.includes('high availability')) {
      return 'Real-time replication with daily backups';
    }

    return 'Daily backups with standard retention';
  }
}

// Export singleton instance
export const variableMapper = new VariableMapper();