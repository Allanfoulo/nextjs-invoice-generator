# Data Model: Template-Based SLA Generation System

**Date**: 2025-01-09
**Version**: 1.0
**Related Files**: [spec.md](./spec.md), [research.md](./research.md)

## Overview

This data model defines the entities, relationships, and validation rules for the Template-Based SLA Generation System. The model extends the existing invoice/quote platform with SLA-specific functionality while maintaining proper data isolation and audit trails. The system uses standardized templates with variable substitution rather than real-time AI generation.

## Core Entities

### 1. User Roles (Extension)

Extends the existing authentication system with role-based access control.

```typescript
interface UserRole {
  id: string;
  user_id: string;           // References auth.users.id
  role: UserRoleType;        // internal_admin, internal_user, client_admin, client_user
  client_id?: string;        // References clients.id (nullable for internal users)
  department?: string;       // Department for internal users
  permissions: Record<string, any>;  // Flexible permission storage
  created_at: Date;
  updated_at: Date;
}

type UserRoleType = 'internal_admin' | 'internal_user' | 'client_admin' | 'client_user';
```

### 2. SLA Templates

Package-specific templates with variable placeholders and customization options.

```typescript
interface SLATemplate {
  id: string;
  name: string;
  description: string;
  package_type: PackageType;   // Ecom Site, General Website, Business Process Systems, Marketing

  // Template Content
  content: string;             // Template content with variable placeholders {{variable_name}}
  variables: TemplateVariable[]; // Available variables for substitution
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
  usage_count: number;         // Track template popularity

  // Versioning
  version: number;
  parent_template_id?: string; // For template inheritance
}

type PackageType =
  | 'ecom_site'
  | 'general_website'
  | 'business_process_systems'
  | 'marketing';

interface TemplateVariable {
  name: string;                // Variable name without braces: client_name
  display_name: string;        // Human-readable name: Client Name
  type: 'text' | 'number' | 'date' | 'boolean';
  default_value?: any;
  description: string;
  data_source?: string;        // Where to extract this value from (quote, client, etc.)
  validation?: ValidationRule;
  is_required: boolean;
}
```

### 3. Service Agreement

Master agreement entity generated from templates with variable substitution.

```typescript
interface ServiceAgreement {
  id: string;
  client_id: string;         // References clients.id
  quote_id?: string;         // References quotes.id (optional conversion)
  template_id: string;       // References sla_templates.id

  // Agreement Details
  title: string;
  description: string;
  agreement_number: string;  // Auto-generated unique identifier
  version: number;           // Version tracking for amendments

  // Generated Content
  final_content: string;     // Template content with variables substituted
  substituted_variables: VariableSubstitution[]; // Track variable values used

  // Terms and Conditions
  performance_metrics: PerformanceMetrics;
  penalty_structure: PenaltyStructure;

  // Status and Dates
  status: ServiceAgreementStatus;
  effective_date: Date;
  expiry_date: Date;
  created_at: Date;
  updated_at: Date;

  // Access Control
  created_by_user_id: string; // References auth.users.id
  last_modified_by_user_id: string;

  // Template Generation Data
  template_version_used: number;
  generated_from_draft: boolean; // Whether user edited before finalizing
  user_edits?: string;       // User modifications to template content

  // Metadata
  package_type: PackageType;
  total_value?: number;      // Contract value for reporting
}

interface VariableSubstitution {
  variable_name: string;
  value: any;
  data_source: string;
  substituted_at: Date;
}

type ServiceAgreementStatus =
  | 'draft'
  | 'awaiting_signature'
  | 'active'
  | 'amended'
  | 'terminated'
  | 'expired';

interface PerformanceMetrics {
  uptime_target: number;           // Percentage (99.9)
  response_time_hours: number;     // Response time in hours
  resolution_time_hours: number;   // Resolution time in hours
  availability_hours: string;      // "24/7" or "Business hours"
  exclusion_clauses: string[];     // Maintenance periods, etc.
}

interface PenaltyStructure {
  breach_penalty_rate: number;     // Percentage per breach
  maximum_penalty: number;         // Maximum penalty amount
  grace_period_hours: number;      // Grace period before penalties
  credit_terms: string;           // Service credit description
}

interface ComplianceRequirement {
  id: string;
  framework: string;               // GDPR, ISO 27001, etc.
  description: string;
  required: boolean;
  evidence_required: boolean;
}

interface SignatureData {
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

interface WitnessSignature {
  witness_name: string;
  witness_email: string;
  signed_at: Date;
  ip_address: string;
}
```

