import { createClient } from '@/lib/supabase-client';
import { SLATemplate, PackageType, ServiceAgreement } from '@/lib/sla/sla-types';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Template Usage Tracking Service
 *
 * Provides comprehensive usage tracking and analytics for SLA templates.
 * Tracks template usage, generates statistics, and provides insights.
 */

export interface TemplateUsageEvent {
  id: string;
  template_id: string;
  event_type: 'preview' | 'agreement_created' | 'agreement_signed' | 'template_viewed' | 'template_modified';
  user_id: string;
  client_id?: string;
  quote_id?: string;
  agreement_id?: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface TemplateUsageStats {
  template_id: string;
  total_usage: number;
  previews: number;
  agreements_created: number;
  agreements_signed: number;
  unique_users: number;
  conversion_rate: number;
  average_time_to_signature: number;
  last_used: Date;
  usage_trend: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export interface UsageAnalytics {
  total_templates: number;
  total_usage_events: number;
  most_used_templates: Array<{
    template: SLATemplate;
    usage_count: number;
    growth_rate: number;
  }>;
  usage_by_package_type: Record<PackageType, {
    template_count: number;
    usage_count: number;
    growth_rate: number;
  }>;
  user_engagement: {
    active_users: number;
    average_sessions_per_user: number;
    top_users: Array<{
      user_id: string;
      usage_count: number;
      templates_used: string[];
    }>;
  };
  conversion_metrics: {
    preview_to_agreement_rate: number;
    agreement_to_signature_rate: number;
    average_time_to_signature: number;
    abandonment_rate: number;
  };
  trends: {
    daily_usage: Array<{ date: string; count: number }>;
    popular_templates: Array<{ template_id: string; name: string; usage_count: number }>;
    emerging_patterns: string[];
  };
}

export class UsageTracker {
  private supabase = createClient();
  private errorHandler = new SLAErrorHandler();

  // ========================================
  // Usage Event Tracking
  // ========================================

  /**
   * Track a template usage event
   */
  async trackUsageEvent(event: Omit<TemplateUsageEvent, 'id' | 'created_at'>): Promise<{
    success: boolean;
    error?: string;
    event_id?: string;
  }> {
    const startTime = performance.now();

    try {
      logger.info('Tracking template usage event', {
        templateId: event.template_id,
        eventType: event.event_type,
        userId: event.user_id
      });

      // Validate required fields
      if (!event.template_id || !event.event_type || !event.user_id) {
        return {
          success: false,
          error: 'Missing required fields: template_id, event_type, user_id'
        };
      }

      // Create usage event record
      const { data: usageEvent, error } = await this.supabase
        .from('template_usage_events')
        .insert({
          template_id: event.template_id,
          event_type: event.event_type,
          user_id: event.user_id,
          client_id: event.client_id,
          quote_id: event.quote_id,
          agreement_id: event.agreement_id,
          metadata: event.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw this.errorHandler.handleDatabaseError('usage event creation', error);
      }

      // Update template usage count
      if (event.event_type === 'agreement_created') {
        await this.incrementTemplateUsage(event.template_id);
      }

      const duration = performance.now() - startTime;
      logger.info('Usage event tracked successfully', {
        eventId: usageEvent.id,
        templateId: event.template_id,
        eventType: event.event_type,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        event_id: usageEvent.id
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to track usage event', {
        templateId: event.template_id,
        eventType: event.event_type,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track usage event'
      };
    }
  }

  /**
   * Track multiple usage events in batch
   */
  async trackUsageEventsBatch(events: Array<Omit<TemplateUsageEvent, 'id' | 'created_at'>>): Promise<{
    success: boolean;
    error?: string;
    event_ids?: string[];
  }> {
    const startTime = performance.now();

    try {
      logger.info('Tracking batch usage events', {
        eventCount: events.length
      });

      // Validate events
      if (events.length === 0) {
        return {
          success: false,
          error: 'No events to track'
        };
      }

      // Prepare events for insertion
      const eventsData = events.map(event => ({
        template_id: event.template_id,
        event_type: event.event_type,
        user_id: event.user_id,
        client_id: event.client_id,
        quote_id: event.quote_id,
        agreement_id: event.agreement_id,
        metadata: event.metadata || {},
        created_at: new Date().toISOString()
      }));

      // Insert events
      const { data: insertedEvents, error } = await this.supabase
        .from('template_usage_events')
        .insert(eventsData)
        .select('id');

      if (error) {
        throw this.errorHandler.handleDatabaseError('batch usage events creation', error);
      }

      // Update template usage counts for agreement_created events
      const agreementCreatedEvents = events.filter(e => e.event_type === 'agreement_created');
      for (const event of agreementCreatedEvents) {
        await this.incrementTemplateUsage(event.template_id);
      }

      const duration = performance.now() - startTime;
      logger.info('Batch usage events tracked successfully', {
        eventCount: events.length,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        event_ids: insertedEvents?.map(e => e.id) || []
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to track batch usage events', {
        eventCount: events.length,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to track batch usage events'
      };
    }
  }

  // ========================================
  // Usage Statistics
  // ========================================

  /**
   * Get usage statistics for a specific template
   */
  async getTemplateUsageStats(templateId: string, days: number = 30): Promise<{
    success: boolean;
    data?: TemplateUsageStats;
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      logger.info('Fetching template usage statistics', { templateId, days });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get usage events for the template
      const { data: events, error } = await this.supabase
        .from('template_usage_events')
        .select('*')
        .eq('template_id', templateId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw this.errorHandler.handleDatabaseError('template usage stats fetch', error);
      }

      // Calculate statistics
      const stats = this.calculateTemplateStats(events || [], days);

      const duration = performance.now() - startTime;
      logger.info('Template usage statistics fetched successfully', {
        templateId,
        days,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to fetch template usage statistics', {
        templateId,
        days,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch template usage statistics'
      };
    }
  }

  /**
   * Get comprehensive usage analytics
   */
  async getUsageAnalytics(days: number = 30): Promise<{
    success: boolean;
    data?: UsageAnalytics;
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      logger.info('Fetching usage analytics', { days });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get usage events
      const { data: events, error } = await this.supabase
        .from('template_usage_events')
        .select(`
          *,
          sla_templates!inner(
            id,
            name,
            package_type,
            usage_count
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw this.errorHandler.handleDatabaseError('usage analytics fetch', error);
      }

      // Get all templates
      const { data: templates, error: templatesError } = await this.supabase
        .from('sla_templates')
        .select('*')
        .eq('is_active', true);

      if (templatesError) {
        throw this.errorHandler.handleDatabaseError('templates fetch for analytics', templatesError);
      }

      // Calculate analytics
      const analytics = this.calculateAnalytics(events || [], templates || [], days);

      const duration = performance.now() - startTime;
      logger.info('Usage analytics fetched successfully', {
        days,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: analytics
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to fetch usage analytics', {
        days,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch usage analytics'
      };
    }
  }

  /**
   * Get user-specific usage statistics
   */
  async getUserUsageStats(userId: string, days: number = 30): Promise<{
    success: boolean;
    data?: {
      total_events: number;
      templates_used: Array<{
        template_id: string;
        template_name: string;
        usage_count: number;
        last_used: Date;
      }>;
      activity_breakdown: Record<string, number>;
      usage_trend: Array<{ date: string; count: number }>;
    };
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      logger.info('Fetching user usage statistics', { userId, days });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's usage events
      const { data: events, error } = await this.supabase
        .from('template_usage_events')
        .select(`
          *,
          sla_templates!inner(
            id,
            name,
            package_type
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw this.errorHandler.handleDatabaseError('user usage stats fetch', error);
      }

      // Calculate user statistics
      const userStats = this.calculateUserStats(events || [], days);

      const duration = performance.now() - startTime;
      logger.info('User usage statistics fetched successfully', {
        userId,
        days,
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: true,
        data: userStats
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Failed to fetch user usage statistics', {
        userId,
        days,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration.toFixed(2)}ms`
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user usage statistics'
      };
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Increment template usage count
   */
  private async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('increment_template_usage', {
        p_template_id: templateId
      });

      if (error) {
        logger.warn('Failed to increment template usage', {
          templateId,
          error: error.message
        });
      }
    } catch (error) {
      logger.warn('Failed to increment template usage', {
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Calculate template statistics
   */
  private calculateTemplateStats(events: any[], days: number): TemplateUsageStats {
    const templateId = events[0]?.template_id || '';

    const stats: TemplateUsageStats = {
      template_id: templateId,
      total_usage: events.length,
      previews: events.filter(e => e.event_type === 'preview').length,
      agreements_created: events.filter(e => e.event_type === 'agreement_created').length,
      agreements_signed: events.filter(e => e.event_type === 'agreement_signed').length,
      unique_users: new Set(events.map(e => e.user_id)).size,
      conversion_rate: 0,
      average_time_to_signature: 0,
      last_used: events.length > 0 ? new Date(events[0].created_at) : new Date(),
      usage_trend: {
        daily: this.calculateDailyTrend(events, days),
        weekly: this.calculateWeeklyTrend(events, days),
        monthly: this.calculateMonthlyTrend(events, days)
      }
    };

    // Calculate conversion rates
    if (stats.previews > 0) {
      stats.conversion_rate = (stats.agreements_created / stats.previews) * 100;
    }

    // Calculate average time to signature
    const signatureEvents = events.filter(e => e.event_type === 'agreement_signed');
    if (signatureEvents.length > 0) {
      const totalTime = signatureEvents.reduce((sum, event) => {
        const createdEvent = events.find(e =>
          e.agreement_id === event.agreement_id && e.event_type === 'agreement_created'
        );
        if (createdEvent) {
          const createdTime = new Date(createdEvent.created_at);
          const signedTime = new Date(event.created_at);
          return sum + (signedTime.getTime() - createdTime.getTime());
        }
        return sum;
      }, 0);

      stats.average_time_to_signature = totalTime / signatureEvents.length / (1000 * 60 * 60); // Convert to hours
    }

    return stats;
  }

  /**
   * Calculate comprehensive analytics
   */
  private calculateAnalytics(events: any[], templates: any[], days: number): UsageAnalytics {
    // Total counts
    const totalUsageEvents = events.length;
    const totalTemplates = templates.length;

    // Most used templates
    const templateUsageMap = new Map<string, { count: number; template: any; growth: number }>();
    events.forEach(event => {
      const existing = templateUsageMap.get(event.template_id);
      if (existing) {
        existing.count++;
      } else {
        const template = templates.find(t => t.id === event.template_id);
        templateUsageMap.set(event.template_id, { count: 1, template, growth: 0 });
      }
    });

    const mostUsedTemplates = Array.from(templateUsageMap.entries())
      .map(([id, data]) => ({
        template: data.template,
        usage_count: data.count,
        growth_rate: data.growth
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Usage by package type
    const packageTypeUsage: Record<PackageType, { template_count: number; usage_count: number; growth_rate: number }> = {
      ecom_site: { template_count: 0, usage_count: 0, growth_rate: 0 },
      general_website: { template_count: 0, usage_count: 0, growth_rate: 0 },
      business_process_systems: { template_count: 0, usage_count: 0, growth_rate: 0 },
      marketing: { template_count: 0, usage_count: 0, growth_rate: 0 }
    };

    templates.forEach(template => {
      const packageType = template.package_type as PackageType;
      packageTypeUsage[packageType].template_count++;
    });

    events.forEach(event => {
      const template = templates.find(t => t.id === event.template_id);
      if (template) {
        const packageType = template.package_type as PackageType;
        packageTypeUsage[packageType].usage_count++;
      }
    });

    // User engagement
    const uniqueUsers = new Set(events.map(e => e.user_id)).size;
    const userUsageMap = new Map<string, { count: number; templates: Set<string> }>();

    events.forEach(event => {
      const existing = userUsageMap.get(event.user_id);
      if (existing) {
        existing.count++;
        existing.templates.add(event.template_id);
      } else {
        userUsageMap.set(event.user_id, { count: 1, templates: new Set([event.template_id]) });
      }
    });

    const topUsers = Array.from(userUsageMap.entries())
      .map(([userId, data]) => ({
        user_id: userId,
        usage_count: data.count,
        templates_used: Array.from(data.templates)
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Conversion metrics
    const previews = events.filter(e => e.event_type === 'preview').length;
    const agreementsCreated = events.filter(e => e.event_type === 'agreement_created').length;
    const agreementsSigned = events.filter(e => e.event_type === 'agreement_signed').length;

    // Daily usage trend
    const dailyUsage = this.calculateDailyUsageTrend(events, days);

    // Popular templates
    const popularTemplates = mostUsedTemplates.slice(0, 5).map(t => ({
      template_id: t.template.id,
      name: t.template.name,
      usage_count: t.usage_count
    }));

    return {
      total_templates: totalTemplates,
      total_usage_events: totalUsageEvents,
      most_used_templates: mostUsedTemplates,
      usage_by_package_type: packageTypeUsage,
      user_engagement: {
        active_users: uniqueUsers,
        average_sessions_per_user: uniqueUsers > 0 ? totalUsageEvents / uniqueUsers : 0,
        top_users: topUsers
      },
      conversion_metrics: {
        preview_to_agreement_rate: previews > 0 ? (agreementsCreated / previews) * 100 : 0,
        agreement_to_signature_rate: agreementsCreated > 0 ? (agreementsSigned / agreementsCreated) * 100 : 0,
        average_time_to_signature: 0, // Would need more complex calculation
        abandonment_rate: previews > 0 ? ((previews - agreementsCreated) / previews) * 100 : 0
      },
      trends: {
        daily_usage: dailyUsage,
        popular_templates: popularTemplates,
        emerging_patterns: [] // Would need pattern detection logic
      }
    };
  }

  /**
   * Calculate user statistics
   */
  private calculateUserStats(events: any[], days: number): any {
    const templatesUsedMap = new Map<string, { count: number; name: string; lastUsed: Date }>();
    const activityBreakdown: Record<string, number> = {};

    events.forEach(event => {
      // Template usage
      const existing = templatesUsedMap.get(event.template_id);
      if (existing) {
        existing.count++;
        existing.lastUsed = new Date(event.created_at);
      } else {
        templatesUsedMap.set(event.template_id, {
          count: 1,
          name: event.sla_templates?.name || 'Unknown Template',
          lastUsed: new Date(event.created_at)
        });
      }

      // Activity breakdown
      activityBreakdown[event.event_type] = (activityBreakdown[event.event_type] || 0) + 1;
    });

    const templatesUsed = Array.from(templatesUsedMap.entries())
      .map(([id, data]) => ({
        template_id: id,
        template_name: data.name,
        usage_count: data.count,
        last_used: data.lastUsed
      }))
      .sort((a, b) => b.usage_count - a.usage_count);

    const usageTrend = this.calculateDailyUsageTrend(events, days);

    return {
      total_events: events.length,
      templates_used: templatesUsed,
      activity_breakdown: activityBreakdown,
      usage_trend: usageTrend
    };
  }

  /**
   * Calculate daily trend
   */
  private calculateDailyTrend(events: any[], days: number): number[] {
    const trend = new Array(days).fill(0);
    const today = new Date();

    events.forEach(event => {
      const eventDate = new Date(event.created_at);
      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff >= 0 && daysDiff < days) {
        trend[days - daysDiff - 1]++;
      }
    });

    return trend;
  }

  /**
   * Calculate weekly trend
   */
  private calculateWeeklyTrend(events: any[], days: number): number[] {
    const weeks = Math.ceil(days / 7);
    const trend = new Array(weeks).fill(0);
    const today = new Date();

    events.forEach(event => {
      const eventDate = new Date(event.created_at);
      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysDiff / 7);

      if (weekIndex >= 0 && weekIndex < weeks) {
        trend[weeks - weekIndex - 1]++;
      }
    });

    return trend;
  }

  /**
   * Calculate monthly trend
   */
  private calculateMonthlyTrend(events: any[], days: number): number[] {
    const months = Math.ceil(days / 30);
    const trend = new Array(months).fill(0);
    const today = new Date();

    events.forEach(event => {
      const eventDate = new Date(event.created_at);
      const daysDiff = Math.floor((today.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      const monthIndex = Math.floor(daysDiff / 30);

      if (monthIndex >= 0 && monthIndex < months) {
        trend[months - monthIndex - 1]++;
      }
    });

    return trend;
  }

  /**
   * Calculate daily usage trend with dates
   */
  private calculateDailyUsageTrend(events: any[], days: number): Array<{ date: string; count: number }> {
    const trend: Array<{ date: string; count: number }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const count = events.filter(event => {
        const eventDate = new Date(event.created_at);
        return eventDate.toISOString().split('T')[0] === dateStr;
      }).length;

      trend.push({ date: dateStr, count });
    }

    return trend;
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker();