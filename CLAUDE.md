# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan & Review

### Before sarting work
-Write a plan to .claude/tasks/TASK_NAME.md.
-The plan shoud be a detailed implementation plan and the reasoning behind them, as well as tasks broken down.
-Don't over plan it, always think MVP
-Once you write the plan, firstly ask me to review it. Do not continue until I approve the plan.

### While implementing
-You should update the plan as you work.
-After you complete tasks in the plan, you should update and append detailed descriptions of the changes you made, so following tasks can be easily hand over to other engineers.

## Project Overview

This is a Next.js 15 invoice and quote management application built with ShadCN UI, Supabase, and TypeScript. The application provides a complete business solution for creating, managing, and tracking quotes and invoices with client management capabilities.

## Available Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production with Next.js 15
- `npm start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

### Database (Supabase)
- `npx supabase start` - Start local Supabase instance
- `npx supabase status` - Check local Supabase status
- `npx supabase db reset` - Reset local database
- Execute `database-setup.sql` in Supabase SQL editor for initial setup

## Architecture Overview

### Authentication System
- **Current Implementation**: Demo cookie-based authentication using Supabase
- **Location**: `lib/auth.ts` and `middleware.ts`
- **Important**: The middleware currently bypasses authentication for testing (line 15-16 in middleware.ts)
- **Authentication Flow**: Uses Supabase Auth with client-side cookies (not production-ready)

### Database Architecture
- **Database**: Supabase (PostgreSQL)
- **Main Tables**: company_settings, clients, quotes, invoices, items, users, packages
- **Relationships**: Quotes → Clients, Invoices → Clients, Items → Quotes/Invoices
- **Key Files**: `lib/supabase.ts` (client), `lib/mappers.ts` (data transformation)

### Data Flow Architecture
1. **Data Layer**: Supabase client in `lib/supabase.ts`
2. **Mapping Layer**: `lib/mappers.ts` converts database rows to TypeScript interfaces
3. **Type Definitions**: `lib/invoice-types.ts` contains all TypeScript interfaces
4. **UI Components**: React components in `components/` directory
5. **Pages**: Next.js app router pages in `app/` directory

### Key Architecture Patterns
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Data Transformation**: Mappers convert between database format and application types
- **Component Structure**: ShadCN UI components with custom styling
- **State Management**: React hooks with Supabase real-time subscriptions
- **Form Handling**: React Hook Form with Zod validation

## Database Schema

### Core Tables
- **company_settings**: Company information, VAT settings, numbering formats
- **clients**: Client management with billing/delivery addresses, VAT numbers
- **quotes**: Quote management with status tracking, items, deposits
- **invoices**: Invoice generation with payment tracking
- **items**: Line items for quotes and invoices (fixed price, hourly, expense)
- **packages**: Predefined packages with multiple items
- **users**: User management with role-based access

### Key Relationships
- `quotes` → `clients` (client_id)
- `invoices` → `clients` (client_id)
- `quotes` → `quote_items` → `items` (many-to-many)
- `invoices` → `invoice_items` → `items` (many-to-many)
- `packages` → `package_items` → `items` (many-to-many)

## Type System

### Core Types (lib/invoice-types.ts)
- `CompanySettings`: Company configuration and preferences
- `Client`: Client information with addresses and VAT details
- `Quote`: Quote with items, pricing, deposit requirements
- `Invoice`: Invoice with payment tracking and status
- `Item`: Line items with different pricing types
- `ItemType`: Enum for pricing types (fixed_price, hourly, expense)

### Status Enums
- `QuoteStatus`: draft, sent, accepted, rejected, expired
- `InvoiceStatus`: draft, sent, partially_paid, paid, overdue

## Important File Locations

### Core Application
- `app/(app)/`: Protected application routes
- `app/(auth)/`: Authentication routes (login)
- `components/layout/`: Layout components (header, sidebar, shell)
- `components/ui/`: ShadCN UI components
- `lib/`: Utility libraries and core functionality

### Key Configuration
- `lib/supabase.ts`: Supabase client configuration
- `lib/auth.ts`: Authentication utilities
- `lib/mappers.ts`: Data transformation functions
- `lib/constants.ts`: Application constants
- `middleware.ts`: Next.js middleware (currently bypassed)

## Development Notes

### Authentication Considerations
- The current implementation uses demo cookie-based auth
- For production: implement proper server-side authentication, RLS policies, secure cookies
- Middleware is currently bypassed for testing purposes

### Database Setup
- Always run `database-setup.sql` after Supabase setup
- The SQL script creates all required tables and initial data
- Use `npx supabase db reset` for local development

### Code Conventions
- TypeScript with strict type checking
- ShadCN UI components for consistent design
- React Hook Form with Zod validation
- Tailwind CSS for styling
- Framer Motion for animations

### Environment Variables
Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

## Testing and Quality

### Linting and Type Checking
- ESLint configured with Next.js rules
- TypeScript strict mode enabled
- Run `npm run lint` before committing

### Common Development Patterns
- Use `map<Table>Row()` functions for database transformations
- Follow the existing component structure for new features
- Use ShadCN UI components for consistency
- Implement proper TypeScript types for new data structures