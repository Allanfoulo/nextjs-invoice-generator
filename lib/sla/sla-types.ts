import { z } from "zod";

// ========================================
// Core Type Definitions
// ========================================

export type PackageType =
  | 'ecom_site'
  | 'general_website'
  | 'business_process_systems'
  | 'marketing';

export type UserRoleType =
  | 'internal_admin'
  | 'internal_user'
  | 'client_admin'
  | 'client_user';

export type ServiceAgreementStatus =
  | 'draft'
  | 'awaiting_signature'
  | 'active'
  | 'amended'
  | 'terminated'
  | 'expired';

export type ClauseCategory =
  | 'service_delivery'
  | 'performance_metrics'
  | 'liability'
  | 'termination'
  | 'compliance'
  | 'confidentiality'
  | 'data_protection'
  | 'intellectual_property';

export type BreachType =
  | 'uptime'
  | 'response_time'
  | 'resolution_time'
  | 'availability'
  | 'security'
  | 'data_protection'
  | 'other';

export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BreachStatus = 'detected' | 'investigating' | 'resolved' | 'disputed' | 'closed';

export type ComplianceStatus = 'compliant' | 'warning' | 'breached';
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'sign' | 'approve' | 'reject' | 'export' | 'amend';
export type SignatureEventType =
  | 'signature_requested'
  | 'document_viewed'
  | 'signature_initiated'
  | 'signature_completed'
  | 'signature_rejected'
  | 'signature_expired'
  | 'agreement_amended'
  | 'agreement_terminated';

// ========================================
// Core Interfaces
// ========================================

export interface UserRole {
  id: string;
  user_id: string;
  role: UserRoleType;
  client_id?: string;
  department?: string;
  permissions: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  name: string;
  display_name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  default_value?: any;
  description: string;
  data_source?: string;
  validation?: ValidationRule;
  is_required: boolean;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

export interface PerformanceMetrics {
  uptime_target: number;
  response_time_hours: number;
  resolution_time_hours: number;
  availability_hours: string;
  exclusion_clauses: string[];
}

export interface PenaltyStructure {
  breach_penalty_rate: number;
  maximum_penalty: number;
  grace_period_hours: number;
  credit_terms: string;
}

export interface ComplianceRequirement {
  id: string;
  framework: string;
  description: string;
  required: boolean;
  evidence_required: boolean;
}

export interface SignatureData {
  client_signature: {
    signed_at: Date;
    ip_address: string;
    user_agent: string;
    signature_hash: string;
  };
  internal_signature?: {
    signed_at: Date;
    signed_by_user_id: string;
    ip_address: string;
    user_agent: string;
    signature_hash: string;
  };
  witnesses?: WitnessSignature[];
}

export interface WitnessSignature {
  witness_name: string;
  witness_email: string;
  signed_at: Date;
  ip_address: string;
}

// ========================================
// Main Entity Interfaces
// ========================================

export interface SLATemplate {
  id: string;
  name: string;
  description: string;
  package_type: PackageType;

  // Template Content
  content: string;
  variables: TemplateVariable[];
  default_metrics: PerformanceMetrics;
  default_penalties: PenaltyStructure;

  // Template Settings
  is_active: boolean;
  is_customizable: boolean;
  requires_legal_review: boolean;

  // Metadata
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  usage_count: number;

  // Versioning
  version: number;
  parent_template_id?: string;
}

export interface ServiceAgreement {
  id: string;
  client_id: string;
  quote_id?: string;
  template_id: string;

  // Agreement Details
  title: string;
  description: string;
  agreement_number: string;
  version: number;

  // Generated Content
  final_content: string;
  substituted_variables: VariableSubstitution[];

  // Terms and Conditions
  performance_metrics: PerformanceMetrics;
  penalty_structure: PenaltyStructure;
  compliance_requirements: ComplianceRequirement[];

  // Status and Dates
  status: ServiceAgreementStatus;
  effective_date: Date;
  expiry_date: Date;
  created_at: Date;
  updated_at: Date;

  // Access Control
  created_by_user_id: string;
  last_modified_by_user_id: string;

  // Template Generation Data
  template_version_used: number;
  generated_from_draft: boolean;
  user_edits?: string;

  // Metadata
  package_type: PackageType;
  total_value?: number;

