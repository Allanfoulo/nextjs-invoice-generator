# API Contracts: Template-Based SLA Generation System

**Date**: 2025-01-09
**Version**: 1.0
**Format**: REST API Specification

## Overview

This document defines the API contracts for the Template-Based SLA Generation System. All endpoints follow RESTful conventions with proper HTTP status codes, error handling, and security controls. The system focuses on template management, variable substitution, and streamlined SLA generation.

## Base URL

```
Development: http://localhost:3000/api/sla
Production:  https://your-domain.com/api/sla
```

## Authentication

All API endpoints require authentication using Supabase authentication. Include the authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

## Response Format

All responses follow a consistent JSON format:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully",
  "timestamp": "2025-01-09T10:00:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2025-01-09T10:00:00Z"
}
```

## Endpoints

### 1. SLA Templates

#### GET /api/sla/templates

Retrieve SLA templates with filtering by package type.

**Query Parameters:**
- `package_type` (string, optional): Filter by package type (ecom_site, general_website, business_process_systems, marketing)
- `is_active` (boolean, optional): Filter by active status
- `search` (string, optional): Search in name and description

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid",
        "name": "E-commerce Site SLA Template",
        "description": "Standard SLA for e-commerce websites",
        "package_type": "ecom_site",
        "is_active": true,
        "usage_count": 25,
        "variables": [
          {
            "name": "client_name",
            "display_name": "Client Name",
            "type": "text",
            "is_required": true,
            "description": "The client's company name"
          },
          {
            "name": "uptime_target",
            "display_name": "Uptime Target",
            "type": "number",
            "default_value": 99.9,
            "description": "Target uptime percentage"
          }
        ],
        "default_metrics": {
          "uptime_target": 99.9,
          "response_time_hours": 2,
          "resolution_time_hours": 24
        },
        "created_at": "2025-01-09T10:00:00Z"
      }
    ]
  }
}
```

#### GET /api/sla/templates/{id}

Retrieve a specific template with full details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "package_type": "ecom_site",
    "content": "Service Level Agreement for {{client_name}}...",
    "variables": [
      {
        "name": "client_name",
        "display_name": "Client Name",
        "type": "text",
        "is_required": true,
        "description": "The client's company name",
        "data_source": "client.name"
      }
    ],
    "default_metrics": {},
    "is_customizable": true,
    "version": 1,
    "usage_count": 25,
    "created_at": "date"
  }
}
```

#### POST /api/sla/templates

Create a new template (internal users only).

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (required)",
  "package_type": "ecom_site|general_website|business_process_systems|marketing (required)",
  "content": "string (required)",
  "variables": [
    {
      "name": "string (required)",
      "display_name": "string (required)",
      "type": "text|number|date|boolean (required)",
      "is_required": "boolean (required)",
      "description": "string",
      "data_source": "string",
      "default_value": "any"
    }
  ],
  "default_metrics": {
    "uptime_target": "number (90-100)",
    "response_time_hours": "number (0.1-168)",
    "resolution_time_hours": "number (1-8760)"
  }
}
```

#### PUT /api/sla/templates/{id}

Update an existing template (internal users only).

#### POST /api/sla/templates/{id}/clone