### 4. Clause Library (Optional Extension)

Centralized library of reusable clauses for advanced template customization.

```typescript
interface ClauseLibrary {
  id: string;
  category: ClauseCategory;
  package_types: PackageType[];    // Which package types this clause applies to
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
  user_rating?: number;           // 1-5 star rating
  legal_review_status: 'pending' | 'approved' | 'rejected';
  last_legal_review_at?: Date;
}

type ClauseCategory =
  | 'service_delivery'
  | 'performance_metrics'
  | 'liability'
  | 'termination'
  | 'compliance'
  | 'confidentiality'
  | 'data_protection'
  | 'intellectual_property';
```

### 5. Performance Tracking (Future Extension)

Real-time monitoring of SLA compliance with breach detection.

```typescript
interface SLAPerformanceTracking {
  id: string;
  service_agreement_id: string;   // References service_agreements.id

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

### 6. Breach Incidents (Future Extension)

Detailed documentation of SLA violations with financial calculations.

```typescript
interface SLABreachIncident {
  id: string;
  service_agreement_id: string;   // References service_agreements.id

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

type BreachType =
  | 'uptime'
  | 'response_time'
  | 'resolution_time'
  | 'availability'
  | 'security'
  | 'data_protection'
  | 'other';

type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';
type BreachStatus = 'detected' | 'investigating' | 'resolved' | 'disputed' | 'closed';
```

### 7. E-Signature Records (Optional Extension)

Complete signature audit trail with verification data.

```typescript
interface SLASignatureRecord {
  id: string;
  service_agreement_id: string;   // References service_agreements.id

  // Signature Event
  event_type: SignatureEventType;
  event_timestamp: Date;

  // User Information
  user_id?: string;                // References auth.users.id
  user_email: string;
  user_role: string;

  // Verification Data
  ip_address: string;
  user_agent: string;
  device_fingerprint?: string;
  geolocation?: GeolocationData;

  // Signature Data (Encrypted)
  signature_hash?: string;
  signature_data?: any;            // Encrypted signature blob

  // Document State
  document_version: string;
  document_hash: string;           // Hash of document at signing time

  // Metadata
  created_at: Date;

  // Related Events
  related_event_ids?: string[];    // Chain of related signature events
}

type SignatureEventType =
  | 'signature_requested'
  | 'document_viewed'
  | 'signature_initiated'
  | 'signature_completed'
  | 'signature_rejected'
  | 'signature_expired'
  | 'agreement_amended'
  | 'agreement_terminated';

interface GeolocationData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

### 8. Audit Log

Comprehensive audit trail for all SLA-related activities.

```typescript
interface SLAAuditLog {
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
  reason?: string;                 // User-provided reason for changes
}

type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'sign' | 'approve' | 'reject' | 'export' | 'amend';

### 8. Audit Log

Comprehensive audit trail for all SLA-related activities.

```typescript
interface SLAAuditLog {
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
  reason?: string;                 // User-provided reason for changes
}

type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'sign'
  | 'approve'
  | 'reject'
  | 'export'
  | 'amend';
```

## Entity Relationships

```
Clients (existing)
├── ServiceAgreements (1:N)
│   ├── SLAPerformanceTracking (1:N) [Future Extension]
│   ├── SLABreachIncidents (1:N) [Future Extension]
│   └── SLASignatureRecords (1:N) [Optional Extension]
├── UserRole (1:N)
└── Quotes (existing) → ServiceAgreements (1:1 optional)

SLATemplates
├── ServiceAgreements (1:N)
├── TemplateVariable (1:N)
└── ClauseLibrary (1:N) [Optional Extension]

Auth.Users (existing)
├── UserRole (1:1)
├── ServiceAgreements (1:N as creator)
├── SLABreachIncidents (1:N as handler) [Future Extension]
└── SLAAuditLog (1:N)

ClauseLibrary [Optional Extension]
├── ClauseCategory (1:N)
└── SLATemplates (N:M through template_clauses)
```

## Validation Rules

### SLA Template Validation

```typescript
const slaTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  package_type: z.enum(['ecom_site', 'general_website', 'business_process_systems', 'marketing']),
  content: z.string().min(50, "Template content must be at least 50 characters"),
  variables: z.array(z.object({
    name: z.string().min(1).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Variable names must be valid identifiers"),
    display_name: z.string().min(1),
    type: z.enum(['text', 'number', 'date', 'boolean']),
    is_required: z.boolean(),
    data_source: z.string().optional(),
  })),
  default_metrics: z.object({
    uptime_target: z.number().min(90).max(100),
    response_time_hours: z.number().min(0.1).max(168),
    resolution_time_hours: z.number().min(1).max(8760),
  }),
});