  // Signatures
  signatures?: SignatureData;
}

export interface VariableSubstitution {
  variable_name: string;
  value: any;
  data_source: string;
  substituted_at: Date;
}

// ========================================
// Clause Library Interface
// ========================================

export interface ClauseLibrary {
  id: string;
  category: ClauseCategory;
  package_types: PackageType[];
  title: string;
  content: string;

  // Usage and Metadata
  usage_count: number;
  is_active: boolean;
  requires_legal_review: boolean;

  // Creation Metadata
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;

  // Quality Metrics
  user_rating?: number;
  legal_review_status: 'pending' | 'approved' | 'rejected';
  last_legal_review_at?: Date;
}

// ========================================
// Performance Tracking Interfaces
// ========================================

export interface SLAPerformanceTracking {
  id: string;
  service_agreement_id: string;

  // Monitoring Period
  monitoring_period_start: Date;
  monitoring_period_end: Date;

  // Performance Data
  uptime_percentage: number;
  average_response_time_hours: number;
  average_resolution_time_hours: number;
  total_incidents: number;
  critical_incidents: number;

  // Compliance Status
  uptime_compliance: ComplianceStatus;
  response_time_compliance: ComplianceStatus;
  resolution_time_compliance: ComplianceStatus;
  overall_compliance: ComplianceStatus;

  // Calculations
  service_credits_owed: number;
  breach_penalty_amount: number;

  // Metadata
  calculated_at: Date;
  calculation_method: string;
}

export interface SLABreachIncident {
  id: string;
  service_agreement_id: string;

  // Incident Details
  incident_type: BreachType;
  severity: BreachSeverity;
  description: string;

  // Timing
  detected_at: Date;
  occurred_at: Date;
  resolved_at?: Date;
  duration_hours?: number;

  // Impact Assessment
  affected_services: string[];
  affected_users_count: number;
  business_impact: string;

  // Financial Impact
  penalty_calculated: number;
  service_credit_applied: number;
  currency: string;

  // Resolution
  resolution_actions: string[];
  preventive_measures: string[];

  // Status
  status: BreachStatus;

  // Communication
  client_notified_at?: Date;
  notification_method?: string;
  client_response?: string;

  // Metadata
  created_by_user_id: string;
  assigned_to_user_id?: string;
  created_at: Date;
  updated_at: Date;
}

// ========================================
// E-Signature Interfaces
// ========================================

export interface SLASignatureRecord {
  id: string;
  service_agreement_id: string;

  // Signature Event
  event_type: SignatureEventType;
  event_timestamp: Date;

  // User Information
  user_id?: string;
  user_email: string;
  user_role: string;

  // Verification Data
  ip_address: string;
  user_agent: string;
  device_fingerprint?: string;
  geolocation?: GeolocationData;

  // Signature Data (Encrypted)
  signature_hash?: string;
  signature_data?: any;

  // Document State
  document_version: string;
  document_hash: string;

  // Metadata
  created_at: Date;

  // Related Events
  related_event_ids?: string[];
}

export interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

// ========================================
// Audit Log Interface
// ========================================

export interface SLAAuditLog {
  id: string;

  // Event Information
  table_name: string;
  record_id: string;
  action: AuditAction;

  // User Information
  user_id?: string;
  user_role: string;
  client_id?: string;

  // Change Details
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];

  // Context Information
  ip_address: string;
  user_agent: string;
  session_id?: string;

  // Timestamp
  created_at: Date;

  // Additional Metadata
  additional_context?: Record<string, any>;
  reason?: string;
}

// ========================================
// API Response Types
// ========================================

export interface SLATemplateResponse {
  success: boolean;
  data?: SLATemplate;
  error?: string;
}

export interface ServiceAgreementResponse {
  success: boolean;
  data?: ServiceAgreement;
  error?: string;
}

export interface SLATemplateListResponse {
  success: boolean;
  data: SLATemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  error?: string;
}

export interface ServiceAgreementListResponse {
  success: boolean;
  data: ServiceAgreement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  error?: string;
}

// ========================================
// Form and UI Types
// ========================================

export interface SLACreateForm {
  title: string;
  description: string;
  client_id: string;
  template_id: string;
  effective_date: Date;
  expiry_date: Date;
  performance_metrics: PerformanceMetrics;
  package_type: PackageType;
}

