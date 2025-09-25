# System Architecture Overview

## Project Overview

The Invoice Generator is a modern web application built with Next.js 15, featuring ShadCN UI components, Supabase backend, and comprehensive authentication and authorization system.

## Technology Stack

### Frontend
- **Framework:** Next.js 15.5.3 (App Router)
- **Language:** TypeScript 5+
- **UI Library:** ShadCN UI with Radix UI primitives
- **Styling:** Tailwind CSS 4
- **State Management:** React Hooks with custom authentication
- **Forms:** React Hook Form with Zod validation
- **PDF Generation:** jsPDF + html2canvas
- **Animations:** Framer Motion

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **API:** Next.js API Routes
- **Storage:** Supabase Storage
- **Real-time:** Supabase Real-time (available)

### Development
- **Package Manager:** npm
- **Linting:** ESLint 9
- **Type Checking:** TypeScript
- **Build Tool:** Next.js built-in compiler

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   App Router    │  │   UI Components │  │    Auth Hook    │ │
│  │                 │  │                 │  │                 │ │
│  │ • (auth)        │  │ • ShadCN UI     │  │ • Token Mgmt    │ │
│  │ • (app)         │  │ • Custom        │  │ • User State    │ │
│  │ • API Routes    │  │ • Layout        │  │ • Session Mgmt  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Backend                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PostgreSQL    │  │   Supabase      │  │   Storage       │ │
│  │                 │  │   Auth          │  │                 │ │
│  │ • Tables        │  │                 │  │ • Profiles       │ │
│  │ • RLS Policies  │  │ • JWT Tokens    │  │ • Company Logos  │ │
│  │ • Triggers      │  │ • User Mgmt     │  │ • File Uploads   │ │
│  │ • Functions     │  │ • Sessions      │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
next-shadcn-auth-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   └── login/                # Login page
│   ├── (app)/                    # Protected application routes
│   │   ├── dashboard/            # Dashboard page
│   │   ├── clients/              # Client management
│   │   ├── invoices/             # Invoice management
│   │   ├── quotes/               # Quote management
│   │   ├── packages/             # Package management
│   │   ├── projects/             # Project management
│   │   ├── settings/             # Application settings
│   │   └── profile/              # User profile
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── invoices/             # Invoice-related APIs
│   │   ├── quotes/               # Quote-related APIs
│   │   └── packages/             # Package-related APIs
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── layout/                   # Layout components
│   └── ui/                       # UI component library
├── lib/                         # Utility libraries
│   ├── auth.ts                   # Authentication utilities
│   ├── supabase.ts               # Supabase client
│   ├── constants.ts              # Application constants
│   ├── mappers.ts                # Data mapping utilities
│   └── validations/              # Form validation schemas
├── docs/                        # Documentation
├── supabase/                     # Supabase migrations
└── public/                       # Static assets
```

## Key Components

### Authentication System
- **Custom Auth Hook:** `useAuth()` provides authentication state management
- **Token Management:** Cookie-based JWT token storage
- **Session Handling:** Automatic token refresh and validation
- **Route Protection:** Middleware-based route protection

### Data Flow
1. **Client Action** → **API Route** → **Supabase Query**
2. **Response** → **Component State** → **UI Update**
3. **Real-time Updates** (optional) via Supabase subscriptions

### State Management
- **Local State:** React hooks for component state
- **Auth State:** Custom useAuth hook
- **Form State:** React Hook Form with Zod validation
- **Server State:** Next.js server components and API routes

## Security Considerations

### Authentication
- JWT-based authentication with Supabase
- Secure cookie storage with SameSite=Lax
- Automatic token expiration handling
- Session management with refresh tokens

### Data Protection
- Row Level Security (RLS) on all database tables
- Input validation with Zod schemas
- CSRF protection via Next.js middleware
- Secure file upload with Supabase Storage policies

### API Security
- Route protection with authentication checks
- Input sanitization and validation
- Error handling without sensitive information exposure
- Rate limiting (can be implemented)

## Performance Optimizations

### Frontend
- Next.js App Router with server components
- Lazy loading of components
- Image optimization with Next.js Image
- Code splitting and bundling optimizations

### Backend
- Database indexing on frequently queried columns
- Efficient query patterns with Supabase
- Connection pooling via Supabase
- CDN for static assets

## Scalability Considerations

### Database
- PostgreSQL with proper indexing
- Connection pooling configuration
- Query optimization patterns
- Data archiving strategies

### Application
- Horizontal scaling with Next.js
- Caching strategies (Redis available)
- Load balancing considerations
- Monitoring and logging setup

## Development Workflow

### Local Development
1. Next.js dev server with hot reload
2. Supabase local development (optional)
3. TypeScript for type safety
4. ESLint for code quality

### Deployment
1. Vercel deployment for Next.js
2. Supabase for database and auth
3. Environment variables management
4. CI/CD pipeline integration

## Future Enhancements

### Planned Features
- Real-time notifications
- Advanced reporting and analytics
- Multi-tenant support
- Integration with payment gateways
- Mobile application

### Technical Improvements
- Advanced caching strategies
- Performance monitoring
- Automated testing suite
- Advanced error tracking
- API documentation generation

---

**Document Status:** Active
**Last Updated:** 2025-09-25
**Maintainer:** Development Team