Clone an existing template for customization.

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)"
}
```

### 2. Service Agreements

#### GET /api/sla/agreements

Retrieve service agreements with filtering and pagination.

**Query Parameters:**
- `client_id` (string, optional): Filter by client
- `status` (string, optional): Filter by status
- `package_type` (string, optional): Filter by package type
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `search` (string, optional): Search in title and description

**Response:**
```json
{
  "success": true,
  "data": {
    "agreements": [
      {
        "id": "uuid",
        "title": "E-commerce Site SLA",
        "description": "Service level agreement for e-commerce website",
        "client_id": "uuid",
        "client_name": "Acme Corporation",
        "package_type": "ecom_site",
        "status": "active",
        "effective_date": "2025-01-01",
        "expiry_date": "2026-01-01",
        "template_name": "E-commerce Site SLA Template",
        "created_at": "2025-01-09T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```

#### POST /api/sla/agreements

Create a new service agreement from template.

**Request Body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "client_id": "uuid (required)",
  "template_id": "uuid (required)",
  "quote_id": "uuid (optional)",
  "effective_date": "date (required)",
  "expiry_date": "date (required)",
  "custom_variables": {
    "variable_name": "variable_value"
  },
  "performance_metrics": {
    "uptime_target": "number (90-100)",
    "response_time_hours": "number (0.1-168)",
    "resolution_time_hours": "number (1-8760)"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "agreement_number": "SLA-2025-001",
    "package_type": "ecom_site",
    "status": "draft",
    "substituted_variables": [
      {
        "variable_name": "client_name",
        "value": "Acme Corporation",
        "data_source": "client.name"
      }
    ],
    "created_at": "2025-01-09T10:00:00Z"
  }
}
```

#### GET /api/sla/agreements/{id}

Retrieve a specific service agreement.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "agreement_number": "string",
    "client": {
      "id": "uuid",
      "name": "string",
      "email": "string"
    },
    "template": {
      "id": "uuid",
      "name": "string",
      "package_type": "ecom_site"
    },
    "final_content": "string",
    "substituted_variables": [],
    "performance_metrics": {},
    "status": "draft",
    "effective_date": "date",
    "expiry_date": "date",
    "package_type": "ecom_site",
    "template_version_used": 1,
    "user_edits": "string",
    "created_at": "date",
    "updated_at": "date"
  }
}
```

#### PUT /api/sla/agreements/{id}

Update an existing service agreement.

**Request Body:** Same as POST with all fields optional (except validation).

#### DELETE /api/sla/agreements/{id}

Delete a service agreement (soft delete, only possible for draft status).

#### POST /api/sla/agreements/{id}/preview

Preview agreement with variable substitution.

**Request Body:**
```json
{
  "custom_variables": {
    "variable_name": "variable_value"
  },
  "user_edits": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preview_content": "string",
    "substituted_variables": [
      {
        "variable_name": "client_name",
        "value": "Acme Corporation",
        "data_source": "client.name"
      }
    ],
    "missing_variables": [],
    "validation_errors": []
  }
}
```

#### POST /api/sla/agreements/{id}/finalize

Finalize agreement and generate PDF.

**Request Body:**
```json
{
  "final_content": "string (required)",
  "send_email": "boolean (default: false)",
  "email_recipients": ["string"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "agreement_number": "SLA-2025-001",
    "pdf_url": "string",
    "created_at": "2025-01-09T10:00:00Z"
  }
}
```

### 3. Variable Extraction

#### POST /api/sla/extract-variables/{quote_id}

Extract variables from quote data for SLA generation.

**Query Parameters:**
- `package_types` (string, optional): Filter by specific package types

**Response:**
```json
{
  "success": true,
  "data": {
    "quote_id": "uuid",
    "detected_packages": [
      {
        "package_type": "ecom_site",
        "items_count": 5,
        "recommended_template_id": "uuid"
      }
    ],
    "extracted_variables": {
      "client_name": {
        "value": "Acme Corporation",
        "source": "client.name",
        "confidence": "high"
      },
      "project_scope": {
        "value": "E-commerce website development",
        "source": "quote.description",
        "confidence": "medium"
      }
    },
    "missing_required_variables": [
      {
        "variable_name": "technical_contact",
        "reason": "Not found in quote data"
      }
    ]
  }
}
```

### 4. PDF Generation

#### POST /api/sla/generate-pdf/{agreement_id}

Generate PDF for finalized agreement.

**Request Body:**
```json
{
  "include_watermark": "boolean (default: false)",
  "custom_header": "string (optional)",
  "custom_footer": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pdf_url": "string",
    "file_size": "number",
    "generated_at": "date",
    "expires_at": "date"
  }
}
```

#### GET /api/sla/pdf/{agreement_id}/download

Download agreement PDF.

**Query Parameters:**
- `version` (string, optional): Specific version to download

### 5. Template Management (Admin)

#### POST /api/sla/templates/initialize

Initialize default templates for all package types (one-time setup).

**Response:**
```json
{
  "success": true,
  "data": {
    "templates_created": 4,
    "package_types": [
      "ecom_site",
      "general_website",
      "business_process_systems",
      "marketing"
    ],
    "template_ids": ["uuid1", "uuid2", "uuid3", "uuid4"]
  }
}
```

#### GET /api/sla/templates/stats

Get template usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_templates": 4,
    "total_agreements_generated": 156,
    "most_used_template": {
      "id": "uuid",
      "name": "E-commerce Site SLA Template",
      "usage_count": 89
    },
    "usage_by_package_type": {
      "ecom_site": 89,
      "general_website": 34,
      "business_process_systems": 23,
      "marketing": 10
    }
  }
}
```

### 6. Clause Library (Optional Extension)

#### GET /api/sla/clauses

Retrieve clauses from the library.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `package_type` (string, optional): Filter by package type

**Response:**
```json
{
  "success": true,
  "data": {
    "clauses": [
      {
        "id": "uuid",
        "category": "string",
        "title": "string",
        "content": "string",
        "package_types": ["ecom_site", "general_website"],
        "is_required": "boolean",
        "usage_count": "number"
      }
    ]
  }
}
```

#### POST /api/sla/clauses

Create a new clause (internal users only).

### 7. Performance Monitoring (Future Extension)

#### GET /api/sla/performance/{agreement_id}

Get performance data for a specific agreement.

**Query Parameters:**
- `period_start` (date, required): Start of monitoring period
- `period_end` (date, required): End of monitoring period

**Response:**
```json
{
  "success": true,
  "data": {
    "agreement_id": "uuid",
    "monitoring_period": {
      "start": "date",
      "end": "date"
    },
    "performance_metrics": {
      "uptime_percentage": 99.8,
      "average_response_time_hours": 1.5,
      "average_resolution_time_hours": 18,
      "total_incidents": 3,
      "critical_incidents": 1
    },
    "compliance_status": {
      "uptime": "compliant",
      "response_time": "compliant",
      "resolution_time": "warning",
      "overall": "warning"
    }
  }
}
```

#### POST /api/sla/performance/{agreement_id}/record

Record performance data point.

**Request Body:**
```json
{
  "timestamp": "date (required)",
  "metrics": {
    "uptime_percentage": "number",
    "response_time_hours": "number",
    "resolution_time_hours": "number",
    "incidents": "number",
    "critical_incidents": "number"
  },
  "data_source": "string"
}
```

### 8. Breach Management (Future Extension)

#### GET /api/sla/breaches

Retrieve breach incidents with filtering.

**Query Parameters:**
- `agreement_id` (string, optional): Filter by agreement
- `severity` (string, optional): Filter by severity
- `status` (string, optional): Filter by status
- `date_from` (date, optional): Filter by date range
- `date_to` (date, optional): Filter by date range

#### GET /api/sla/breaches/{id}

Retrieve a specific breach incident.

#### POST /api/sla/breaches

Create a new breach incident record.

**Request Body:**
```json
{
  "agreement_id": "uuid (required)",
  "incident_type": "string (required)",
  "severity": "string (required)",
  "description": "string (required)",
  "occurred_at": "date (required)",
  "affected_services": ["string"],
  "affected_users_count": "number",
  "business_impact": "string"
}
```

### 9. Signature Management (Optional Extension)

#### GET /api/sla/signatures/{agreement_id}

Get signature history for an agreement.

#### POST /api/sla/signatures/{agreement_id}/request

Request signature from client.

#### POST /api/sla/signatures/{agreement_id}/verify

Verify signature authenticity.

### 10. Reporting

#### GET /api/sla/reports/agreements

Generate SLA agreements report.

**Query Parameters:**
- `client_id` (string, optional): Specific client
- `package_type` (string, optional): Filter by package type
- `status` (string, optional): Filter by status
- `period_start` (date, required): Report period start
- `period_end` (date, required): Report period end
- `format` (string, optional): Export format (pdf, excel, csv)

**Response:**
```json
{
  "success": true,
  "data": {
    "report_data": {
      "total_agreements": 45,
      "active_agreements": 38,
      "by_package_type": {
        "ecom_site": 20,
        "general_website": 15,
        "business_process_systems": 8,
        "marketing": 2
      }
    },
    "export_url": "string"
  }
}
```

#### GET /api/sla/reports/template-usage

Generate template usage report.

**Response:**
```json
{
  "success": true,
  "data": {
    "template_usage": [
      {
        "template_id": "uuid",
        "template_name": "E-commerce Site SLA Template",
        "usage_count": 89,
        "success_rate": 95.5
      }
    ],
    "generated_at": "date"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required or invalid |
| FORBIDDEN | 403 | User lacks permission for this action |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate agreement number) |
| TEMPLATE_ERROR | 422 | Template variable validation failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |
| DATABASE_ERROR | 503 | Database connectivity issue |
| PDF_GENERATION_ERROR | 502 | PDF generation failed |

## Rate Limiting

- **General API**: 100 requests per minute per user
- **Template Operations**: 50 requests per minute per user
- **PDF Generation**: 10 requests per minute per user
- **Variable Extraction**: 30 requests per minute per user
- **Report Generation**: 5 requests per minute per user

## Template Variable System

### Variable Naming Convention

Variable names must follow these rules:
- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Case sensitive
- Cannot contain spaces or special characters
- Must be unique within a template

### Variable Types

1. **Text**: String values for names, descriptions, addresses
2. **Number**: Numeric values for metrics, targets, percentages
3. **Date**: Date values for effective dates, deadlines
4. **Boolean**: Yes/No values for optional features

### Variable Sources

Variables can be automatically extracted from:
- **Client Data**: `client.name`, `client.email`, `client.phone`
- **Quote Data**: `quote.title`, `quote.description`, `quote.total`
- **Package Data**: `package.type`, `package.description`
- **System Variables**: `current_date`, `company_name`, `agreement_number`

### Example Variable Substitution

Template content:
```
Service Level Agreement for {{client_name}}

This agreement covers {{project_scope}} with the following performance targets:
- Uptime Target: {{uptime_target}}%
- Response Time: {{response_time_hours}} hours
- Resolution Time: {{resolution_time_hours}} hours

Effective Date: {{effective_date}}
Agreement Number: {{agreement_number}}
```

After substitution:
```
Service Level Agreement for Acme Corporation

This agreement covers E-commerce website development with the following performance targets:
- Uptime Target: 99.9%
- Response Time: 2 hours
- Resolution Time: 24 hours

Effective Date: 2025-01-15
Agreement Number: SLA-2025-001
```

## Security Headers

All API responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## Pagination

List endpoints support cursor-based pagination for better performance:

**Request:**
```
GET /api/sla/agreements?limit=20&cursor=eyJpZCI6InV1aWQifQ==
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "next_cursor": "string",
      "has_next": "boolean",
      "total_count": "number"
    }
  }
}
```

## Caching

Endpoints cache responses based on data sensitivity:

- **Template data**: 1 hour cache
- **Variable extraction results**: 30 minutes cache
- **Agreement data**: 5 minutes cache
- **Report data**: 15 minutes cache
- **PDF URLs**: 1 hour cache with signed URLs

Cache-Control headers are set appropriately for each endpoint.

## Template Package Types

### E-commerce Site (ecom_site)
- **Focus**: Online stores, payment processing, inventory management
- **Key Metrics**: Uptime, payment gateway response, inventory sync times
- **Common Variables**: `{{payment_gateways}}`, `{{inventory_system}}`, `{{expected_traffic}}`

### General Website (general_website)
- **Focus**: Corporate websites, portfolios, informational sites
- **Key Metrics**: Uptime, page load times, form submission response
- **Common Variables**: `{{website_type}}`, `{{form_functionality}}`, `{{content_updates}}`

### Business Process Systems (business_process_systems)
- **Focus**: CRM, HR systems, project management tools
- **Key Metrics**: Data processing times, user access speeds, system uptime
- **Common Variables**: `{{system_type}}`, `{{user_count}}`, `{{data_sensitivity}}`

### Marketing (marketing)
- **Focus**: Digital marketing, campaign management, analytics
- **Key Metrics**: Ad delivery times, content publication SLA, reporting accuracy
- **Common Variables**: `{{ad_platforms}}`, `{{content_types}}`, `{{campaign_duration}}`

This API specification provides a comprehensive foundation for the Template-Based SLA Generation System with clear focus on template management, variable substitution, and streamlined agreement generation.