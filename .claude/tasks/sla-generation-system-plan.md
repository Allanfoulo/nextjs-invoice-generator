# SLA Generation System Implementation Plan

## Overview
Redesign the SLA Agreement creation process to mirror the quote and invoice preview and PDF generation features. Implement automated workflow triggered by status changes and manual generation options.

## Current State Analysis


### Existing Quote/Invoice System
- **Preview Components**: `quote-pdf-preview.tsx` and `invoice-pdf-preview.tsx`
- **PDF Generation**: Client-side using jsPDF and html2canvas
- **API Routes**: `/api/quotes/[id]/pdf/route.ts` and `/api/invoices/[id]/pdf/route.ts`
- **Architecture**: Component-based with dialog preview, download functionality, and responsive design

### Existing SLA System
- **Types**: Comprehensive type definitions in `sla-types.ts`
- **Service Layer**: Business logic in `sla-service.ts` with automated generation capabilities
- **Template**: React component `sla-template.tsx` replicating the megasol service agreement PDF
- **Database**: Service agreements table with automation tracking fields
- **Missing**: Preview component and PDF generation mirroring quote/invoice system

## Implementation Plan

### Phase 1: SLA Preview Component (Mirrors Quote/Invoice Preview)
**File**: `components/ui/sla-pdf-preview.tsx`
- Copy structure from `quote-pdf-preview.tsx`
- Integrate with existing `SLATemplate` component
- Add status-based watermarks (draft, generated, sent, accepted)
- Include scrollable preview dialog
- Add download PDF functionality

### Phase 2: SLA PDF Generation API
**File**: `app/api/sla/[id]/pdf/route.ts`
- Mirror the quote/invoice PDF generation approach
- Use `SLATemplate` component for HTML generation
- Include authentication and permission checks
- Return HTML for client-side PDF conversion

### Phase 3: Enhanced SLA Service Integration
**File**: `lib/sla-service.ts` (Updates)
- Enhance automated generation triggers
- Add comprehensive variable mapping from quotes
- Integrate with existing quote status changes
- Add error handling and retry logic

### Phase 4: Automation Triggers
**Files**: Multiple
- Add SLA generation trigger to quote status change handlers
- Implement webhook-style triggers for invoice creation
- Add manual generation buttons to quote/invoice UIs
- Create SLA generation status indicators

### Phase 5: UI Integration
**Files**: Quote and Invoice components
- Add "Generate SLA" buttons to accepted quotes
- Add SLA preview links to related quotes/invoices
- Include SLA status in project dashboards
- Add manual generation override options

## Technical Architecture

### Data Flow
1. **Trigger**: Quote status changes to "accepted" OR manual generation request
2. **Extraction**: Pull variables from quote, client, and company settings
3. **Generation**: Create service agreement record with populated template
4. **Preview**: Display SLA in modal dialog using `SLATemplate` component
5. **Download**: Generate PDF using jsPDF and html2canvas (client-side)

### Variable Mapping Strategy
**Extract from Quote**:
- Client information (name, company, email, address)
- Financial terms (total value, deposit percentage, amounts)
- Project scope (from quote items and descriptions)
- Timeline and warranty information

**Default Values**:
- Service provider information (INNOVATION IMPERIAL)
- Performance metrics (99.5% uptime, 24h response, 72h resolution)
- Legal terms (South African law, standard clauses)
- Support terms (3 months warranty, business hours)

### Automation Triggers
**Primary Triggers**:
- Quote status changes to "accepted"
- Invoice creation from accepted quote
- Manual generation from UI

**Fallback Triggers**:
- Scheduled batch processing for missed triggers
- Manual admin override for failed automations
- API endpoint for external system triggers

## File Structure

### New Files
- `components/ui/sla-pdf-preview.tsx` - Main preview component
- `app/api/sla/[id]/pdf/route.ts` - PDF generation API

### Modified Files
- `lib/sla-service.ts` - Enhanced automation and variable mapping
- `app/(app)/quotes/[id]/page.tsx` - Add SLA generation UI
- `components/layout/app-sidebar.tsx` - Add SLA section navigation
- Quote/invoice components - Add SLA status indicators and links

### Integration Points
- Quote status change handlers
- Invoice creation workflows
- Client dashboard views
- Project management interfaces

## Success Criteria

### Functional Requirements
✅ Automated SLA generation on quote acceptance
✅ Manual SLA generation option
✅ Preview functionality matching quote/invoice system
✅ PDF download capability
✅ Variable population from existing data
✅ Error handling and retry mechanisms

### Technical Requirements
✅ Consistent UI/UX with existing quote/invoice preview
✅ Responsive design for mobile compatibility
✅ Authentication and permission checks
✅ Database integrity and audit trails
✅ Performance optimization for large documents

### Business Requirements
✅ Maintains data integrity
✅ Supports customization when needed
✅ Integrates smoothly with existing workflows
✅ Provides manual override options
✅ Includes proper status tracking and reporting

## Implementation Tasks

1. **Create SLA preview component** - Mirror quote/invoice preview structure
2. **Build PDF generation API** - Server-side HTML generation with client-side PDF creation
3. **Enhance automation triggers** - Integrate with quote status changes
4. **Add manual generation options** - UI buttons and API endpoints
5. **Implement variable mapping** - Comprehensive data extraction from quotes
6. **Add error handling** - Retry logic and fallback mechanisms
7. **Create status tracking** - Visual indicators and progress reporting
8. **Test complete workflow** - End-to-end testing with various scenarios

## Risk Mitigation

### Technical Risks
- **PDF generation failures** → Implement retry logic and fallback templates
- **Variable mapping errors** → Add validation and default value fallbacks
- **Performance issues** → Optimize template rendering and PDF generation

### Business Risks
- **Automation failures** → Manual override options and admin notifications
- **Data integrity issues** → Comprehensive validation and audit trails
- **User adoption** → Consistent UI/UX and clear documentation

## Timeline Estimate

**Phase 1-2**: 2-3 days (Core preview and PDF generation)
**Phase 3-4**: 2-3 days (Automation and triggers)
**Phase 5**: 1-2 days (UI integration and testing)
**Total**: 5-8 days for complete implementation

## Next Steps

1. Start with Phase 1: Create the SLA preview component
2. Implement Phase 2: PDF generation API
3. Add automation triggers in Phase 3
4. Complete UI integration in Phase 4
5. Comprehensive testing and refinement

This plan ensures a robust SLA generation system that seamlessly integrates with the existing quote and invoice workflows while providing automated and manual generation capabilities.