# Database Schema Documentation

## Overview

This document describes the complete database schema for the Invoice Generator application, including all tables, relationships, constraints, and business logic.

## Database Architecture

The database uses PostgreSQL with Supabase as the backend service. It implements Row Level Security (RLS) for data protection and includes comprehensive auditing capabilities.

## Schema Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    clients      │    │     quotes      │    │    invoices     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • name          │    │ • quote_number  │    │ • invoice_number│
│ • company       │    │ • client_id (FK)│    │ • client_id (FK)│
│ • email         │    │ • status        │    │ • status        │
│ • billing_addr  │    │ • total_incl_vat│    │ • total_incl_vat│
│ • delivery_addr │    │ • created_at    │    │ • created_at    │
│ • vat_number    │    └─────────────────┘    └─────────────────┘
│ • phone         │           │                      │
│ • created_at    │           │                      │
│ • updated_at    │           │                      │
└─────────────────┘           │                      │
         │                    │                      │
         │                    ▼                      ▼
         │          ┌─────────────────┐    ┌─────────────────┐
         │          │   quote_items    │    │  invoice_items  │
         │          ├─────────────────┤    ├─────────────────┤
         │          │ • id (PK)       │    │ • id (PK)       │
         │          │ • quote_id (FK) │    │ • invoice_id(FK)│
         │          │ • item_id (FK)  │    │ • item_id (FK)  │
         │          │ • created_at    │    │ • created_at    │
         │          └─────────────────┘    └─────────────────┘
         │                    │                      │
         │                    │                      │
         │                    └──────────┬───────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│      items      │            │  packages       │
├─────────────────┤            ├─────────────────┤
│ • id (PK)       │            │ • id (PK)       │
│ • description   │            │ • name          │
│ • unit_price    │            │ • description   │
│ • qty           │            │ • price         │
│ • taxable       │            │ • created_at    │
│ • item_type     │            └─────────────────┘
│ • unit          │                     │
│ • created_at    │                     ▼
└─────────────────┘        ┌─────────────────┐
         │                │  package_items  │
         │                ├─────────────────┤
         │                │ • id (PK)       │
         │                │ • package_id(FK)│
         │                │ • item_id (FK)  │
         │                │ • created_at    │
         │                └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│company_settings │    │  auth.users     │
├─────────────────┤    ├─────────────────┤
│ • id (PK)       │    │ • id (PK)       │
│ • company_name  │    │ • email         │
│ • address       │    │ • created_at    │
│ • email         │    │ • updated_at    │
│ • phone         │    └─────────────────┘
│ • currency      │
│ • vat_percentage│
│ • next_inv_no   │
│ • next_quote_no │
│ • payment_instr │
│ • created_at    │
│ • updated_at    │
└─────────────────┘
```

## Table Definitions

### 1. `items` - Product/Service Catalog

Stores reusable items that can be used in quotes, invoices, and packages.

```sql
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  qty DECIMAL(10,2) NOT NULL DEFAULT 1,
  taxable BOOLEAN NOT NULL DEFAULT true,
  item_type item_type NOT NULL DEFAULT 'fixed',
  unit TEXT NOT NULL DEFAULT 'each',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier
- `description`: Item description
- `unit_price`: Price per unit
- `qty`: Default quantity
- `taxable`: Whether VAT applies
- `item_type`: ENUM('fixed', 'hourly', 'expense')
- `unit`: Unit of measurement
- `created_at`: Creation timestamp

**Business Rules:**
- Items are reusable across quotes, invoices, and packages
- Default quantity is 1 unit
- Most items are taxable by default

### 2. `clients` - Client Management

Stores client information for billing and contact purposes.

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  billing_address TEXT,
  delivery_address TEXT,
  vat_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier
- `name`: Contact person name
- `company`: Company name
- `email`: Contact email
- `billing_address`: Billing address
- `delivery_address`: Delivery address (if different)
- `vat_number`: VAT registration number
- `phone`: Contact phone
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Business Rules:**
- Both name and company are required
- Email is required for invoicing
- Addresses are optional but recommended

### 3. `quotes` - Quote Management

Stores quotes created for clients.

