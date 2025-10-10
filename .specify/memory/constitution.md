<!--
Sync Impact Report:
Version change: 0.0.0 → 1.0.0 (Initial constitution creation)
Modified principles: None (initial creation)
Added sections: All sections (initial creation)
Removed sections: None
Templates requiring updates:
✅ .specify/templates/plan-template.md (Constitution Check section validated)
✅ .specify/templates/spec-template.md (User story validation aligned)
⚠ .specify/templates/tasks-template.md (Needs task categorization updates for new principles)
⚠ .specify/templates/commands/*.md (May need principle references updated)
Follow-up TODOs: None - all placeholders resolved with project-specific values
-->

# Next.js Invoice Generator Constitution

## Core Principles

### I. TypeScript-First Development
TypeScript is mandatory for all new code; All interfaces and types must be explicitly defined; No `any` types allowed without compelling justification and TODO comments for proper typing; Strict type checking must be enabled and respected.

### II. Plan-First Architecture
All features must begin with a detailed implementation plan in `.claude/tasks/` directory; Plans must be reviewed and approved before implementation begins; Think MVP approach - deliver core value first, then iterate; Documentation must be updated as work progresses.

### III. Security & Privacy First
All user data must be protected through proper authentication and authorization; Input validation using Zod schemas is mandatory for all user inputs; Supabase Row Level Security (RLS) policies must be implemented on all tables; No sensitive information should be exposed in client-side code or error messages.

### IV. Modern Web Standards
The application must follow Next.js 15 App Router patterns; Server components should be used where appropriate for performance; Client components must be justified and minimized for performance; Responsive design following mobile-first principles is mandatory.

### V. Business Process Integration
The application must solve real business problems through integrated workflows; Quote-to-invoice conversion workflows must be seamless; Client data management must be centralized and consistent; SLA generation must integrate naturally with existing quote/invoice workflows.

## Technical Standards

### Technology Stack Requirements
- Frontend: Next.js 15 with App Router, React 18, TypeScript 5+
- UI Framework: ShadCN UI with Tailwind CSS v4
- Database: Supabase (PostgreSQL) with proper indexing
- Authentication: Supabase Auth with production-ready session management
- Forms: React Hook Form with Zod validation
- State Management: React hooks with local state first approach
- Testing: Jest and React Testing Library for unit tests
- Build: Next.js built-in compiler with Turbopack

### Code Quality Standards
- ESLint with Next.js configuration must pass for all commits
- TypeScript strict mode is mandatory
- Component organization must follow atomic design principles
- All API routes must have proper error handling and validation
- Database queries must use parameterized queries through Supabase client

## Development Workflow

### Feature Development Process
1. Create specification using `/speckit.specify` command
2. Generate implementation plan using `/speckit.plan` command
3. Create task breakdown using `/speckit.implement` command
4. Implement tasks with regular plan updates
5. Update documentation throughout development process
6. Review and test before merging

### Code Review Requirements
- All pull requests must pass automated tests
- TypeScript types must be properly defined
- Security implications must be considered
- Performance impact must be evaluated
- Documentation must be updated

### Database Management
- All schema changes must be done via Supabase migrations
- Database changes must be backward compatible
- RLS policies must be implemented for new tables
- Proper indexing must be added for performance

## Governance

This constitution supersedes all other development practices and guidelines. All team members must comply with these principles during development activities.

**Amendment Process**: Amendments require proposal documentation, team review, and consensus approval. Version must be incremented according to semantic versioning rules. Changes must be propagated across all dependent templates and documentation.

**Compliance Review**: All pull requests and feature implementations must verify compliance with these principles. Non-compliance must be justified with compelling technical reasons and documented for future resolution.

**Versioning Policy**:
- MAJOR version: Backward incompatible changes to core principles or governance
- MINOR version: New principles added or significant guidance expansions
- PATCH version: Clarifications, wording improvements, non-semantic refinements

**Guidance Documents**: Use `CLAUDE.md` for runtime development guidance and specific implementation details. This constitution provides the high-level framework that guides all development activities.

**Version**: 1.0.0 | **Ratified**: 2025-10-08 | **Last Amended**: 2025-10-08