// SLA Configuration Management
// Environment-specific settings and defaults for SLA operations

import { z } from 'zod';
import { PackageType, SLAConfiguration, SLASettings } from './sla-types';
import { SLAError } from './sla-errors';

// ========================================
// Environment Configuration Schema
// ========================================

const slaEnvironmentConfigSchema = z.object({
  // Feature flags
  SLA_ENABLED: z.coerce.boolean().default(true),
  SLA_AUTO_GENERATION: z.coerce.boolean().default(false),
  SLA_PERFORMANCE_MONITORING: z.coerce.boolean().default(true),
  SLA_BREACH_NOTIFICATIONS: z.coerce.boolean().default(true),
  SLA_AI_GENERATION: z.coerce.boolean().default(false),

  // Template settings
  SLA_DEFAULT_TEMPLATE_VERSION: z.coerce.number().default(1),
  SLA_MAX_TEMPLATE_SIZE: z.coerce.number().default(100000), // 100KB
  SLA_TEMPLATE_CACHE_TTL: z.coerce.number().default(3600), // 1 hour

  // Generation settings
  SLA_GENERATION_TIMEOUT: z.coerce.number().default(30000), // 30 seconds
  SLA_MAX_VARIABLE_SUBSTITUTIONS: z.coerce.number().default(100),
  SLA_PDF_GENERATION_TIMEOUT: z.coerce.number().default(15000), // 15 seconds

  // Performance monitoring
  SLA_PERFORMANCE_CHECK_INTERVAL: z.coerce.number().default(300000), // 5 minutes
  SLA_BREACH_DETECTION_DELAY: z.coerce.number().default(60000), // 1 minute
  SLA_PERFORMANCE_RETENTION_DAYS: z.coerce.number().default(90),

  // Notification settings
  SLA_NOTIFICATION_EMAIL_FROM: z.string().email().optional(),
  SLA_NOTIFICATION_REPLY_TO: z.string().email().optional(),
  SLA_BREACH_NOTIFICATION_RECIPIENTS: z.string().optional(), // comma-separated

  // Security settings
  SLA_REQUIRE_LEGAL_REVIEW_THRESHOLD: z.coerce.number().default(10000), // currency value
  SLA_MAX_AGREEMENT_VALUE: z.coerce.number().default(1000000), // currency value
  SLA_SIGNATURE_EXPIRY_HOURS: z.coerce.number().default(168), // 7 days

  // Integration settings
  SLA_AI_PROVIDER: z.enum(['openai', 'anthropic', 'none']).default('none'),
  SLA_AI_MODEL: z.string().optional(),
  SLA_AI_MAX_TOKENS: z.coerce.number().default(4000),
  SLA_AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.3),

  // External services
  SLA_EMAIL_SERVICE: z.enum(['resend', 'sendgrid', 'ses', 'none']).default('none'),
  SLA_ESIGNATURE_SERVICE: z.enum(['hellosign', 'docusign', 'none']).default('none'),

  // Database settings
  SLA_DB_POOL_SIZE: z.coerce.number().default(10),
  SLA_DB_CONNECTION_TIMEOUT: z.coerce.number().default(10000),

  // Logging settings
  SLA_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SLA_LOG_RETENTION_DAYS: z.coerce.number().default(30),
  SLA_AUDIT_LOG_ENABLED: z.coerce.boolean().default(true),

  // Rate limiting
  SLA_RATE_LIMIT_REQUESTS_PER_MINUTE: z.coerce.number().default(60),
  SLA_RATE_LIMIT_BURST_SIZE: z.coerce.number().default(10),

  // File storage
  SLA_STORAGE_PROVIDER: z.enum(['local', 's3', 'supabase']).default('local'),
  SLA_STORAGE_BUCKET: z.string().optional(),
  SLA_STORAGE_REGION: z.string().optional(),
});

// ========================================
// Configuration Interface
// ========================================

export interface SLAEnvironmentConfig {
  // Feature flags
  SLA_ENABLED: boolean;
  SLA_AUTO_GENERATION: boolean;
  SLA_PERFORMANCE_MONITORING: boolean;
  SLA_BREACH_NOTIFICATIONS: boolean;
  SLA_AI_GENERATION: boolean;