// Template variable validation - ensure all variables in content are defined
slaTemplateSchema.refine(
  (data) => {
    const contentVars = (data.content.match(/\{\{(\w+)\}\}/g) || [])
      .map(match => match.slice(2, -2)); // Remove {{ and }}
    const definedVars = data.variables.map(v => v.name);
    return contentVars.every(varName => definedVars.includes(varName));
  },
  {
    message: "All variables used in template content must be defined",
    path: ["content"],
  }
);
```

### Service Agreement Validation

```typescript
const serviceAgreementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  client_id: z.string().uuid("Valid client ID required"),
  template_id: z.string().uuid("Valid template ID required"),
  effective_date: z.date().min(new Date(), "Effective date cannot be in the past"),
  expiry_date: z.date().min(z.any(), "Expiry date must be after effective date"),
  performance_metrics: z.object({
    uptime_target: z.number().min(90).max(100),
    response_time_hours: z.number().min(0.1).max(168),
    resolution_time_hours: z.number().min(1).max(8760),
  }),
  package_type: z.enum(['ecom_site', 'general_website', 'business_process_systems', 'marketing']),
});

// Refinement rule
serviceAgreementSchema.refine(
  (data) => data.expiry_date > data.effective_date,
  {
    message: "Expiry date must be after effective date",
    path: ["expiry_date"],
  }
);
```

### Performance Metrics Validation

```typescript
const performanceMetricsSchema = z.object({
  uptime_percentage: z.number().min(0).max(100),
  average_response_time_hours: z.number().min(0),
  average_resolution_time_hours: z.number().min(0),
  total_incidents: z.number().min(0),
  critical_incidents: z.number().min(0),
}).refine(
  (data) => data.critical_incidents <= data.total_incidents,
  {
    message: "Critical incidents cannot exceed total incidents",
    path: ["critical_incidents"],
  }
);
```

### Breach Incident Validation

```typescript
const breachIncidentSchema = z.object({
  incident_type: z.enum(['uptime', 'response_time', 'resolution_time', 'availability', 'security', 'data_protection', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(10, "Description must be at least 10 characters"),
  detected_at: z.date(),
  occurred_at: z.date(),
  penalty_calculated: z.number().min(0),
  service_credit_applied: z.number().min(0),
}).refine(
  (data) => data.detected_at >= data.occurred_at,
  {
    message: "Detection date cannot be before occurrence date",
    path: ["detected_at"],
  }
);
```

## Database Constraints

### Unique Constraints

```sql
-- Service Agreement uniqueness
ALTER TABLE service_agreements
ADD CONSTRAINT unique_agreement_number
UNIQUE (agreement_number);

-- Template uniqueness within package type
ALTER TABLE sla_templates
ADD CONSTRAINT unique_template_name_package
UNIQUE (name, package_type, version);

-- User role uniqueness
ALTER TABLE user_roles
ADD CONSTRAINT unique_user_role
UNIQUE (user_id);

-- Variable uniqueness within template
ALTER TABLE template_variables
ADD CONSTRAINT unique_variable_name_template
UNIQUE (template_id, variable_name);
```

### Check Constraints

```sql
-- Template package type validation
ALTER TABLE sla_templates
ADD CONSTRAINT check_package_type
CHECK (package_type IN ('ecom_site', 'general_website', 'business_process_systems', 'marketing'));

-- Template variable type validation
ALTER TABLE template_variables
ADD CONSTRAINT check_variable_type
CHECK (type IN ('text', 'number', 'date', 'boolean'));

-- Agreement date validation
ALTER TABLE service_agreements
ADD CONSTRAINT check_effective_before_expiry
CHECK (expiry_date > effective_date);

-- Performance metrics validation
ALTER TABLE service_agreements
ADD CONSTRAINT check_uptime_target
CHECK (performance_metrics->>'uptime_target'::numeric >= 90
       AND performance_metrics->>'uptime_target'::numeric <= 100);
```

### Foreign Key Constraints

```sql
-- Ensure referential integrity
ALTER TABLE service_agreements
ADD CONSTRAINT fk_client_id
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE service_agreements
ADD CONSTRAINT fk_template_id
FOREIGN KEY (template_id) REFERENCES sla_templates(id) ON DELETE RESTRICT;

ALTER TABLE template_variables
ADD CONSTRAINT fk_template_id
FOREIGN KEY (template_id) REFERENCES sla_templates(id) ON DELETE CASCADE;
```

## Indexes for Performance

```sql
-- Core entity indexes
CREATE INDEX idx_service_agreements_client_id ON service_agreements(client_id);
CREATE INDEX idx_service_agreements_status ON service_agreements(status);
CREATE INDEX idx_service_agreements_effective_date ON service_agreements(effective_date);
CREATE INDEX idx_service_agreements_created_by_user_id ON service_agreements(created_by_user_id);
CREATE INDEX idx_service_agreements_template_id ON service_agreements(template_id);

-- Template system indexes
CREATE INDEX idx_sla_templates_package_type ON sla_templates(package_type);
CREATE INDEX idx_sla_templates_is_active ON sla_templates(is_active);
CREATE INDEX idx_sla_templates_usage_count ON sla_templates(usage_count DESC);

-- Template variable indexes
CREATE INDEX idx_template_variables_template_id ON template_variables(template_id);
CREATE INDEX idx_template_variables_name ON template_variables(name);
CREATE INDEX idx_template_variables_is_required ON template_variables(is_required);

-- Variable substitution tracking
CREATE INDEX idx_variable_substitutions_agreement_id ON variable_substitutions(service_agreement_id);
CREATE INDEX idx_variable_substitutions_name ON variable_substitutions(variable_name);

-- Audit log indexes
CREATE INDEX idx_sla_audit_log_table_record ON sla_audit_log(table_name, record_id);
CREATE INDEX idx_sla_audit_log_user_id ON sla_audit_log(user_id);
CREATE INDEX idx_sla_audit_log_created_at ON sla_audit_log(created_at);
CREATE INDEX idx_sla_audit_log_action ON sla_audit_log(action);
```

## Data Migration Strategy

### Phase 1: Core Schema Setup

1. Create SLA templates table with package type constraints
2. Create template variables table for variable definition
3. Create service agreements table with template references
4. Set up variable substitution tracking table
5. Create comprehensive audit logging

### Phase 2: Template Initialization

1. Create initial 4 package templates using AI generation (one-time)
2. Define standard variables for each package type
3. Set up template versioning system
4. Populate default performance metrics for each package type

### Phase 3: Quote Integration

1. Connect SLA generation to existing quote system
2. Implement package type detection from quote items
3. Create variable extraction logic from quote data
4. Set up multi-package quote handling

### Phase 4: System Integration

1. Integrate with existing user role system
2. Set up RLS policies for SLA data
3. Create indexes for performance optimization
4. Configure audit logging for all SLA operations

## Security Considerations

### Data Protection

1. **Template Security**: Template content and variables protected with RLS policies
2. **Access Control**: Role-based access control for template management
3. **Audit Trail**: Complete audit logging for all SLA operations
4. **Variable Protection**: Sensitive client data extracted for variables protected

### Template Security

1. **Template Integrity**: Templates cannot be modified without proper authorization
2. **Version Control**: All template changes tracked with version history
3. **Variable Validation**: Strict validation for variable substitution
4. **Access Logging**: All template access and modifications logged

## Performance Optimization

### Template Processing

1. **Template Caching**: Frequently used templates cached in memory
2. **Variable Extraction**: Optimized variable extraction from quote data
3. **Batch Processing**: Efficient handling of multi-package quotes
4. **PDF Generation**: Optimized PDF generation pipeline

### Query Optimization

1. **Efficient Filtering**: Use indexed columns for package type and status filtering
2. **Template Lookup**: Optimized template selection by package type
3. **Variable Resolution**: Fast variable resolution and substitution
4. **Connection Pooling**: Optimize database connections for concurrent operations

### Monitoring

1. **Template Performance**: Monitor template generation and substitution speed
2. **RLS Overhead**: Track performance impact of security policies
3. **Cache Hit Rates**: Monitor template cache effectiveness
4. **User Experience**: Track SLA creation completion rates and times

This data model provides a comprehensive foundation for the Template-Based SLA Generation System while maintaining security, performance, and scalability requirements. The simplified architecture focuses on template management and variable substitution rather than complex AI integration.