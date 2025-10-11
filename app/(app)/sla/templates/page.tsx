'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  X,
  Filter,
  Grid,
  List,
  Eye,
  Edit,
  Copy,
  Download,
  Plus,
  Package,
  Clock,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { slaService } from '@/lib/sla/sla-service';
import { SLATemplate, PackageType } from '@/lib/sla/sla-types';
import TemplateSelector from '@/components/sla/template-selector';
import VariablePreview from '@/components/sla/variable-preview';
import Link from 'next/link';

/**
 * Mobile-optimized Template Library Page
 *
 * Comprehensive template browsing and management interface with:
 * - Advanced filtering and search
 * - Multiple view modes (grid/list)
 * - Template preview and editing
 * - Package type categorization
 * - Usage statistics
 * - Touch-optimized mobile interface
 */
export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<SLATemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<SLATemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPackageType, setSelectedPackageType] = useState<PackageType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage_count' | 'created_at'>('usage_count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [windowWidth, setWindowWidth] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SLATemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [stats, setStats] = useState<{
    total_templates: number;
    total_agreements_generated: number;
    most_used_template: SLATemplate | null;
    usage_by_package_type: Record<PackageType, number>;
  } | null>(null);

  // Responsive state
  useEffect(() => {
    setIsClient(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      // Auto-adjust view mode based on screen size
      if (window.innerWidth < 640) {
        setViewMode('list');
      } else if (window.innerWidth >= 1024) {
        setViewMode('grid');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch templates and stats
  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, []);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await slaService.getTemplates({
        limit: 100,
        package_type: selectedPackageType !== 'all' ? selectedPackageType : undefined,
        search: searchTerm || undefined,
      });

      if (result.success) {
        setTemplates(result.data);
      } else {
        setError(result.error || 'Failed to fetch templates');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Template fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPackageType, searchTerm]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const result = await slaService.getTemplateStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...templates];

    // Apply package type filter
    if (selectedPackageType !== 'all') {
      filtered = filtered.filter(template => template.package_type === selectedPackageType);
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usage_count':
          comparison = (a.usage_count || 0) - (b.usage_count || 0);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredTemplates(filtered);
  }, [templates, selectedPackageType, searchTerm, sortBy, sortOrder]);

  const handleTemplateSelect = (template: SLATemplate) => {
    // Navigate to template detail page
    window.location.href = `/sla/templates/${template.id}`;
  };

  const handlePreviewTemplate = (template: SLATemplate) => {
    setPreviewTemplate(template);
  };

  const handleCloneTemplate = async (template: SLATemplate, newName: string) => {
    try {
      const result = await slaService.cloneTemplate(template.id, newName);
      if (result.success) {
        // Refresh templates
        fetchTemplates();
        // Show success message
        alert('Template cloned successfully!');
      } else {
        alert('Failed to clone template: ' + result.error);
      }
    } catch (err) {
      alert('Error cloning template');
      console.error('Clone error:', err);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPackageType('all');
    setSortBy('usage_count');
    setSortOrder('desc');
  };

  const getPackageTypeInfo = (packageType: PackageType) => {
    const info = {
      ecom_site: {
        icon: '🛒',
        label: 'E-commerce Site',
        description: 'Online stores and retail platforms',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      general_website: {
        icon: '🌐',
        label: 'General Website',
        description: 'Corporate and informational websites',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      business_process_systems: {
        icon: '⚙️',
        label: 'Business Process',
        description: 'CRM, ERP, and process automation',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      marketing: {
        icon: '📈',
        label: 'Marketing',
        description: 'Digital marketing and campaigns',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      }
    };
    return info[packageType];
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-lg font-semibold mb-2">Error Loading Templates</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchTemplates}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className={`flex flex-col ${isMobile ? 'gap-4' : 'items-center justify-between'}`}>
        <div>
          <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            Template Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and manage your SLA templates
          </p>
        </div>

        <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
          <Button onClick={() => setShowCreateDialog(true)} className="flex gap-2">
            <Plus className="h-4 w-4" />
            {isMobile ? 'Create' : 'Create Template'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold">{stats.total_templates}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Generated SLAs</p>
                  <p className="text-2xl font-bold">{stats.total_agreements_generated}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Most Used</p>
                  <p className="text-lg font-bold line-clamp-1">
                    {stats.most_used_template?.name || 'N/A'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Usage</p>
                  <p className="text-2xl font-bold">
                    {stats.total_templates > 0
                      ? Math.round(stats.total_agreements_generated / stats.total_templates)
                      : 0}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className={`flex flex-col gap-4 ${isMobile ? '' : 'items-center'}`}>
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
              {/* Package Type Filter */}
              <Select
                value={selectedPackageType}
                onValueChange={(value) => setSelectedPackageType(value as PackageType | 'all')}
              >
                <SelectTrigger className={`w-48 ${isMobile ? 'text-sm' : ''}`}>
                  <SelectValue placeholder="Package Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Package Types</SelectItem>
                  <SelectItem value="ecom_site">🛒 E-commerce</SelectItem>
                  <SelectItem value="general_website">🌐 General Website</SelectItem>
                  <SelectItem value="business_process_systems">⚙️ Business Process</SelectItem>
                  <SelectItem value="marketing">📈 Marketing</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'usage_count' | 'created_at')}>
                <SelectTrigger className={`w-40 ${isMobile ? 'text-sm' : ''}`}>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage_count">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Usage Count
                    </div>
                  </SelectItem>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Name
                    </div>
                  </SelectItem>
                  <SelectItem value="created_at">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      Created
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex gap-1"
              >
                {sortOrder === 'desc' ? <TrendingUp className="h-3 w-3" /> : <TrendingUp className="h-3 w-3 rotate-180" />}
                {isMobile ? '' : sortOrder === 'desc' ? 'Desc' : 'Asc'}
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Clear Filters */}
              {(selectedPackageType !== 'all' || searchTerm) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex gap-1"
                >
                  <X className="h-3 w-3" />
                  {isMobile ? '' : 'Clear'}
                </Button>
              )}
            </div>
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
                    onClick={() => setSearchTerm('')}
                    className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          {selectedPackageType !== 'all' && ` for ${selectedPackageType}`}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* Templates Display */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? (isTablet ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3') : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or create a new template
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? (isTablet ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3') : 'grid-cols-1'}`}>
          {filteredTemplates.map((template) => {
            const packageInfo = getPackageTypeInfo(template.package_type);

            return (
              <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{packageInfo.icon}</span>
                        <Badge className={packageInfo.color}>
                          {packageInfo.label}
                        </Badge>
                        {template.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2 leading-tight">
                        {template.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {template.description}
                      </CardDescription>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/sla/templates/${template.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCloneTemplate(template, `${template.name} (Clone)`)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => window.location.href = `/sla/templates/${template.id}`}>
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Quick Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="font-medium">{template.usage_count}</span>
                    </div>

                    {/* Performance Metrics Preview */}
                    {template.default_metrics && (
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
                    )}

                    {/* Description */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {packageInfo.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {template.is_customizable && (
                        <Badge variant="outline" className="text-xs">
                          Customizable
                        </Badge>
                      )}
                      {template.requires_legal_review && (
                        <Badge variant="destructive" className="text-xs">
                          Legal Review
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        v{template.version}
                      </Badge>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-4 border-t">
                    <Button
                      className="w-full"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
          <DialogContent className={`${isMobile ? 'w-[95vw] max-w-none' : 'max-w-6xl max-h-[90vh]'}`}>
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Preview how this template will look with your data
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              <VariablePreview
                template={previewTemplate}
                readOnly={true}
                showAdvancedOptions={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Template Dialog */}
      {showCreateDialog && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className={isMobile ? 'w-[95vw]' : 'max-w-md'}>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Start with a blank template or clone an existing one
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                onClick={() => {
                  window.location.href = '/sla/templates/create';
                  setShowCreateDialog(false);
                }}
                className="w-full"
              >
                Create from Scratch
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  // Scroll to templates list
                  document.getElementById('templates-list')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full"
              >
                Clone Existing Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}