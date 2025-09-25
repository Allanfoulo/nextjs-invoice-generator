# API Catalog

## Overview

This document catalogs all API endpoints in the Invoice Generator application, including their specifications, authentication requirements, and usage examples.

## API Architecture

The API follows REST principles with Next.js API Routes. All endpoints are protected by authentication middleware and return JSON responses.

### Base URL
```
/api/
```

### Response Format
All responses follow this structure:
```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "message": string
}
```

### Error Codes
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource doesn't exist
- `422`: Validation Error - Invalid input data
- `500`: Server Error - Internal server error

## Authentication Endpoints

### POST `/api/auth/login`

Authenticate user and return session token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "remember": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-09-25T10:00:00Z"
    },
    "token": "jwt_token_here"
  },
  "error": null,
  "message": "Login successful"
}
```

**Status Codes:**
- `200`: Success
- `401`: Invalid credentials
- `422`: Validation error
- `500`: Server error

## Quote Endpoints

### GET `/api/quotes`

Retrieve all quotes for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "quote_number": "Q-0001",
      "client_id": "uuid",
      "status": "draft",
      "total_incl_vat": 1500.00,
      "created_at": "2025-09-25T10:00:00Z",
      "client": {
        "id": "uuid",
        "name": "John Doe",
        "company": "ACME Corp"
      }
    }
  ],
  "error": null,
  "message": "Quotes retrieved successfully"
}
```

### GET `/api/quotes/[id]`

Retrieve a specific quote by ID.

**Parameters:**
- `id`: Quote UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quote_number": "Q-0001",
    "client_id": "uuid",
    "status": "draft",
    "total_incl_vat": 1500.00,
    "items": [
      {
        "id": "uuid",
        "description": "Web Development",
        "unit_price": 1000.00,
        "qty": 1,
        "taxable": true
      }
    ]
  },
  "error": null,
  "message": "Quote retrieved successfully"
}
```

### POST `/api/quotes`

Create a new quote.

**Request:**
```json
{
  "client_id": "uuid",
  "date_issued": "2025-09-25",
  "valid_until": "2025-10-25",
  "items": [
    {
      "description": "Web Development",
      "unit_price": 1000.00,
      "qty": 1,
      "taxable": true,
      "item_type": "fixed",
      "unit": "each"
    }
  ],
  "terms_text": "Payment due within 30 days",
  "notes": "Additional requirements discussed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quote_number": "Q-0001",
    "status": "draft",
    "total_incl_vat": 1150.00
  },
  "error": null,
  "message": "Quote created successfully"
}
```

### PUT `/api/quotes/[id]`

Update an existing quote.

**Parameters:**
- `id`: Quote UUID

**Request:**
```json
{
  "client_id": "uuid",
  "status": "sent",
  "items": [
    {
      "id": "uuid",
      "description": "Web Development",
      "unit_price": 1200.00,
      "qty": 1,
      "taxable": true
    }
  ]
}
```

### DELETE `/api/quotes/[id]`

Delete a quote.

**Parameters:**
- `id`: Quote UUID

**Response:**
```json
{
  "success": true,
  "data": null,
  "error": null,
  "message": "Quote deleted successfully"
}
```

### POST `/api/quotes/[id]/convert-to-invoice`

Convert a quote to an invoice.

**Parameters:**
- `id`: Quote UUID

**Request:**
```json
{
  "due_date": "2025-10-25",
  "deposit_required": false,
  "payment_instructions": {
    "bank": "Test Bank",
    "accountName": "Company Name",
    "accountNumber": "1234567890",
    "branchCode": "632005",
    "swift": "TESTZA00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice_id": "uuid",
    "invoice_number": "INV-0001",
    "quote_id": "uuid"
  },
  "error": null,
  "message": "Quote converted to invoice successfully"
}
```

## Invoice Endpoints

### GET `/api/invoices`

Retrieve all invoices for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-0001",
      "client_id": "uuid",
      "status": "draft",
      "total_incl_vat": 1500.00,
      "created_at": "2025-09-25T10:00:00Z",
      "client": {
        "id": "uuid",
        "name": "John Doe",
        "company": "ACME Corp"
      }
    }
  ],
  "error": null,
  "message": "Invoices retrieved successfully"
}
```

### GET `/api/invoices/[id]`

Retrieve a specific invoice by ID.

**Parameters:**
- `id`: Invoice UUID

### POST `/api/invoices`

Create a new invoice.

**Request:**
```json
{
  "client_id": "uuid",
  "date_issued": "2025-09-25",
  "due_date": "2025-10-25",
  "items": [
    {
      "description": "Web Development",
      "unit_price": 1000.00,
      "qty": 1,
      "taxable": true,
      "item_type": "fixed",
      "unit": "each"
    }
  ],
  "deposit_required": false,
  "payment_instructions": {
    "bank": "Test Bank",
    "accountName": "Company Name",
    "accountNumber": "1234567890",
    "branchCode": "632005",
    "swift": "TESTZA00"
  }
}
```

### PUT `/api/invoices/[id]`

Update an existing invoice.

**Parameters:**
- `id`: Invoice UUID

### DELETE `/api/invoices/[id]`

Delete an invoice.

**Parameters:**
- `id`: Invoice UUID

### GET `/api/invoices/[id]/pdf`

Generate PDF for an invoice.

**Parameters:**
- `id`: Invoice UUID

**Response:** PDF file download

