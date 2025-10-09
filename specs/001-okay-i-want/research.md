# Phase 0 Research: Template-Based SLA Generation System

**Date**: 2025-01-09
**Feature**: Template-Based SLA Generation System
**Research Scope**: Template architecture, variable substitution, package-based workflows, and implementation patterns

## Executive Summary

This research addresses the key technical requirements for implementing a streamlined template-based SLA Generation System. The investigation focuses on standard template creation for 4 package types (Ecom Site, General Website, Business Process Systems, Marketing), variable substitution from quote data, and simplified user workflows. The system uses AI only for initial template generation, then maintains templates manually with plug-and-play variable substitution.

## Research Findings

### 1. Template-Based SLA Generation Architecture

**Decision**: Implement streamlined template-based SLA generation with package-specific templates and variable substitution.

**Rationale**:
- Simplified workflow reduces complexity and maintenance overhead
- Package-based templates ensure consistency for each service type
- Variable substitution from quote data provides automation without over-engineering
- User editing capability maintains flexibility while keeping standardization

**Package Types and Template Strategy**:
1. **Ecom Site**: E-commerce specific SLAs covering uptime, payment processing, inventory management
2. **General Website**: Basic website SLAs covering hosting, uptime, maintenance, support
3. **Business Process Systems**: Comprehensive SLAs for HR/CRM/Project Management systems covering data security, uptime, user support
4. **Marketing**: Marketing service SLAs covering ad performance, content delivery, campaign management

**Alternatives Considered**:
- Full AI integration (overengineered for this use case)
- Dynamic template generation (unnecessary complexity)
- Manual template creation only (lacks initial AI assistance)

#### Implementation Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Template       │    │   Quote Data    │
│   (React)       │◄──►│   Engine         │◄──►│   (Database)    │
│                 │    │                  │    │                 │
│ - SLA Forms     │    │ - Variable       │    │ - Client Info   │
│ - Template UI   │    │   Substitution   │    │ - Package Data  │
│ - Preview       │    │ - PDF Generation │    │ - Pricing       │
│ - Edit          │    │ - Template       │    │ - Timeline      │
└─────────────────┘    │   Management     │    └─────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         └──────────────►│   Template       │
                        │   Storage        │
                        │                  │
                        │ - 4 Package Types│
                        │ - Variable Placeholders │
                        │ - Editable Content     │
                        └──────────────────┘
