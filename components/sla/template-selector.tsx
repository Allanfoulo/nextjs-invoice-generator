'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter, ChevronDown, Eye, Clock, Package } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slaService } from '@/lib/sla/sla-service';
import { SLATemplate, PackageType } from '@/lib/sla/sla-types';

interface TemplateSelectorProps {
  packageType?: PackageType;
  onTemplateSelect?: (template: SLATemplate) => void;
  onPreviewTemplate?: (template: SLATemplate) => void;
  selectedTemplateId?: string;
  className?: string;
  showPackageFilter?: boolean;
  maxHeight?: string;
}

interface TemplateCardProps {
  template: SLATemplate;
  onSelect: (template: SLATemplate) => void;
  onPreview: (template: SLATemplate) => void;
  isSelected: boolean;
  isCompact?: boolean;
}

/**
 * Mobile-first responsive template card component
 */
const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  isSelected,
  isCompact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    if (window.innerWidth < 768) {
      // On mobile, select directly without hover
      onSelect(template);
    } else {
      onSelect(template);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(template);
  };

  const packageTypeColors: Record<PackageType, string> = {
    ecom_site: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    general_website: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    business_process_systems: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    marketing: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  const packageTypeLabels: Record<PackageType, string> = {
    ecom_site: 'E-commerce Site',
    general_website: 'General Website',
    business_process_systems: 'Business Process',
    marketing: 'Marketing',
  };

  return (
    <Card
      className={`
        relative cursor-pointer transition-all duration-200 hover:shadow-lg
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'}
        ${isCompact ? 'p-3' : 'p-4'}
        ${window.innerWidth < 768 ? 'active:scale-95' : ''}
      `}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="template-card"
    >
      <CardHeader className={isCompact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle
              className={`
                text-lg leading-tight line-clamp-2
                ${isCompact ? 'text-sm' : ''}
              `}
            >
              {template.name}
            </CardTitle>
            <Badge
              className={`
                mt-1 text-xs font-medium
                ${packageTypeColors[template.package_type]}
              `}
            >
              {packageTypeLabels[template.package_type]}
            </Badge>
          </div>

          {/* Action buttons - show on hover or mobile */}
          {(isHovered || window.innerWidth < 768) && (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewClick}
                className="h-8 w-8 p-0"
                aria-label="Preview template"
              >
                <Eye className="h-3 w-3" />
              </Button>
              {isSelected && (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className={isCompact ? 'pt-0' : 'pt-0'}>
        <CardDescription
          className={`
            text-sm text-muted-foreground line-clamp-2 mb-3
            ${isCompact ? 'text-xs line-clamp-1' : ''}
          `}
        >
          {template.description}
        </CardDescription>

        {/* Template metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span>{template.package_type}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Used {template.usage_count} times</span>
          </div>
        </div>

        {/* Performance metrics preview */}
        {template.default_metrics && !isCompact && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {template.default_metrics.uptime_target}%
                </div>
                <div className="text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {template.default_metrics.response_time_hours}h
                </div>
                <div className="text-muted-foreground">Response</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {template.default_metrics.resolution_time_hours}h
                </div>
                <div className="text-muted-foreground">Resolution</div>
              </div>
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div className="flex gap-1 mt-2">
          {template.is_active && (
            <Badge variant="secondary" className="text-xs">
              Active
            </Badge>
          )}
          {template.is_customizable && (
            <Badge variant="outline" className="text-xs">
              Customizable
            </Badge>
          )}
          {template.requires_legal_review && (
            <Badge variant="destructive" className="text-xs">
              Legal Review Required
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Mobile-first responsive template selector component
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  packageType,
  onTemplateSelect,
  onPreviewTemplate,
  selectedTemplateId,
  className = '',
  showPackageFilter = true,
  maxHeight = '600px'
}) => {
  const [templates, setTemplates] = useState<SLATemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackageType, setSelectedPackageType] = useState<PackageType | 'all'>(
    packageType || 'all'
  );
  const [isClient, setIsClient] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Handle responsive layout
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {
        page: 1,
        limit: 50,
      };

      if (selectedPackageType !== 'all') {
        filters.package_type = selectedPackageType;
      }

      if (debouncedSearchTerm) {
        filters.search = debouncedSearchTerm;
      }

      const result = await slaService.getTemplates(filters);

      if (result.success) {
        setTemplates(result.data);
      } else {
        setError(result.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPackageType, debouncedSearchTerm]);

  // Initial fetch and when filters change
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleTemplateSelect = (template: SLATemplate) => {
    onTemplateSelect?.(template);
  };

  const handlePreviewTemplate = (template: SLATemplate) => {
    onPreviewTemplate?.(template);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  if (!isClient) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="template-selector-container">
      {/* Search and Filter Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-10 ${isMobile ? 'text-base' : ''}`}
              aria-label="Search templates"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Package Type Filter */}
          {showPackageFilter && (
            <Select
              value={selectedPackageType}
              onValueChange={(value) => setSelectedPackageType(value as PackageType | 'all')}
            >
              <SelectTrigger className={`w-full sm:w-48 ${isMobile ? 'text-base' : ''}`}>
                <SelectValue placeholder="Package Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Package Types</SelectItem>
                <SelectItem value="ecom_site">E-commerce Site</SelectItem>
                <SelectItem value="general_website">General Website</SelectItem>
                <SelectItem value="business_process_systems">Business Process Systems</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Active Filters Display */}
        {(selectedPackageType !== 'all' || searchTerm) && (
          <div className="flex flex-wrap gap-2">
            {selectedPackageType !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Package: {selectedPackageType}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPackageType('all')}
                  className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                >
                  <X className="h-2 w-2" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {isMobile ? (
            // Mobile: Skeleton cards
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-3" />
                <Skeleton className="h-16 w-full" />
              </Card>
            ))
          ) : (
            // Desktop/Tablet: Grid skeleton
            <div className={`grid gap-4 ${isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-20 w-full" />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-6 text-center">
          <div className="text-muted-foreground mb-2">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          </div>
          <p className="text-sm font-medium mb-2">Failed to load templates</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTemplates} size="sm">
            Try Again
          </Button>
        </Card>
      )}

      {/* Templates Grid/List */}
      {!loading && !error && (
        <>
          {templates.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-muted-foreground mb-2">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              </div>
              <p className="text-sm font-medium mb-1">No templates found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </Card>
          ) : (
            <ScrollArea
              className={`${isMobile ? 'max-h-80' : ''}`}
              style={{ maxHeight: isMobile ? undefined : maxHeight }}
            >
              <div className={`
                ${isMobile ? 'space-y-3' :
                  isTablet ? 'grid grid-cols-2 gap-4' :
                  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}
              `}>
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                    onPreview={handlePreviewTemplate}
                    isSelected={selectedTemplateId === template.id}
                    isCompact={isMobile}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}

      {/* Results Summary */}
      {!loading && !error && templates.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Showing {templates.length} template{templates.length !== 1 ? 's' : ''}
          {selectedPackageType !== 'all' && ` for ${selectedPackageType}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;