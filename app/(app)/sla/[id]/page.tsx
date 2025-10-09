// SLA Display Page
// Shows generated SLA with options for editing, signing, and management

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Edit,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { ServiceAgreement, SLATemplateVariables } from '@/lib/sla-types';
import { SLAPDFPreview } from '@/components/ui/sla-pdf-preview';
import type { Client, CompanySettings } from '@/lib/invoice-types';

interface SLAWithDetails extends ServiceAgreement {
  quote?: {
    quote_number: string;
    total_incl_vat: number;
    clients: {
      name: string;
      company: string;
      email: string;
    };
  };
  template?: {
    name: string;
    description: string;
  };
  client?: Client;
  company_settings?: CompanySettings;
}

export default function SLAPage() {
  const params = useParams();
  const router = useRouter();
  const [sla, setSla] = useState<SLAWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSLA();
  }, [params.id]);

  const fetchSLA = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sla/${params.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch SLA');
      }

      const data = await response.json();
      setSla(data.sla);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/sla/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchSLA(); // Refresh SLA data
      }
    } catch (err) {
      console.error('Error updating SLA status:', err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/sla/${params.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SLA-${sla?.agreement_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  const handleViewPDF = () => {
    setShowPreview(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: Clock, label: 'Draft' },
      generated: { variant: 'default' as const, icon: FileText, label: 'Generated' },
      sent: { variant: 'outline' as const, icon: Send, label: 'Sent' },
      accepted: { variant: 'default' as const, icon: CheckCircle, label: 'Accepted' },
      rejected: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Rejected' },
      expired: { variant: 'secondary' as const, icon: AlertTriangle, label: 'Expired' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !sla) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading SLA</h3>
              <p className="text-muted-foreground">{error || 'SLA not found'}</p>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const variables = sla.agreement_variables as SLATemplateVariables;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Service Level Agreement
            </h1>
            <p className="text-muted-foreground">
              Agreement #{sla.agreement_number}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(sla.status)}
          <Button onClick={handleViewPDF} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Preview PDF
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Client</p>
                <p className="text-xs text-muted-foreground">
                  {sla.quote?.clients.company}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Contract Value</p>
                <p className="text-xs text-muted-foreground">
                  R{sla.quote?.total_incl_vat.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Uptime Guarantee</p>
                <p className="text-xs text-muted-foreground">
                  {sla.uptime_guarantee}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Response Time</p>
                <p className="text-xs text-muted-foreground">
                  {sla.response_time_hours}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Agreement Content</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="tracking">Performance Tracking</TabsTrigger>
          <TabsTrigger value="breaches">Breach Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Agreement Details
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {sla.status === 'generated' && (
                    <Button
                      onClick={() => handleStatusUpdate('sent')}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to Client
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Parties Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Parties</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Service Provider</h4>
                    <p className="text-sm text-muted-foreground">
                      INNOVATION IMPERIAL
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Client</h4>
                    <p className="text-sm text-muted-foreground">
                      {sla.quote?.clients.company}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {sla.quote?.clients.name}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Service Description */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Service Description</h3>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm">
                    {variables.service_description || 'Custom software development services including design, development, testing, and deployment.'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Performance Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sla.uptime_guarantee}%
                    </div>
                    <div className="text-sm text-muted-foreground">Uptime Guarantee</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sla.response_time_hours}h
                    </div>
                    <div className="text-sm text-muted-foreground">Response Time</div>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sla.resolution_time_hours}h
                    </div>
                    <div className="text-sm text-muted-foreground">Resolution Time</div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Terms */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Financial Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Penalty Rate</span>
                      <span className="text-sm">{sla.penalty_percentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Penalty Cap</span>
                      <span className="text-sm">{sla.penalty_cap_percentage}%</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Penalties calculated monthly based on service fees
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signatures Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Agreement Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Service Provider</h4>
                    <div className="space-y-2">
                      <p className="text-sm">Mcmarsh Dzwimbu</p>
                      <p className="text-sm text-muted-foreground">Chief Operating Officer</p>
                      <p className="text-sm text-muted-foreground">INNOVATION IMPERIAL</p>
                      {sla.signature_status === 'signed' ? (
                        <Badge variant="default" className="w-fit">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Signed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit">
                          Pending Signature
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Client</h4>
                    <div className="space-y-2">
                      <p className="text-sm">{sla.quote?.clients.name}</p>
                      <p className="text-sm text-muted-foreground">Authorized Signatory</p>
                      <p className="text-sm text-muted-foreground">{sla.quote?.clients.company}</p>
                      <Badge variant="outline" className="w-fit">
                        Pending Signature
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Performance tracking dashboard will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Performance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Historical performance data and trends will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches">
          <Card>
            <CardHeader>
              <CardTitle>Breach Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                SLA breach incidents and penalty calculations will be managed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SLA Preview Dialog */}
      {sla && sla.client && sla.company_settings && (
        <SLAPDFPreview
          serviceAgreement={sla}
          client={sla.client}
          settings={sla.company_settings}
          isOpen={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </div>
  );
}