## Client Endpoints

### GET `/api/clients`

Retrieve all clients.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "company": "ACME Corp",
      "email": "john@example.com",
      "phone": "+27 21 123 4567",
      "created_at": "2025-09-25T10:00:00Z"
    }
  ],
  "error": null,
  "message": "Clients retrieved successfully"
}
```

### GET `/api/clients/[id]`

Retrieve a specific client by ID.

**Parameters:**
- `id`: Client UUID

### POST `/api/clients`

Create a new client.

**Request:**
```json
{
  "name": "John Doe",
  "company": "ACME Corp",
  "email": "john@example.com",
  "billing_address": "123 Main St, City, Country",
  "delivery_address": "123 Main St, City, Country",
  "vat_number": "VAT123456",
  "phone": "+27 21 123 4567"
}
```

### PUT `/api/clients/[id]`

Update an existing client.

**Parameters:**
- `id`: Client UUID

### DELETE `/api/clients/[id]`

Delete a client.

**Parameters:**
- `id`: Client UUID

## Package Endpoints

### GET `/api/packages`

Retrieve all packages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Starter Package",
      "description": "Basic web development package",
      "price": 5000.00,
      "created_at": "2025-09-25T10:00:00Z"
    }
  ],
  "error": null,
  "message": "Packages retrieved successfully"
}
```

### GET `/api/packages/[id]`

Retrieve a specific package by ID.

**Parameters:**
- `id`: Package UUID

### POST `/api/packages`

Create a new package.

**Request:**
```json
{
  "name": "Starter Package",
  "description": "Basic web development package",
  "price": 5000.00,
  "items": [
    {
      "description": "Basic Website",
      "unit_price": 4000.00,
      "qty": 1,
      "taxable": true,
      "item_type": "fixed",
      "unit": "each"
    },
    {
      "description": "Hosting Setup",
      "unit_price": 1000.00,
      "qty": 1,
      "taxable": true,
      "item_type": "fixed",
      "unit": "each"
    }
  ]
}
```

### PUT `/api/packages/[id]`

Update an existing package.

**Parameters:**
- `id`: Package UUID

### DELETE `/api/packages/[id]`

Delete a package.

**Parameters:**
- `id`: Package UUID

## Settings Endpoints

### GET `/api/settings`

Retrieve company settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_name": "Your Company",
    "address": "123 Business St, City, Country",
    "email": "info@company.com",
    "phone": "+27 21 123 4567",
    "currency": "ZAR",
    "vat_percentage": 15.00,
    "terms_text": "Payment due within 30 days",
    "payment_instructions": {
      "bank": "Test Bank",
      "accountName": "Company Name",
      "accountNumber": "1234567890",
      "branchCode": "632005",
      "swift": "TESTZA00"
    }
  },
  "error": null,
  "message": "Settings retrieved successfully"
}
```

### PUT `/api/settings`

Update company settings.

**Request:**
```json
{
  "company_name": "Your Company",
  "address": "123 Business St, City, Country",
  "email": "info@company.com",
  "phone": "+27 21 123 4567",
  "currency": "ZAR",
  "vat_percentage": 15.00,
  "terms_text": "Payment due within 30 days",
  "payment_instructions": {
    "bank": "Test Bank",
    "accountName": "Company Name",
    "accountNumber": "1234567890",
    "branchCode": "632005",
    "swift": "TESTZA00"
  }
}
```

## Authentication & Authorization

### Token Management
All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Permissions
- **Authenticated Users**: Can access all endpoints (current implementation)
- **Future Enhancement**: Role-based access control (admin, manager, viewer)

### Rate Limiting
Currently not implemented but recommended for production:
- 100 requests per minute per user
- Burst limit of 200 requests

## Error Handling

### Common Errors

#### Authentication Errors
```json
{
  "success": false,
  "data": null,
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### Validation Errors
```json
{
  "success": false,
  "data": null,
  "error": "Validation failed",
  "message": "Invalid input data",
  "details": {
    "email": "Invalid email format",
    "unit_price": "Must be greater than 0"
  }
}
```

#### Not Found Errors
```json
{
  "success": false,
  "data": null,
  "error": "Not found",
  "message": "Resource not found"
}
```

## Data Validation

### Request Validation
All requests are validated using Zod schemas:
- Email format validation
- Required field validation
- Data type validation
- Business rule validation

### Response Validation
All responses are validated before sending:
- Consistent response structure
- Proper error formatting
- Type-safe data serialization

## Performance Considerations

### Database Optimization
- Indexed queries on frequently accessed fields
- Efficient joins for related data
- Pagination support for large datasets

### Response Optimization
- Selective field retrieval
- Efficient JSON serialization
- Proper HTTP caching headers

## Future Enhancements

### Planned Features
- **GraphQL API**: Alternative to REST for complex queries
- **Real-time Updates**: WebSocket support for live data
- **Batch Operations**: Bulk create/update/delete operations
- **Advanced Filtering**: Complex query parameters
- **Export/Import**: Bulk data operations

### API Improvements
- **OpenAPI Documentation**: Automatic API documentation
- **Request Logging**: Comprehensive request tracking
- **Performance Monitoring**: Response time metrics
- **Advanced Rate Limiting**: Configurable limits per endpoint
- **Webhook Support**: Event-driven notifications

---

**Document Status:** Active
**Last Updated:** 2025-09-25
**API Version:** 1.0