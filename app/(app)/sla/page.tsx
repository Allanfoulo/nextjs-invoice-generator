'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  FileText,
  Activity,
  TrendingUp,
  Users,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Eye,
  Edit,
  Download,
  Search,
  Filter
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { slaService } from '@/lib/sla/sla-service';
import { SLATemplate, ServiceAgreement, PackageType } from '@/lib/sla/sla-types';
import TemplateSelector from '@/components/sla/template-selector';
import Link from 'next/link';

/**
 * Mobile-first SLA Dashboard Page
 *
 * Main dashboard for SLA management with:
 * - Quick stats and overview
 * - Recent activity
 * - Template management shortcuts
 * - Performance metrics
 * - Mobile-optimized responsive design
 */
export default function SLADashboard() {
  const [templates, setTemplates] = useState<SLATemplate[]>([]);
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([]);
  const [stats, setStats] = useState<{
    total_templates: number;
    total_agreements: number;
    active_agreements: number;
    most_used_template: SLATemplate | null;
    usage_by_package_type: Record<PackageType, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Responsive state tracking
  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch templates
      const templatesResult = await slaService.getTemplates({ limit: 10 });
      if (templatesResult.success) {
        setTemplates(templatesResult.data);
      }

      // Fetch template stats
      const statsResult = await slaService.getTemplateStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      // TODO: Fetch agreements when service agreement service is implemented
      // setAgreements(agreementsResult.data);

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSLA = () => {
    setShowTemplateSelector(true);
  };

  const handleTemplateSelect = (template: SLATemplate) => {
    // Navigate to SLA creation page with selected template
    window.location.href = `/sla/create?template_id=${template.id}`;
  };

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
              <h2 className="text-lg font-semibold mb-2">Dashboard Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'draft':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'expired':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getPackageTypeIcon = (packageType: PackageType) => {
    switch (packageType) {
      case 'ecom_site':
        return '🛒';
      case 'general_website':
        return '🌐';
      case 'business_process_systems':
        return '⚙️';
      case 'marketing':
        return '📈';
      default:
        return '📄';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-4' : ''}`}>
        <div>
          <h1 className={`font-bold ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
            SLA Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your Service Level Agreements and templates
          </p>
        </div>

        <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
          <Button
            onClick={handleCreateSLA}
            className="flex gap-2"
            size={isMobile ? 'sm' : 'default'}
          >
            <Plus className="h-4 w-4" />
            {isMobile ? 'Create SLA' : 'Create New SLA'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_templates}</div>
              <p className="text-xs text-muted-foreground">Available templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agreements</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_agreements_generated}</div>
              <p className="text-xs text-muted-foreground">Total generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_agreements}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold line-clamp-1">
                {stats.most_used_template?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Used {stats.most_used_template?.usage_count || 0} times
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Package Type Usage */}
      {stats && stats.usage_by_package_type && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Usage by Package Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
              {Object.entries(stats.usage_by_package_type).map(([packageType, count]) => (
                <div key={packageType} className="text-center">
                  <div className="text-2xl mb-1">{getPackageTypeIcon(packageType as PackageType)}</div>
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {packageType.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <TabsTrigger value="overview" className="flex gap-2">
            <BarChart3 className="h-4 w-4" />
            {isMobile ? 'Overview' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex gap-2">
            <FileText className="h-4 w-4" />
            {isMobile ? 'Templates' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="agreements" className="flex gap-2">
            <Activity className="h-4 w-4" />
            {isMobile ? 'Agreements' : 'Agreements'}
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex gap-2">
            <Clock className="h-4 w-4" />
            {isMobile ? 'Recent' : 'Recent'}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className={`grid gap-6 ${isTablet ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common SLA management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleCreateSLA}
                  className="w-full justify-start gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Create New SLA
                </Button>
                <Link href="/sla/templates">
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <Package className="h-4 w-4" />
                    Browse Templates
                  </Button>
                </Link>
                <Link href="/sla/reports">
                  <Button
                    className="w-full justify-start gap-2"
                    variant="outline"
                  >
                    <BarChart3 className="h-4 w-4" />
                    View Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Templates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Templates</CardTitle>
                  <Link href="/sla/templates">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {templates.slice(0, 5).map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-1">
                            {template.name}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {template.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {template.package_type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Used {template.usage_count}x
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/sla/templates/${template.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>
                Browse and manage your SLA templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="h-96">
                <TemplateSelector
                  onTemplateSelect={handleTemplateSelect}
                  className="border-none p-0"
                  maxHeight="400px"
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Agreements</CardTitle>
              <CardDescription>
                Manage your active and archived SLA agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No agreements yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first SLA agreement to get started
                </p>
                <Button onClick={handleCreateSLA}>
                  Create First SLA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Tab */}
        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest SLA-related activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                <p className="text-muted-foreground">
                  Your recent SLA activities will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Selector Dialog */}
      <Dialog open={showTemplateSelector} onOpenChange={setShowTemplateSelector}>
        <DialogContent className={isMobile ? 'w-[95vw] max-w-none' : 'max-w-4xl'}>
          <DialogHeader>
            <DialogTitle>Select Template</DialogTitle>
            <DialogDescription>
              Choose a template to start creating your SLA
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <TemplateSelector
              onTemplateSelect={(template) => {
                handleTemplateSelect(template);
                setShowTemplateSelector(false);
              }}
              className="border-none p-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}