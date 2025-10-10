import { Quote, Client, Item, CompanySettings } from '@/lib/invoice-types';
import { PackageType } from '@/lib/sla/sla-types';
import { logger } from '@/lib/sla/logger';
import { SLAErrorHandler } from '@/lib/sla/sla-errors';

/**
 * Package Type Detection Service
 *
 * Provides intelligent detection of SLA package types from quote data.
 * Uses keyword analysis, item classification, and pattern matching.
 */

export class PackageTypeDetector {
  private errorHandler = new SLAErrorHandler();

  // ========================================
  // Package Type Patterns and Keywords
  // ========================================

  private readonly PACKAGE_PATTERNS = {
    ecom_site: {
      keywords: [
        'ecommerce', 'e-commerce', 'online store', 'shopping cart', 'product catalog',
        'payment gateway', 'checkout', 'products', 'inventory', 'woocommerce', 'shopify',
        'magento', 'opencart', 'prestashop', 'bigcommerce', 'product management',
        'order management', 'cart system', 'online shop', 'webstore', 'digital storefront'
      ],
      item_patterns: [
        'product page', 'category page', 'shopping cart', 'checkout process',
        'payment integration', 'order management', 'inventory system', 'product search',
        'user account', 'wishlist', 'product reviews', 'shipping calculation'
      ],
      weight_factors: {
        'payment gateway': 3,
        'shopping cart': 3,
        'product catalog': 2,
        'inventory management': 2,
        'ecommerce': 3,
        'online store': 2
      }
    },
    general_website: {
      keywords: [
        'website', 'web site', 'portfolio', 'brochure', 'informational', 'blog',
        'corporate', 'business website', 'landing page', 'company website', 'presentation',
        'brand website', 'marketing website', 'showcase', 'web presence', 'online brochure'
      ],
      item_patterns: [
        'home page', 'about page', 'contact page', 'services page', 'portfolio',
        'gallery', 'blog section', 'news section', 'testimonials', 'team page',
        'faq page', 'privacy policy', 'terms of service', 'sitemap'
      ],
      weight_factors: {
        'company website': 2,
        'corporate website': 2,
        'portfolio website': 2,
        'informational website': 2,
        'landing page': 1
      }
    },
    business_process_systems: {
      keywords: [
        'crm', 'erp', 'business process', 'workflow', 'automation', 'system',
        'management system', 'dashboard', 'reporting', 'analytics', 'database',
        'business intelligence', 'process automation', 'workflow management',
        'enterprise system', 'business software', 'management platform'
      ],
      item_patterns: [
        'user management', 'role-based access', 'data entry forms', 'reporting dashboard',
        'analytics dashboard', 'workflow automation', 'process management', 'data export',
        'system integration', 'api development', 'database design', 'user authentication',
        'permission system', 'audit trail', 'notification system'
      ],
      weight_factors: {
        'crm system': 3,
        'erp system': 3,
        'business process': 2,
        'workflow management': 2,
        'management system': 2,
        'automation': 2
      }
    },
    marketing: {
      keywords: [
        'marketing', 'campaign', 'lead generation', 'seo', 'sem', 'social media',
        'email marketing', 'content marketing', 'digital marketing', 'advertising',
        'marketing automation', 'brand promotion', 'online marketing', 'web marketing'
      ],
      item_patterns: [
        'social media integration', 'email campaign', 'seo optimization', 'content management',
        'landing page', 'lead capture', 'analytics tracking', 'marketing automation',
        'brand guidelines', 'advertising banner', 'social media management',
        'email template', 'marketing dashboard', 'campaign management'
      ],
      weight_factors: {
        'digital marketing': 3,
        'marketing automation': 3,
        'lead generation': 2,
        'social media marketing': 2,
        'email marketing': 2,
        'seo optimization': 2
      }
    }
  };

  // ========================================
  // Main Detection Methods
  // ========================================

