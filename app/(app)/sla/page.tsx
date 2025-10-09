// SLA Management Page
// Main page for managing all Service Level Agreements

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package
} from 'lucide-react';
import { ServiceAgreement, ServiceAgreementStatus } from '@/lib/sla-types';
import { SLAGenerator } from '@/components/sla/sla-generator';
import { EnhancedTemplateIntegration } from '@/components/sla/enhanced-template-integration';

interface SLAWithQuote extends ServiceAgreement {
  quotes?: {
    quote_number: string;
    total_incl_vat: number;
    clients?: {
      name: string;
      company: string;
    };
  };
}

interface QuoteOption {
  id: string;
  quote_number: string;
  client_name: string;
  client_company: string;
  total_incl_vat: number;
  status?: string;
  created_at?: string;
}

export default function SLAManagementPage() {
  const router = useRouter();
  const [slas, setSlas] = useState<SLAWithQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [availableQuotes, setAvailableQuotes] = useState<QuoteOption[]>([]);
  const [quoteSearchTerm, setQuoteSearchTerm] = useState<string>('');
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);

  useEffect(() => {
    fetchSLAs();
    fetchAvailableQuotes();
  }, []);

  // Update selectedQuote when selectedQuoteId changes
  useEffect(() => {
    if (selectedQuoteId) {
      const quote = availableQuotes.find(q => q.id === selectedQuoteId);
      if (quote) {
        setSelectedQuote(quote);
      } else {
        // Reset selection if quote not found
        setSelectedQuote(null);
      }
    } else {
      setSelectedQuote(null);
    }
  }, [selectedQuoteId, availableQuotes]);

  const fetchSLAs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sla/list');

      if (response.ok) {
        const data = await response.json();
        setSlas(data.slas || []);
      }
    } catch (error) {
      console.error('Error fetching SLAs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableQuotes = async () => {
    try {
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        const quotes = data.quotes?.map((quote: {
          id: string;
          quote_number: string;
          status?: string;
          created_at?: string;
          clients?: {
            name?: string;
            company?: string;
          };
          total_incl_vat?: number;
        }) => ({
          id: quote.id,
          quote_number: quote.quote_number,
          status: quote.status,
          created_at: quote.created_at,
          client_name: quote.clients?.name || 'Unknown',
          client_company: quote.clients?.company || 'Unknown',
          total_incl_vat: quote.total_incl_vat || 0
        })) || [];

        setAvailableQuotes(quotes);

        // Only set default selection if we don't already have one
        if (quotes.length > 0 && !selectedQuoteId) {
          setSelectedQuoteId(quotes[0].id);
          setSelectedQuote(quotes[0]);
        }
      } else {
        console.error('Failed to fetch quotes:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const handleDownloadPDF = async (slaId: string) => {
    try {
      const response = await fetch(`/api/sla/${slaId}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SLA-${slaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const getStatusBadge = (status: ServiceAgreementStatus) => {
    const statusConfig = {
      draft: { variant: 'secondary' as const, icon: Clock, label: 'Draft' },
      awaiting_signature: { variant: 'outline' as const, icon: Package, label: 'Awaiting Signature' },
      active: { variant: 'default' as const, icon: CheckCircle, label: 'Active' },
      amended: { variant: 'secondary' as const, icon: FileText, label: 'Amended' },
      terminated: { variant: 'destructive' as const, icon: AlertTriangle, label: 'Terminated' },
      expired: { variant: 'secondary' as const, icon: AlertTriangle, label: 'Expired' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredSLAs = slas.filter(sla => {
    const matchesSearch = searchTerm === '' ||
      sla.agreement_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sla.quotes?.clients?.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sla.quotes?.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sla.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredQuotes = availableQuotes.filter(quote => {
    const matchesSearch = quoteSearchTerm === '' ||
      quote.quote_number.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
      quote.client_company.toLowerCase().includes(quoteSearchTerm.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(quoteSearchTerm.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: slas.length,
    draft: slas.filter(sla => sla.status === 'draft').length,
    sent: slas.filter(sla => sla.status === 'awaiting_signature').length,
    accepted: slas.filter(sla => sla.status === 'active').length,
    expired: slas.filter(sla => sla.status === 'expired').length,
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Service Level Agreements
          </h1>
          <p className="text-muted-foreground">
            Manage and track all your service level agreements
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New SLA
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total SLAs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Draft</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Awaiting Signature</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Expired</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All SLAs</TabsTrigger>
          <TabsTrigger value="generate">Generate New</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search SLAs by agreement number, client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="awaiting_signature">Awaiting Signature</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="amended">Amended</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SLA List */}
          <Card>
            <CardHeader>
              <CardTitle>Service Level Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSLAs.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No SLAs found
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Generate your first SLA to get started'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate SLA
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agreement #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Quote</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Response Time</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSLAs.map((sla) => (
                        <TableRow key={sla.id}>
                          <TableCell className="font-medium">
                            {sla.agreement_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {sla.quotes?.clients?.company}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {sla.quotes?.clients?.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {sla.quotes?.quote_number}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              R{sla.quotes?.total_incl_vat.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(sla.status)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {sla.uptime_guarantee}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {sla.response_time_hours}h
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(sla.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/sla/${sla.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(sla.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          {/* Enhanced Template Showcase */}
          <EnhancedTemplateIntegration
            onTemplateSelect={(template) => {
              console.log('Template selected for SLA generation:', template);
              // Handle template selection for SLA generation
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Generate New SLA</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create a new Service Level Agreement from an existing quote
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quote-select" className="text-base font-semibold">Select Quote</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose a quote to generate the SLA from
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Input
                      placeholder="Search quotes by number, client, or company..."
                      value={quoteSearchTerm}
                      onChange={(e) => setQuoteSearchTerm(e.target.value)}
                      className="w-full"
                    />

                    {/* Selected Quote Display */}
                    {selectedQuote && (
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {selectedQuote.quote_number}
                                </Badge>
                                <Badge variant={selectedQuote.status === 'accepted' ? 'default' : 'secondary'}>
                                  {selectedQuote.status || 'pending'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium">{selectedQuote.client_company}</span>
                                <span className="mx-2">•</span>
                                <span>{selectedQuote.client_name}</span>
                              </div>
                              <div className="text-sm font-medium">
                                R{selectedQuote.total_incl_vat.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    <Select
                      value={selectedQuoteId}
                      onValueChange={(value) => {
                        setSelectedQuoteId(value);
                      }}
                    >
                      <SelectTrigger id="quote-select">
                        <SelectValue placeholder="Select a quote" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredQuotes.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <p className="text-sm">
                              {availableQuotes.length === 0 ? 'No quotes available' : 'No quotes match your search'}
                            </p>
                            <p className="text-xs">
                              {availableQuotes.length === 0 ? 'Create quotes first to generate SLAs' : 'Try adjusting your search terms'}
                            </p>
                          </div>
                        ) : (
                          filteredQuotes.map((quote) => (
                            <SelectItem key={quote.id} value={quote.id}>
                              {quote.quote_number}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {availableQuotes.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            No Quotes Available
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            You need to create quotes before you can generate SLAs
                          </p>
                          <Button onClick={() => router.push('/quotes')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Quote
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : !selectedQuoteId ? (
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">
                            Select a Quote
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Please select a quote from the dropdown above to generate an SLA
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <SLAGenerator
                      quoteId={selectedQuoteId}
                      onSLAGenerated={(slaId) => {
                        fetchSLAs(); // Refresh the list
                        router.push(`/sla/${slaId}`);
                      }}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}