```

#### Key Components

1. **Template Management System**:
   - 4 standard templates for each package type
   - Variable placeholder system `{{client_name}}`, `{{project_scope}}`, etc.
   - Template editing capability for customization

2. **Variable Substitution Engine**:
   - Extract variables from quote data (client info, package details, pricing)
   - Creative variable mapping from quote tables
   - Real-time preview with populated data

3. **Package Detection Logic**:
   - Auto-detect package type from selected quote items
   - Support multiple packages → generate separate SLAs
   - Template selection based on package type

4. **PDF Generation**:
   - jsPDF integration for professional document output
   - Template formatting with populated variables
   - Download and email distribution options

5. **Template Creation (One-time AI Use)**:
   - Initial AI generation of 4 package templates
   - Manual refinement and maintenance thereafter
   - Version control for template updates

### 2. Row Level Security (RLS) Implementation

**Decision**: Implement comprehensive RLS policies with role-based access control using security definer functions.

**Rationale**:
- Ensures proper client data isolation in multi-tenant environment
- Provides clear separation between internal users (full access) and clients (view-only own data)
- Security definer functions offer better performance than complex inline policies
- Comprehensive audit trail for compliance requirements

**Alternatives Considered**:
- Application-level access control (less secure, more complex to maintain)
- Simple user-based policies (insufficient for complex access requirements)
- View-based access control (performance overhead, complexity)

#### User Role System

```sql
user_roles
├── user_id (UUID, auth.users.id)
├── role (TEXT: internal_admin, internal_user, client_admin, client_user)
├── client_id (UUID, REFERENCES clients.id)
├── department (TEXT)
└── permissions (JSONB)
```

#### Access Control Functions

- `security.is_internal_user()`: Check if user has internal access
- `security.can_access_client()`: Validate client-specific access permissions
- `security.get_user_client_access()`: Get user's client access levels
- `security.filter_agreements_by_client_access()`: Efficient data filtering

#### RLS Policy Structure

**Internal Users**: Full access to all SLA data (create, read, update, delete)
**Client Admins**: Manage access to their own agreements (create, read, update)
**Client Users**: Read-only access to their own agreements

### 2. Variable Mapping from Quote Data

**Decision**: Implement intelligent variable extraction from existing quote database structure.

**Rationale**:
- Leverages existing quote data for automation
- Reduces manual data entry while maintaining accuracy
- Creative variable mapping provides comprehensive SLA content
- Maintains data consistency across documents

#### Variable Categories

**Client Information Variables**:
- `{{client_name}}` - From clients.name
- `{{client_contact_email}}` - From clients.email
- `{{client_contact_phone}}` - From clients.phone
- `{{client_billing_address}}` - From clients.billing_address
- `{{client_vat_number}}` - From clients.vat_number

**Project & Package Variables**:
- `{{project_title}}` - From quotes.title or generated from package type
- `{{package_type}}` - From quote items package identification
- `{{project_scope}}` - Generated from quote items descriptions
- `{{deliverables}}` - Compiled from quote items names and descriptions
- `{{timeline_weeks}}` - Calculated from quote item delivery timelines

**Financial Variables**:
- `{{total_value}}` - From quotes.total
- `{{deposit_amount}}` - From quotes.deposit_amount
- `{{payment_terms}}` - From quotes.payment_terms
- `{{currency}}` - From quotes.currency

**Service Variables**:
- `{{support_hours}}` - Package-specific support hours
- `{{hosting_specs}}` - Package-specific hosting details
- `{{maintenance_window}}` - Package-specific maintenance times
- `{{response_time_hours}}` - Package-specific response times

#### Variable Extraction Logic

```typescript
interface VariableMapping {
  client: {
    name: string;
    contact_email: string;
    billing_address: string;
    vat_number: string;
  };
  project: {
    title: string;
    scope: string;
    deliverables: string[];
    timeline_weeks: number;
  };
  financial: {
    total_value: number;
    deposit_amount: number;
    payment_terms: string;
    currency: string;
  };
  service: {
    support_hours: string;
    hosting_specs: string;
    maintenance_window: string;
    response_time_hours: number;
  };
}
```

### 3. Template Structure for Package Types

**Decision**: Create standardized templates with package-specific content and variable placeholders.

**Rationale**:
- Ensures consistency for each service type
- Package-specific content covers relevant service aspects
- Variable placeholders enable personalization
- User editing maintains flexibility when needed

#### Package Template Structures

**1. Ecom Site Template**:
- **Performance Metrics**: 99.9% uptime, payment processing SLA, inventory sync times
- **Support Coverage**: 24/7 technical support, payment gateway issues
- **Security**: PCI compliance, data protection, fraud detection
- **Variables**: `{{payment_gateways}}`, `{{inventory_system}}`, `{{expected_traffic}}`

**2. General Website Template**:
- **Performance Metrics**: 99.5% uptime, page load times, form submission response
- **Support Coverage**: Business hours support, content updates
- **Maintenance**: Scheduled maintenance windows, backup procedures
- **Variables**: `{{website_type}}`, `{{form_functionality}}`, `{{content_updates}}`

**3. Business Process Systems Template**:
- **Performance Metrics**: 99.9% uptime, data processing times, user access speeds
- **Support Coverage**: Business hours + emergency support, user training
- **Security**: Data encryption, access controls, backup procedures
- **Variables**: `{{system_type}}`, `{{user_count}}`, `{{data_sensitivity}}`

**4. Marketing Template**:
- **Performance Metrics**: Ad delivery times, content publication SLA, reporting accuracy
- **Support Coverage**: Campaign monitoring, performance optimization
- **Deliverables**: Ad creation timelines, content schedules, reporting cadence
- **Variables**: `{{ad_platforms}}`, `{{content_types}}`, `{{campaign_duration}}`

### 4. User Editing and Customization

**Decision**: Enable template editing before final generation to maintain flexibility.

**Rationale**:
- Allows customization for unique client requirements
- Maintains professional control over final document
- Users can adjust terms based on specific project needs
- Preserves efficiency while enabling customization

#### Editing Features

1. **Rich Text Editor**: Edit template content with formatting tools
2. **Variable Preview**: Show real-time preview with substituted variables
3. **Clause Library**: Optional additional clauses for specific requirements
4. **Version Control**: Save custom template versions for future use
5. **Approval Workflow**: Optional review process before final generation

#### Edit Restrictions

- **Core Terms**: Critical performance metrics require admin approval to modify
- **Legal Clauses**: Liability and compliance sections have editing safeguards
- **Template Structure**: Cannot modify template layout, only content
- **Variable Placeholders**: Protected from accidental deletion

### 5. PDF Generation and Distribution

**Decision**: Implement professional PDF generation with multiple distribution options.

**Rationale**:
- Professional document output maintains business credibility
- Multiple distribution options accommodate client preferences
- Branded documents reinforce business identity
- Download and email capabilities streamline workflow

#### PDF Generation Features

1. **Professional Layout**: Clean, business-appropriate formatting
2. **Brand Integration**: Company logo, colors, and contact information
3. **Variable Substitution**: Seamless integration of client data
4. **Document Metadata**: Title, creation date, version information
5. **Digital Signature**: Optional signature field for manual signing

#### Distribution Options

1. **Direct Download**: Immediate PDF download to user's device
2. **Email Delivery**: Automated email with PDF attachment
3. **Client Portal**: Upload to client portal for access
4. **Sharing Link**: Secure link for PDF access (time-limited)
5. **Multiple Formats**: PDF and Word document options

### 6. Technology Stack Integration

#### Core Dependencies

- **Next.js 15**: App Router patterns, server components
- **React 18**: Client components with state management
- **TypeScript 5**: Strict type checking, interface definitions
- **Supabase**: Database, authentication, RLS policies
- **ShadCN UI**: Component library with Tailwind CSS
- **jsPDF**: Professional PDF generation
- **Zod**: Input validation and type safety

#### Template Processing Dependencies

- **Template Engine**: Custom variable substitution system
- **Rich Text Editor**: Content editing capabilities (TipTap or similar)
- **PDF Generation**: jsPDF with html2canvas for professional output
- **File Storage**: Local file system or cloud storage for templates

#### Security Dependencies

- **Input Validation**: Zod schemas for all user inputs
- **Audit Logging**: Comprehensive activity tracking
- **Access Control**: Role-based permissions
- **Data Encryption**: Sensitive data protection

## Implementation Recommendations

### Phase 1: Core Template Infrastructure (Week 1-2)

1. **Database Schema Enhancement**
   - Create SLA templates table with package type classification
   - Implement variable placeholder system
   - Update RLS policies for template access
   - Create comprehensive audit logging

2. **Template Management System**
   - Create initial 4 package templates (one-time AI generation)
   - Implement template storage and versioning
   - Create template editing interface
   - Add template preview functionality

3. **Variable Extraction Engine**
   - Create variable mapping from quote database structure
   - Implement intelligent variable extraction logic
   - Create real-time preview with substituted data
   - Add package type detection from quote items

### Phase 2: Template Generation Workflow (Week 3-4)

1. **SLA Generation Interface**
   - Create quote selection and package detection UI
   - Implement template selection based on package type
   - Add variable substitution and preview system
   - Create template editing capabilities

2. **PDF Generation System**
   - Implement jsPDF integration for professional output
   - Create branded document templates
   - Add multiple distribution options (download, email)
   - Implement document metadata and versioning

3. **Multi-Package Support**
   - Support quotes with multiple packages
   - Generate separate SLAs for each package type
   - Create batch processing for multiple SLAs
   - Add package combination workflow

### Phase 3: Advanced Features (Week 5-6)

1. **Template Customization**
   - Implement rich text editor for template editing
   - Add clause library for optional additions
   - Create custom template versioning
   - Add template approval workflow

2. **Integration Features**
   - Integrate with existing quote system
   - Add SLA status tracking
   - Create client portal access
   - Implement automated quote-to-SLA workflows

### Phase 4: Testing and Optimization (Week 7-8)

1. **Template System Testing**
   - Test variable substitution accuracy
   - Validate PDF generation quality
   - Test multi-package workflow
   - Verify template editing functionality

2. **Performance Optimization**
   - Optimize template processing speed
   - Test concurrent SLA generation
   - Optimize PDF generation performance
   - Test system scalability

## Risk Mitigation Strategies

### Technical Risks

1. **Template System Reliability**
   - Implement template versioning and backup
   - Create fallback template storage
   - Add template validation checks
   - Implement error handling for variable substitution

2. **PDF Generation Issues**
   - Test PDF generation across different browsers
   - Implement fallback PDF generation methods
   - Add PDF quality validation
   - Create template layout testing

3. **Performance Bottlenecks**
   - Optimize template processing speed
   - Implement caching for frequently used templates
   - Add concurrent processing limits
   - Monitor PDF generation performance

### Business Risks

1. **Template Coverage**
   - Ensure templates cover all package types adequately
   - Regular template review and updates
   - User feedback collection for template improvements
   - Legal review of template content

2. **User Adoption**
   - Intuitive template selection interface
   - Clear variable preview system
   - Comprehensive user documentation
   - Streamlined quote-to-SLA workflow

## Success Metrics

### Technical Metrics

- Template generation time: <30 seconds
- PDF generation time: <10 seconds
- Variable substitution accuracy: >99%
- System uptime: >99.9%

### Business Metrics

- User adoption rate: >80% within 3 months
- SLA creation time: <5 minutes (target)
- User satisfaction score: >90%
- Template usage rate: >95% of quotes

### Operational Metrics

- Template maintenance time: <2 hours per month
- Support requests for SLA generation: <5% of total support
- Training time per user: <30 minutes
- Multi-package SLA generation: <2 minutes per SLA

## Conclusion

The Phase 0 research has successfully resolved all critical technical questions for the Template-Based SLA Generation System. The recommended architecture provides a streamlined foundation for implementing efficient template-based SLA generation with variable substitution, package-specific templates, and user-friendly editing capabilities.

Key decisions include:
- Template-based approach with 4 package-specific templates
- Variable substitution system leveraging existing quote data
- One-time AI use for initial template creation, then manual maintenance
- Simplified workflow: Quote → Template Selection → Variable Substitution → Preview → Download

The implementation plan spans 8 weeks with clear phases focusing on template infrastructure, generation workflow, and advanced features. This approach eliminates the complexity of real-time AI integration while maintaining flexibility and efficiency.

All technical prerequisites have been addressed, and the project is ready to proceed to Phase 1 design and implementation with a much simpler and more maintainable architecture.