export interface SLATemplateForm {
  name: string;
  description: string;
  package_type: PackageType;
  content: string;
  variables: TemplateVariable[];
  default_metrics: PerformanceMetrics;
  default_penalties: PenaltyStructure;
  is_active: boolean;
  is_customizable: boolean;
  requires_legal_review: boolean;
}

export interface VariableMapping {
  template_variable: string;
  quote_field: string;
  confidence: number;
  suggested_value?: any;
}

export interface SLAPreviewData {
  template: SLATemplate;
  quote_data: any;
  variable_mappings: VariableMapping[];
  preview_content: string;
}

// ========================================
// Configuration Types
// ========================================

export interface SLAConfiguration {
  default_performance_metrics: Record<PackageType, PerformanceMetrics>;
  default_penalty_structures: Record<PackageType, PenaltyStructure>;
  template_variables: Record<PackageType, TemplateVariable[]>;
  compliance_requirements: Record<PackageType, ComplianceRequirement[]>;
}

export interface SLASettings {
  auto_generate_on_quote_acceptance: boolean;
  require_legal_review_threshold: number;
  default_template_version: number;
  performance_monitoring_enabled: boolean;
  breach_notification_enabled: boolean;
}

// ========================================
// Zod Schemas for Validation
// ========================================

export const packageTypeSchema = z.enum(['ecom_site', 'general_website', 'business_process_systems', 'marketing']);

export const templateVariableSchema = z.object({
  name: z.string()
    .min(1, "Variable name is required")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Variable names must be valid identifiers"),
  display_name: z.string().min(1, "Display name is required"),
  type: z.enum(['text', 'number', 'date', 'boolean']),
  default_value: z.any().optional(),
  description: z.string().min(1, "Description is required"),
  data_source: z.string().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
  is_required: z.boolean(),
});

export const performanceMetricsSchema = z.object({
  uptime_target: z.number().min(90, "Uptime target must be at least 90%").max(100, "Uptime target cannot exceed 100%"),
  response_time_hours: z.number().min(0.1, "Response time must be at least 0.1 hours").max(168, "Response time cannot exceed 168 hours"),
  resolution_time_hours: z.number().min(1, "Resolution time must be at least 1 hour").max(8760, "Resolution time cannot exceed 8760 hours"),
  availability_hours: z.string().min(1, "Availability hours is required"),
  exclusion_clauses: z.array(z.string()).default([]),
});

export const penaltyStructureSchema = z.object({
  breach_penalty_rate: z.number().min(0, "Penalty rate cannot be negative").max(100, "Penalty rate cannot exceed 100%"),
  maximum_penalty: z.number().min(0, "Maximum penalty cannot be negative"),
  grace_period_hours: z.number().min(0, "Grace period cannot be negative"),
  credit_terms: z.string().min(1, "Credit terms are required"),
});

export const slaTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200, "Template name cannot exceed 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  package_type: packageTypeSchema,
  content: z.string().min(50, "Template content must be at least 50 characters"),
  variables: z.array(templateVariableSchema),
  default_metrics: performanceMetricsSchema,
  default_penalties: penaltyStructureSchema,
  is_active: z.boolean(),
  is_customizable: z.boolean(),
  requires_legal_review: z.boolean(),
});

export const serviceAgreementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  client_id: z.string().uuid("Valid client ID is required"),
  template_id: z.string().uuid("Valid template ID is required"),
  effective_date: z.date().min(new Date(), "Effective date cannot be in the past"),
  expiry_date: z.date(),
  performance_metrics: performanceMetricsSchema,
  package_type: packageTypeSchema,
}).refine(
  (data) => data.expiry_date > data.effective_date,
  {
    message: "Expiry date must be after effective date",
    path: ["expiry_date"],
  }
);

// Template content validation
export const slaTemplateContentSchema = slaTemplateSchema.refine(
  (data) => {
    const contentVars = (data.content.match(/\{\{(\w+)\}\}/g) || [])
      .map(match => match.slice(2, -2));
    const definedVars = data.variables.map(v => v.name);
    return contentVars.every(varName => definedVars.includes(varName));
  },
  {
    message: "All variables used in template content must be defined",
    path: ["content"],
  }
);