```sql
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  created_by_user_id UUID NOT NULL,
  date_issued DATE NOT NULL,
  valid_until DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subtotal_excl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_percentage DECIMAL(5,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  balance_remaining DECIMAL(10,2) DEFAULT 0,
  status quote_status NOT NULL DEFAULT 'draft',
  terms_text TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier
- `quote_number`: Unique quote number
- `created_by_user_id`: User who created the quote
- `date_issued`: Date quote was issued
- `valid_until`: Quote expiration date
- `client_id`: Associated client
- `subtotal_excl_vat`: Subtotal before VAT
- `vat_amount`: VAT amount
- `total_incl_vat`: Total including VAT
- `deposit_percentage`: Deposit percentage required
- `deposit_amount`: Deposit amount
- `balance_remaining`: Balance after deposit
- `status`: ENUM('draft', 'sent', 'accepted', 'declined', 'expired')
- `terms_text`: Custom terms and conditions
- `notes`: Additional notes
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Business Rules:**
- Quote numbers must be unique
- Valid until date must be after issue date
- Financial amounts are calculated automatically
- Status workflow: draft → sent → (accepted/declined/expired)

### 4. `invoices` - Invoice Management

Stores invoices created for clients, including those converted from quotes.

```sql
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  created_by_user_id UUID NOT NULL,
  date_issued DATE NOT NULL,
  due_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subtotal_excl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  balance_remaining DECIMAL(10,2) DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  payment_instructions JSONB NOT NULL DEFAULT '{}',
  created_from_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier
- `invoice_number`: Unique invoice number
- `created_by_user_id`: User who created the invoice
- `date_issued`: Date invoice was issued
- `due_date`: Payment due date
- `client_id`: Associated client
- `subtotal_excl_vat`: Subtotal before VAT
- `vat_amount`: VAT amount
- `total_incl_vat`: Total including VAT
- `deposit_required`: Whether deposit is required
- `deposit_amount`: Deposit amount
- `balance_remaining`: Balance after deposit
- `status`: ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue')
- `payment_instructions`: JSON payment instructions
- `created_from_quote_id`: Original quote if converted
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

**Business Rules:**
- Invoice numbers must be unique
- Due date must be after issue date
- Can be created from quotes (maintains reference)
- Financial amounts calculated automatically
- Status workflow: draft → sent → (partially_paid → paid) or overdue

### 5. `packages` - Package Management

Stores pre-defined packages of items for quick quoting.

```sql
CREATE TABLE packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id`: Unique identifier
- `name`: Package name
- `description`: Package description
- `price`: Package price
- `created_at`: Creation timestamp

**Business Rules:**
- Packages contain multiple items
- Price can be fixed or calculated from items
- Used for quick quote generation

### 6. Junction Tables

#### `quote_items`
Links quotes to items with many-to-many relationship.

#### `invoice_items`
Links invoices to items with many-to-many relationship.

#### `package_items`
Links packages to items with many-to-many relationship.

### 7. `company_settings` - Company Configuration

Stores company-wide settings and configuration.

```sql
CREATE TABLE company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  numbering_format_invoice TEXT NOT NULL DEFAULT 'INV-{seq:04d}',
  numbering_format_quote TEXT NOT NULL DEFAULT 'Q-{seq:04d}',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  next_quote_number INTEGER NOT NULL DEFAULT 1,
  terms_text TEXT NOT NULL DEFAULT '',
  payment_instructions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Data Types

### Enum Types
```sql
CREATE TYPE item_type AS ENUM ('fixed', 'hourly', 'expense');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue');
```

### JSONB Structures
Payment instructions stored as JSONB:
```json
{
  "bank": "",
  "accountName": "",
  "accountNumber": "",
  "branchCode": "",
  "swift": ""
}
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_clients_company ON clients(company);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_package_items_package_id ON package_items(package_id);
```

## Row Level Security (RLS)

All tables have RLS enabled with policies allowing authenticated users to perform operations. In production, these should be more restrictive.

## Triggers and Functions

### Auto-numbering
- Triggers for automatic invoice/quote number generation
- Functions to calculate totals and VAT amounts
- Audit trail for financial calculations

## Data Validation

### Frontend Validation
- Zod schemas for form validation
- Type checking with TypeScript
- Business rule enforcement

### Backend Validation
- Database constraints
- Trigger-based calculations
- RLS policy enforcement

## Migration Strategy

The database schema is designed to be:
- **Backward Compatible**: New fields are nullable with defaults
- **Migratable**: Changes are handled through Supabase migrations
- **Auditable**: All changes include timestamp tracking
- **Recoverable**: Soft deletes and proper foreign key constraints

---

**Document Status:** Active
**Last Updated:** 2025-09-25
**Schema Version:** 1.0