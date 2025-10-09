// Service Level Agreement (SLA) System Types

export type SLAStatus = 'draft' | 'generated' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type SLATemplateType = 'standard' | 'enterprise' | 'custom';
export type PerformanceMetricType = 'uptime' | 'response_time' | 'resolution_time' | 'availability';
export type ComplianceFramework = 'iso_27001' | 'gdpr' | 'sox' | 'pci_dss' | 'custom';

// SLA Template Types
export interface SLATemplate {
  id: string;
  name: string;
  description?: string;
  template_type: SLATemplateType;
  industry: string;
  version: string;
  is_active: boolean;

  // Template content with placeholders
  template_content: Record<string, string | number | boolean>;
  template_variables: Record<string, string | number | boolean>;

  // Performance metrics defaults
  default_uptime_percentage: number;
  default_response_time_hours: number;
  default_resolution_time_hours: number;

  // Compliance and legal
  compliance_frameworks: ComplianceFramework[];
  legal_jurisdiction: string;
  governing_law: string;

  // Metadata
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// SLA Clause Library Types
export interface SLAClause {
  id: string;
  clause_key: string;
  title: string;
  content: string;
  category: string;
  industry: string;
  compliance_framework?: ComplianceFramework;
  is_mandatory: boolean;
  is_active: boolean;

  // Variables that can be customized in this clause
  customizable_variables: Record<string, string | number | boolean>;

  // Metadata
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// Service Agreement Types
export interface ServiceAgreement {
  id: string;
  agreement_number: string;
  quote_id: string;
  client_id: string;

  // SLA Template reference
  sla_template_id?: string;

  // Agreement content
  agreement_content: Record<string, string | number | boolean>;
  agreement_variables: Record<string, string | number | boolean>;

  // Performance metrics for this specific agreement
  uptime_guarantee: number;
  response_time_hours: number;
  resolution_time_hours: number;

  // Financial terms
  penalty_percentage: number;
  penalty_cap_percentage: number;

  // Status and workflow
  status: SLAStatus;
  generated_at?: string;
  sent_at?: string;
  accepted_at?: string;
  expires_at?: string;

  // E-signature tracking
  requires_signature: boolean;
  signature_status: string;
  signed_at?: string;
  signed_ip_address?: string;
  signature_data: Record<string, string | number | boolean>;

  // Automation tracking
  auto_generated?: boolean;
  automation_trigger?: string;
  generation_error?: string;

  // Audit trail
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// SLA Performance Tracking Types
export interface SLAPerformanceTracking {
  id: string;
  service_agreement_id: string;
  metric_type: PerformanceMetricType;
  metric_date: string;
  target_value: number;
  actual_value: number;
  measurement_unit: string;
  is_breach: boolean;
  notes?: string;

  // Metadata
  recorded_by_user_id: string;
  recorded_at: string;
}

// SLA Breach Incident Types
export interface SLABreachIncident {
  id: string;
  service_agreement_id: string;
  incident_date: string;
  metric_type: PerformanceMetricType;
  description: string;
  root_cause?: string;
  impact_assessment?: string;

  // Financial impact
  penalty_amount: number;
  compensation_offered: number;

  // Resolution
  resolution_status: string;
  resolved_at?: string;
  resolved_by_user_id?: string;

  // Metadata
  reported_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// Template Variable Types
export interface SLATemplateVariables {
  // Client Information
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_address?: string;

  // Service Provider Information
  provider_name?: string;
  provider_company?: string;
  provider_email?: string;
  provider_address?: string;

  // Service Details
  service_description?: string;
  project_scope?: string;
  specification_document_url?: string;

  // Financial Terms
  total_contract_value?: number;
  deposit_percentage?: number;
  deposit_amount?: number;
  balance_percentage?: number;
  balance_amount?: number;

  // Performance Metrics
  uptime_guarantee?: number;
  response_time_hours?: number;
  resolution_time_hours?: number;

  // Penalty Terms
  penalty_percentage?: number;
  penalty_cap_percentage?: number;

  // Timeline
  project_start_date?: string;
  project_end_date?: string;
  warranty_months?: number;

  // Legal Terms
  governing_law?: string;
  jurisdiction?: string;

  // Custom Variables
  [key: string]: string | number | boolean | undefined;
}

// AI Generation Request Types
export interface SLAGenerationRequest {
  quote_id: string;
  template_id?: string;
  client_requirements?: string;
  industry_specifics?: string;
  custom_clauses?: string[];
  performance_requirements?: {
    uptime?: number;
    response_time?: number;
    resolution_time?: number;
  };
}

// AI Generation Response Types
export interface SLAGenerationResponse {
  success: boolean;
  service_agreement?: ServiceAgreement;
  generated_content?: Record<string, string | number | boolean>;
  variables_used?: SLATemplateVariables;
  error?: string;
}

// Clause Suggestion Types
export interface ClauseSuggestion {
  clause_id: string;
  clause: SLAClause;
  relevance_score: number;
  suggested_variables?: Record<string, string | number | boolean>;
  reasoning?: string;
}

// Template Management Types
export interface TemplateManagementActions {
  create: (template: Omit<SLATemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<SLATemplate>;
  update: (id: string, template: Partial<SLATemplate>) => Promise<SLATemplate>;
  delete: (id: string) => Promise<void>;
  duplicate: (id: string, newName: string) => Promise<SLATemplate>;
  activate: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
}

// Clause Library Management Types
export interface ClauseLibraryActions {
  create: (clause: Omit<SLAClause, 'id' | 'created_at' | 'updated_at'>) => Promise<SLAClause>;
  update: (id: string, clause: Partial<SLAClause>) => Promise<SLAClause>;
  delete: (id: string) => Promise<void>;
  suggest: (requirements: string, industry: string) => Promise<ClauseSuggestion[]>;
  search: (query: string, category?: string, industry?: string) => Promise<SLAClause[]>;
}

// E-signature Types
export interface ESignatureRequest {
  agreement_id: string;
  signer_name: string;
  signer_email: string;
  signer_ip?: string;
  signature_data?: Record<string, string | number | boolean>;
}

export interface ESignatureResponse {
  success: boolean;
  signature_id?: string;
  signed_at?: string;
  verification_url?: string;
  error?: string;
}

// Performance Monitoring Types
export interface PerformanceMetrics {
  uptime: {
    target: number;
    actual: number;
    measurement_period: string;
  };
  response_time: {
    target: number;
    actual: number;
    measurement_period: string;
  };
  resolution_time: {
    target: number;
    actual: number;
    measurement_period: string;
  };
}

// Breach Calculation Types
export interface BreachCalculation {
  incident_date: string;
  metric_type: PerformanceMetricType;
  breach_severity: number;
  calculated_penalty: number;
  penalty_cap_applied: number;
  final_penalty_amount: number;
}

// Export utility types for forms and validation
export type CreateSLATemplateForm = Omit<SLATemplate, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>;
export type UpdateSLATemplateForm = Partial<CreateSLATemplateForm>;

export type CreateSLAClauseForm = Omit<SLAClause, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id'>;
export type UpdateSLAClauseForm = Partial<CreateSLAClauseForm>;

export type CreateServiceAgreementForm = Omit<ServiceAgreement, 'id' | 'created_at' | 'updated_at' | 'created_by_user_id' | 'agreement_number' | 'auto_generated' | 'automation_trigger' | 'generation_error'>;
export type UpdateServiceAgreementForm = Partial<CreateServiceAgreementForm>;