  /**
   * Detects the most likely package type from quote data
   */
  detectPackageType(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any> = {}
  ): PackageType {
    try {
      logger.info('Detecting package type from quote data', {
        quoteId: quote.id,
        itemCount: quote.items.length,
        totalValue: quote.totalInclVat
      });

      const scores = this.calculatePackageTypeScores(quote, client, additionalContext);

      // Find the package type with the highest score
      const bestMatch = Object.entries(scores).reduce((best, [type, score]) =>
        score > best.score ? { type: type as PackageType, score } : best,
        { type: 'general_website' as PackageType, score: 0 }
      );

      // Apply confidence thresholds
      const confidence = this.calculateConfidence(scores, bestMatch.type);

      logger.info('Package type detection completed', {
        quoteId: quote.id,
        detectedType: bestMatch.type,
        score: bestMatch.score,
        confidence: `${confidence}%`,
        allScores: scores
      });

      return bestMatch.type;
    } catch (error) {
      logger.error('Package type detection failed', {
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Fallback to general website
      return 'general_website';
    }
  }

  /**
   * Get detailed analysis with all package type scores
   */
  getDetailedAnalysis(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any> = {}
  ): {
    detected_type: PackageType;
    confidence: number;
    scores: Record<PackageType, number>;
    reasoning: Record<PackageType, string[]>;
  } {
    try {
      const scores = this.calculatePackageTypeScores(quote, client, additionalContext);
      const reasoning = this.generateReasoning(quote, client, additionalContext);

      const bestMatch = Object.entries(scores).reduce((best, [type, score]) =>
        score > best.score ? { type: type as PackageType, score } : best,
        { type: 'general_website' as PackageType, score: 0 }
      );

      const confidence = this.calculateConfidence(scores, bestMatch.type);

      return {
        detected_type: bestMatch.type,
        confidence,
        scores,
        reasoning
      };
    } catch (error) {
      logger.error('Detailed package analysis failed', {
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        detected_type: 'general_website',
        confidence: 0,
        scores: { ecom_site: 0, general_website: 0, business_process_systems: 0, marketing: 0 },
        reasoning: { ecom_site: [], general_website: [], business_process_systems: [], marketing: [] }
      };
    }
  }

  /**
   * Validate if a detected package type makes sense for the quote
   */
  validateDetection(
    detectedType: PackageType,
    quote: Quote,
    client: Client
  ): {
    is_valid: boolean;
    confidence: number;
    warnings: string[];
    suggestions: PackageType[];
  } {
    try {
      const scores = this.calculatePackageTypeScores(quote, client);
      const warnings: string[] = [];
      const suggestions: PackageType[] = [];

      // Check if detected type has a significant lead
      const sortedScores = Object.entries(scores).sort(([, a], [, b]) => b - a);
      const topScore = sortedScores[0][1];
      const secondScore = sortedScores[1][1];
      const scoreDifference = topScore - secondScore;

      if (scoreDifference < 2) {
        warnings.push('Low confidence in package type detection');
        suggestions.push(sortedScores[1][0] as PackageType);
      }

      if (topScore < 3) {
        warnings.push('Very weak keyword matches found');
      }

      // Value-based validation
      const valueRange = this.getExpectedValueRange(detectedType);
      if (quote.totalInclVat < valueRange.min || quote.totalInclVat > valueRange.max) {
        warnings.push(`Project value (R${quote.totalInclVat.toLocaleString()}) is outside typical range for ${detectedType.replace('_', ' ')}`);
      }

      // Item count validation
      const itemCountRange = this.getExpectedItemCountRange(detectedType);
      if (quote.items.length < itemCountRange.min || quote.items.length > itemCountRange.max) {
        warnings.push(`Item count (${quote.items.length}) is outside typical range for ${detectedType.replace('_', ' ')}`);
      }

      // Generate suggestions based on scores
      sortedScores.slice(1, 3).forEach(([type, score]) => {
        if (score >= 2) {
          suggestions.push(type as PackageType);
        }
      });

      const confidence = this.calculateConfidence(scores, detectedType);
      const isValid = confidence >= 60 && warnings.length === 0;

      return {
        is_valid: isValid,
        confidence,
        warnings,
        suggestions
      };
    } catch (error) {
      logger.error('Package type validation failed', {
        detectedType,
        quoteId: quote.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        is_valid: false,
        confidence: 0,
        warnings: ['Validation failed due to error'],
        suggestions: ['general_website']
      };
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Calculate scores for each package type
   */
  private calculatePackageTypeScores(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any> = {}
  ): Record<PackageType, number> {
    const scores: Record<PackageType, number> = {
      ecom_site: 0,
      general_website: 0,
      business_process_systems: 0,
      marketing: 0
    };

    // Prepare text data for analysis
    const textData = this.prepareTextData(quote, client, additionalContext);
    const itemsText = quote.items.map(item => item.description).join(' ').toLowerCase();

    // Analyze each package type
    for (const [packageType, patterns] of Object.entries(this.PACKAGE_PATTERNS)) {
      let score = 0;

      // Keyword matching
      for (const keyword of patterns.keywords) {
        const occurrences = this.countOccurrences(textData, keyword);
        const weight = patterns.weight_factors[keyword] || 1;
        score += occurrences * weight;
      }

      // Item pattern matching
      for (const pattern of patterns.item_patterns) {
        const occurrences = this.countOccurrences(itemsText, pattern);
        score += occurrences * 1.5; // Slightly higher weight for item patterns
      }

      // Value-based scoring
      const valueScore = this.calculateValueScore(quote.totalInclVat, packageType as PackageType);
      score += valueScore;

      // Item count-based scoring
      const itemCountScore = this.calculateItemCountScore(quote.items.length, packageType as PackageType);
      score += itemCountScore;

      scores[packageType as PackageType] = Math.round(score * 100) / 100;
    }

    return scores;
  }

  /**
   * Generate reasoning for each package type
   */
  private generateReasoning(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any> = {}
  ): Record<PackageType, string[]> {
    const reasoning: Record<PackageType, string[]> = {
      ecom_site: [],
      general_website: [],
      business_process_systems: [],
      marketing: []
    };

    const textData = this.prepareTextData(quote, client, additionalContext);
    const itemsText = quote.items.map(item => item.description).join(' ').toLowerCase();

    for (const [packageType, patterns] of Object.entries(this.PACKAGE_PATTERNS)) {
      const reasons: string[] = [];

      // Check keywords
      for (const keyword of patterns.keywords) {
        if (textData.includes(keyword.toLowerCase())) {
          const weight = patterns.weight_factors[keyword] || 1;
          reasons.push(`Found keyword: "${keyword}" (${weight > 1 ? 'high weight' : 'normal weight'})`);
        }
      }

      // Check item patterns
      for (const pattern of patterns.item_patterns) {
        if (itemsText.includes(pattern.toLowerCase())) {
          reasons.push(`Found item pattern: "${pattern}"`);
        }
      }

      // Check value alignment
      const valueRange = this.getExpectedValueRange(packageType as PackageType);
      if (quote.totalInclVat >= valueRange.min && quote.totalInclVat <= valueRange.max) {
        reasons.push(`Project value (R${quote.totalInclVat.toLocaleString()}) aligns with typical range`);
      }

      reasoning[packageType as PackageType] = reasons;
    }

    return reasoning;
  }

  /**
   * Prepare combined text data for analysis
   */
  private prepareTextData(
    quote: Quote,
    client: Client,
    additionalContext: Record<string, any>
  ): string {
    const textData = [
      // Quote data
      quote.termsText || '',
      quote.notes || '',
      quote.quoteNumber || '',

      // Client data
      client.name || '',
      client.company || '',

      // Item descriptions
      ...quote.items.map(item => item.description),

      // Additional context
      ...Object.values(additionalContext).map(value => String(value)),

      // Add item descriptions again for emphasis
      ...quote.items.map(item => item.description)
    ];

    return textData.join(' ').toLowerCase();
  }

  /**
   * Count occurrences of a keyword in text
   */
  private countOccurrences(text: string, keyword: string): number {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    // Count whole word matches
    const regex = new RegExp(`\\b${this.escapeRegex(lowerKeyword)}\\b`, 'g');
    const matches = lowerText.match(regex);

    return matches ? matches.length : 0;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate value-based score for a package type
   */
  private calculateValueScore(value: number, packageType: PackageType): number {
    const valueRange = this.getExpectedValueRange(packageType);

    if (value >= valueRange.min && value <= valueRange.max) {
      // Perfect match
      return 2;
    } else if (value < valueRange.min * 1.5) {
      // Below range but not too low
      return 1;
    } else if (value > valueRange.max * 0.7) {
      // Above range but not too high
      return 1;
    }

    return 0;
  }

  /**
   * Calculate item count-based score for a package type
   */
  private calculateItemCountScore(itemCount: number, packageType: PackageType): number {
    const itemCountRange = this.getExpectedItemCountRange(packageType);

    if (itemCount >= itemCountRange.min && itemCount <= itemCountRange.max) {
      // Perfect match
      return 1.5;
    } else if (itemCount < itemCountRange.min * 2) {
      // Below range but reasonable
      return 0.5;
    }

    return 0;
  }

  /**
   * Get expected value range for a package type
   */
  private getExpectedValueRange(packageType: PackageType): { min: number; max: number } {
    switch (packageType) {
      case 'ecom_site':
        return { min: 50000, max: 500000 };
      case 'general_website':
        return { min: 15000, max: 150000 };
      case 'business_process_systems':
        return { min: 100000, max: 1000000 };
      case 'marketing':
        return { min: 25000, max: 200000 };
      default:
        return { min: 10000, max: 1000000 };
    }
  }

  /**
   * Get expected item count range for a package type
   */
  private getExpectedItemCountRange(packageType: PackageType): { min: number; max: number } {
    switch (packageType) {
      case 'ecom_site':
        return { min: 10, max: 50 };
      case 'general_website':
        return { min: 5, max: 20 };
      case 'business_process_systems':
        return { min: 8, max: 30 };
      case 'marketing':
        return { min: 5, max: 25 };
      default:
        return { min: 3, max: 50 };
    }
  }

  /**
   * Calculate confidence percentage
   */
  private calculateConfidence(
    scores: Record<PackageType, number>,
    detectedType: PackageType
  ): number {
    const detectedScore = scores[detectedType];
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    if (totalScore === 0) {
      return 0;
    }

    const baseConfidence = (detectedScore / totalScore) * 100;

    // Boost confidence if there's a clear winner
    const sortedScores = Object.values(scores).sort((a, b) => b - a);
    if (sortedScores.length >= 2 && sortedScores[0] > sortedScores[1] * 1.5) {
      return Math.min(baseConfidence + 20, 95);
    }

    return Math.round(baseConfidence);
  }
}

// Export singleton instance
export const packageDetector = new PackageTypeDetector();