  // Template settings
  SLA_DEFAULT_TEMPLATE_VERSION: number;
  SLA_MAX_TEMPLATE_SIZE: number;
  SLA_TEMPLATE_CACHE_TTL: number;

  // Generation settings
  SLA_GENERATION_TIMEOUT: number;
  SLA_MAX_VARIABLE_SUBSTITUTIONS: number;
  SLA_PDF_GENERATION_TIMEOUT: number;

  // Performance monitoring
  SLA_PERFORMANCE_CHECK_INTERVAL: number;
  SLA_BREACH_DETECTION_DELAY: number;
  SLA_PERFORMANCE_RETENTION_DAYS: number;

  // Notification settings
  SLA_NOTIFICATION_EMAIL_FROM?: string;
  SLA_NOTIFICATION_REPLY_TO?: string;
  SLA_BREACH_NOTIFICATION_RECIPIENTS?: string;

  // Security settings
  SLA_REQUIRE_LEGAL_REVIEW_THRESHOLD: number;
  SLA_MAX_AGREEMENT_VALUE: number;
  SLA_SIGNATURE_EXPIRY_HOURS: number;

  // Integration settings
  SLA_AI_PROVIDER: 'openai' | 'anthropic' | 'none';
  SLA_AI_MODEL?: string;
  SLA_AI_MAX_TOKENS: number;
  SLA_AI_TEMPERATURE: number;

  // External services
  SLA_EMAIL_SERVICE: 'resend' | 'sendgrid' | 'ses' | 'none';
  SLA_ESIGNATURE_SERVICE: 'hellosign' | 'docusign' | 'none';

  // Database settings
  SLA_DB_POOL_SIZE: number;
  SLA_DB_CONNECTION_TIMEOUT: number;

  // Logging settings
  SLA_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  SLA_LOG_RETENTION_DAYS: number;
  SLA_AUDIT_LOG_ENABLED: boolean;

  // Rate limiting
  SLA_RATE_LIMIT_REQUESTS_PER_MINUTE: number;
  SLA_RATE_LIMIT_BURST_SIZE: number;

  // File storage
  SLA_STORAGE_PROVIDER: 'local' | 's3' | 'supabase';
  SLA_STORAGE_BUCKET?: string;
  SLA_STORAGE_REGION?: string;
}

// ========================================
// Configuration Manager
// ========================================

export class SLAConfigManager {
  private static instance: SLAConfigManager;
  private config: SLAEnvironmentConfig;
  private slaConfiguration: SLAConfiguration;
  private slaSettings: SLASettings;

  private constructor() {
    this.config = this.loadEnvironmentConfig();
    this.slaConfiguration = this.createDefaultSLAConfiguration();
    this.slaSettings = this.createDefaultSLASettings();
  }

  static getInstance(): SLAConfigManager {
    if (!SLAConfigManager.instance) {
      SLAConfigManager.instance = new SLAConfigManager();
    }
    return SLAConfigManager.instance;
  }

