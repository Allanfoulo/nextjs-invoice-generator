// SLA Helper Functions
// Utilities for SLA generation and management

import { supabase } from './supabase';
import { ServiceAgreement } from './sla-types';
import { Quote } from './invoice-types';

export interface SLAGenerationStatus {
  hasSLA: boolean;
  sla?: ServiceAgreement;
  canGenerate: boolean;
  reason?: string;
}

/**
 * Check if a quote has an existing SLA and if a new one can be generated
 */
export async function getSLAStatusForQuote(quoteId: string): Promise<SLAGenerationStatus> {
  try {
    // Get existing SLAs for this quote
    const { data: existingSLAs, error } = await supabase
      .from('service_agreements')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking SLA status:', error);
      return {
        hasSLA: false,
        canGenerate: false,
        reason: 'Error checking SLA status'
      };
    }

    // Check if there's an existing SLA
    if (existingSLAs && existingSLAs.length > 0) {
      const sla = existingSLAs[0];

      // Don't allow generation if SLA is not in a terminal state
      if (sla.status === 'draft' || sla.status === 'generated' || sla.status === 'sent') {
        return {
          hasSLA: true,
          sla,
          canGenerate: false,
          reason: `SLA already exists and is ${sla.status.replace('_', ' ')}`
        };
      }

      // Allow regeneration for rejected or expired SLAs
      if (sla.status === 'rejected' || sla.status === 'expired') {
        return {
          hasSLA: true,
          sla,
          canGenerate: true,
          reason: `Previous SLA was ${sla.status.replace('_', ' ')}. New SLA can be generated.`
        };
      }

      return {
        hasSLA: true,
        sla,
        canGenerate: false,
        reason: 'SLA already exists and is active'
      };
    }

    // No existing SLA
    return {
      hasSLA: false,
      canGenerate: true
    };

  } catch (error) {
    console.error('Error checking SLA status:', error);
    return {
      hasSLA: false,
      canGenerate: false,
      reason: 'Error checking SLA status'
    };
  }
}

/**
 * Check if a quote is eligible for SLA generation based on its status
 */
export function isQuoteEligibleForSLA(quote: Quote): { eligible: boolean; reason?: string } {
  // Both 'sent' and 'accepted' quotes are eligible for SLA generation
  if (quote.status !== 'sent' && quote.status !== 'accepted') {
    return {
      eligible: false,
      reason: `Quote must be in "sent" or "accepted" status. Current status: ${quote.status.replace('_', ' ')}`
    };
  }

  // Check if quote is not expired
  if (new Date(quote.validUntil) < new Date()) {
    return {
      eligible: false,
      reason: 'Quote has expired'
    };
  }

  // Check if quote has a reasonable total value (optional business rule)
  if (quote.totalInclVat <= 0) {
    return {
      eligible: false,
      reason: 'Quote must have a positive value'
    };
  }

  return {
    eligible: true
  };
}

/**
 * Generate SLA for a quote
 */
export async function generateSLAForQuote(quoteId: string, triggerSource: string = 'manual'): Promise<{ success: boolean; sla?: ServiceAgreement; error?: string }> {
  try {
    // Import SLAService dynamically to avoid circular dependencies
    const { SLAService } = await import('./sla-service');

    const result = await SLAService.generateSLAAutomatically(quoteId, triggerSource);

    if (result.success && result.service_agreement) {
      return {
        success: true,
        sla: result.service_agreement
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to generate SLA'
      };
    }
  } catch (error) {
    console.error('Error generating SLA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get SLA badge variant based on status
 */
export function getSLABadgeVariant(status: string) {
  switch (status) {
    case 'draft':
      return 'secondary' as const;
    case 'generated':
      return 'default' as const;
    case 'sent':
      return 'outline' as const;
    case 'accepted':
      return 'default' as const;
    case 'rejected':
      return 'destructive' as const;
    case 'expired':
      return 'outline' as const;
    default:
      return 'secondary' as const;
  }
}

/**
 * Format SLA status for display
 */
export function formatSLAStatus(status: string): string {
  return status.replace('_', ' ').toUpperCase();
}

/**
 * Check if user can perform SLA actions on a quote
 */
export function canUserManageSLA(quote: Quote, slaStatus?: string): boolean {
  // Users can manage SLAs for accepted quotes
  if (quote.status !== 'accepted') {
    return false;
  }

  // Users can regenerate SLAs that are rejected or expired
  if (slaStatus && (slaStatus === 'rejected' || slaStatus === 'expired')) {
    return true;
  }

  // Users can create new SLAs if none exist
  if (!slaStatus) {
    return true;
  }

  // Otherwise, SLA is in a state that shouldn't be changed
  return false;
}