  /**
   * Load and validate environment configuration
   */
  private loadEnvironmentConfig(): SLAEnvironmentConfig {
    try {
      const rawConfig = {
        // Feature flags
        SLA_ENABLED: process.env.SLA_ENABLED,
        SLA_AUTO_GENERATION: process.env.SLA_AUTO_GENERATION,
        SLA_PERFORMANCE_MONITORING: process.env.SLA_PERFORMANCE_MONITORING,
        SLA_BREACH_NOTIFICATIONS: process.env.SLA_BREACH_NOTIFICATIONS,
        SLA_AI_GENERATION: process.env.SLA_AI_GENERATION,

        // Template settings
        SLA_DEFAULT_TEMPLATE_VERSION: process.env.SLA_DEFAULT_TEMPLATE_VERSION,
        SLA_MAX_TEMPLATE_SIZE: process.env.SLA_MAX_TEMPLATE_SIZE,
        SLA_TEMPLATE_CACHE_TTL: process.env.SLA_TEMPLATE_CACHE_TTL,

        // Generation settings
        SLA_GENERATION_TIMEOUT: process.env.SLA_GENERATION_TIMEOUT,
        SLA_MAX_VARIABLE_SUBSTITUTIONS: process.env.SLA_MAX_VARIABLE_SUBSTITUTIONS,
        SLA_PDF_GENERATION_TIMEOUT: process.env.SLA_PDF_GENERATION_TIMEOUT,

        // Performance monitoring
        SLA_PERFORMANCE_CHECK_INTERVAL: process.env.SLA_PERFORMANCE_CHECK_INTERVAL,
        SLA_BREACH_DETECTION_DELAY: process.env.SLA_BREACH_DETECTION_DELAY,
        SLA_PERFORMANCE_RETENTION_DAYS: process.env.SLA_PERFORMANCE_RETENTION_DAYS,

        // Notification settings
        SLA_NOTIFICATION_EMAIL_FROM: process.env.SLA_NOTIFICATION_EMAIL_FROM,
        SLA_NOTIFICATION_REPLY_TO: process.env.SLA_NOTIFICATION_REPLY_TO,
        SLA_BREACH_NOTIFICATION_RECIPIENTS: process.env.SLA_BREACH_NOTIFICATION_RECIPIENTS,

        // Security settings
        SLA_REQUIRE_LEGAL_REVIEW_THRESHOLD: process.env.SLA_REQUIRE_LEGAL_REVIEW_THRESHOLD,
        SLA_MAX_AGREEMENT_VALUE: process.env.SLA_MAX_AGREEMENT_VALUE,
        SLA_SIGNATURE_EXPIRY_HOURS: process.env.SLA_SIGNATURE_EXPIRY_HOURS,

        // Integration settings
        SLA_AI_PROVIDER: process.env.SLA_AI_PROVIDER,
        SLA_AI_MODEL: process.env.SLA_AI_MODEL,
        SLA_AI_MAX_TOKENS: process.env.SLA_AI_MAX_TOKENS,
        SLA_AI_TEMPERATURE: process.env.SLA_AI_TEMPERATURE,

        // External services
        SLA_EMAIL_SERVICE: process.env.SLA_EMAIL_SERVICE,
        SLA_ESIGNATURE_SERVICE: process.env.SLA_ESIGNATURE_SERVICE,

        // Database settings
        SLA_DB_POOL_SIZE: process.env.SLA_DB_POOL_SIZE,
        SLA_DB_CONNECTION_TIMEOUT: process.env.SLA_DB_CONNECTION_TIMEOUT,

        // Logging settings
        SLA_LOG_LEVEL: process.env.SLA_LOG_LEVEL,
        SLA_LOG_RETENTION_DAYS: process.env.SLA_LOG_RETENTION_DAYS,
        SLA_AUDIT_LOG_ENABLED: process.env.SLA_AUDIT_LOG_ENABLED,

        // Rate limiting
        SLA_RATE_LIMIT_REQUESTS_PER_MINUTE: process.env.SLA_RATE_LIMIT_REQUESTS_PER_MINUTE,
        SLA_RATE_LIMIT_BURST_SIZE: process.env.SLA_RATE_LIMIT_BURST_SIZE,

        // File storage
        SLA_STORAGE_PROVIDER: process.env.SLA_STORAGE_PROVIDER,
        SLA_STORAGE_BUCKET: process.env.SLA_STORAGE_BUCKET,
        SLA_STORAGE_REGION: process.env.SLA_STORAGE_REGION,
      };

      return slaEnvironmentConfigSchema.parse(rawConfig);
    } catch (error) {
      console.error('Failed to load SLA environment configuration:', error);
      throw SLAError.configuration('environment', `Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create default SLA configuration for all package types
   */
  private createDefaultSLAConfiguration(): SLAConfiguration {
    return {
      default_performance_metrics: {
        ecom_site: {
          uptime_target: 99.9,
          response_time_hours: 1,
          resolution_time_hours: 4,
          availability_hours: '24/7',
          exclusion_clauses: ['Scheduled maintenance', 'Force majeure events']
        },
        general_website: {
          uptime_target: 99.5,
          response_time_hours: 2,
          resolution_time_hours: 8,
          availability_hours: 'Business hours (9-5, Mon-Fri)',
          exclusion_clauses: ['Scheduled maintenance', 'Third-party service failures']
        },
        business_process_systems: {
          uptime_target: 99.0,
          response_time_hours: 4,
          resolution_time_hours: 24,
          availability_hours: 'Business hours (8-6, Mon-Fri)',
          exclusion_clauses: ['Scheduled maintenance', 'Data backup windows', 'User training periods']
        },
        marketing: {
          uptime_target: 98.0,
          response_time_hours: 8,
          resolution_time_hours: 48,
          availability_hours: 'Business hours (9-5, Mon-Fri)',
          exclusion_clauses: ['Campaign launches', 'A/B testing periods', 'Content updates']
        }
      },
      default_penalty_structures: {
        ecom_site: {
          breach_penalty_rate: 10,
          maximum_penalty: 1000,
          grace_period_hours: 1,
          credit_terms: 'Service credit for next billing cycle'
        },
        general_website: {
          breach_penalty_rate: 5,
          maximum_penalty: 500,
          grace_period_hours: 2,
          credit_terms: 'Service credit for next billing cycle'
        },
        business_process_systems: {
          breach_penalty_rate: 15,
          maximum_penalty: 2000,
          grace_period_hours: 4,
          credit_terms: 'Service credit or partial refund'
        },
        marketing: {
          breach_penalty_rate: 5,
          maximum_penalty: 300,
          grace_period_hours: 8,
          credit_terms: 'Service credit for next campaign'
        }
      },
      template_variables: {
        ecom_site: [
          {
            name: 'client_name',
            display_name: 'Client Name',
            type: 'text',
            description: 'Name of the client organization',
            is_required: true
          },
          {
            name: 'monthly_fee',
            display_name: 'Monthly Fee',
            type: 'number',
            description: 'Monthly maintenance fee',
            is_required: true
          },
          {
            name: 'support_level',
            display_name: 'Support Level',
            type: 'text',
            description: 'Level of support provided',
            default_value: 'Premium',
            is_required: false
          }
        ],
        general_website: [
          {
            name: 'client_name',
            display_name: 'Client Name',
            type: 'text',
            description: 'Name of the client organization',
            is_required: true
          },
          {
            name: 'website_url',
            display_name: 'Website URL',
            type: 'text',
            description: 'Primary website URL',
            is_required: true
          }
        ],
        business_process_systems: [
          {
            name: 'client_name',
            display_name: 'Client Name',
            type: 'text',
            description: 'Name of the client organization',
            is_required: true
          },
          {
            name: 'system_name',
            display_name: 'System Name',
            type: 'text',
            description: 'Name of the business system',
            is_required: true
          }
        ],
        marketing: [
          {
            name: 'client_name',
            display_name: 'Client Name',
            type: 'text',
            description: 'Name of the client organization',
            is_required: true
          },
          {
            name: 'campaign_types',
            display_name: 'Campaign Types',
            type: 'text',
            description: 'Types of marketing campaigns',
            is_required: true
          }
        ]
      },
      compliance_requirements: {
        ecom_site: [
          {
            id: 'pci_compliance',
            framework: 'PCI DSS',
            description: 'Payment Card Industry Data Security Standard compliance',
            required: true,
            evidence_required: true
          },
          {
            id: 'gdpr_compliance',
            framework: 'GDPR',
            description: 'General Data Protection Regulation compliance',
            required: true,
            evidence_required: true
          }
        ],
        general_website: [
          {
            id: 'accessibility',
            framework: 'WCAG 2.1',
            description: 'Web Content Accessibility Guidelines compliance',
            required: false,
            evidence_required: false
          }
        ],
        business_process_systems: [
          {
            id: 'sox_compliance',
            framework: 'SOX',
            description: 'Sarbanes-Oxley Act compliance for financial systems',
            required: false,
            evidence_required: true
          }
        ],
        marketing: [
          {
            id: 'coppa_compliance',
            framework: 'COPPA',
            description: 'Children\'s Online Privacy Protection Act compliance',
            required: false,
            evidence_required: false
          }
        ]
      }
    };
  }

  /**
   * Create default SLA settings
   */
  private createDefaultSLASettings(): SLASettings {
    return {
      auto_generate_on_quote_acceptance: this.config.SLA_AUTO_GENERATION,
      require_legal_review_threshold: this.config.SLA_REQUIRE_LEGAL_REVIEW_THRESHOLD,
      default_template_version: this.config.SLA_DEFAULT_TEMPLATE_VERSION,
      performance_monitoring_enabled: this.config.SLA_PERFORMANCE_MONITORING,
      breach_notification_enabled: this.config.SLA_BREACH_NOTIFICATIONS
    };
  }

  /**
   * Get environment configuration
   */
  getEnvironmentConfig(): SLAEnvironmentConfig {
    return this.config;
  }

  /**
   * Get SLA configuration
   */
  getSLAConfiguration(): SLAConfiguration {
    return this.slaConfiguration;
  }

  /**
   * Get SLA settings
   */
  getSLASettings(): SLASettings {
    return this.slaSettings;
  }

  /**
   * Get configuration for a specific package type
   */
  getPackageTypeConfig(packageType: PackageType): {
    performance_metrics: any;
    penalty_structure: any;
    template_variables: any[];
    compliance_requirements: any[];
  } {
    return {
      performance_metrics: this.slaConfiguration.default_performance_metrics[packageType],
      penalty_structure: this.slaConfiguration.default_penalty_structures[packageType],
      template_variables: this.slaConfiguration.template_variables[packageType],
      compliance_requirements: this.slaConfiguration.compliance_requirements[packageType] || []
    };
  }

  /**
   * Check if SLA features are enabled
   */
  isSLAEnabled(): boolean {
    return this.config.SLA_ENABLED;
  }

  /**
   * Check if AI generation is enabled
   */
  isAIGenerationEnabled(): boolean {
    return this.config.SLA_AI_GENERATION && this.config.SLA_AI_PROVIDER !== 'none';
  }

  /**
   * Check if performance monitoring is enabled
   */
  isPerformanceMonitoringEnabled(): boolean {
    return this.config.SLA_PERFORMANCE_MONITORING;
  }

  /**
   * Check if email notifications are configured
   */
  isEmailNotificationEnabled(): boolean {
    return !!(this.config.SLA_NOTIFICATION_EMAIL_FROM && this.config.SLA_EMAIL_SERVICE !== 'none');
  }

  /**
   * Check if e-signature is configured
   */
  isESignatureEnabled(): boolean {
    return this.config.SLA_ESIGNATURE_SERVICE !== 'none';
  }

  /**
   * Get notification recipients as array
   */
  getNotificationRecipients(): string[] {
    if (!this.config.SLA_BREACH_NOTIFICATION_RECIPIENTS) {
      return [];
    }
    return this.config.SLA_BREACH_NOTIFICATION_RECIPIENTS.split(',').map(email => email.trim()).filter(Boolean);
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check critical settings
    if (!this.config.SLA_ENABLED) {
      errors.push('SLA features are disabled');
    }

    if (this.config.SLA_AI_GENERATION && this.config.SLA_AI_PROVIDER === 'none') {
      errors.push('AI generation is enabled but no AI provider is configured');
    }

    if (this.config.SLA_EMAIL_SERVICE !== 'none' && !this.config.SLA_NOTIFICATION_EMAIL_FROM) {
      errors.push('Email service is configured but no sender email is provided');
    }

    if (this.config.SLA_MAX_AGREEMENT_VALUE <= this.config.SLA_REQUIRE_LEGAL_REVIEW_THRESHOLD) {
      errors.push('Max agreement value should be higher than legal review threshold');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reload configuration from environment
   */
  reloadConfiguration(): void {
    this.config = this.loadEnvironmentConfig();
    this.slaSettings = this.createDefaultSLASettings();
  }
}

// Export singleton instance
export const slaConfig = SLAConfigManager.getInstance();

// Export convenience functions
export function getSLAEnvironmentConfig(): SLAEnvironmentConfig {
  return slaConfig.getEnvironmentConfig();
}

export function getSLAConfiguration(): SLAConfiguration {
  return slaConfig.getSLAConfiguration();
}

export function getSLASettings(): SLASettings {
  return slaConfig.getSLASettings();
}

export function isSLAEnabled(): boolean {
  return slaConfig.isSLAEnabled();
}

export function getPackageTypeConfig(packageType: PackageType) {
  return slaConfig.getPackageTypeConfig(packageType);
}