// SLA Generator Component
// Allows users to generate SLAs from quotes with customizable options

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Settings,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Download,
  Grid,
  List,
  Plus
} from 'lucide-react';
import { SLAGenerationRequest, SLATemplate, SLAGenerationResponse } from '@/lib/sla-types';
import { TemplateManager } from './template-manager';

interface SLAGeneratorProps {
  quoteId: string;
  onSLAGenerated?: (slaId: string) => void;
}

export function SLAGenerator({ quoteId, onSLAGenerated }: SLAGeneratorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<SLATemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SLATemplate | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customRequirements, setCustomRequirements] = useState('');
  const [industrySpecifics, setIndustrySpecifics] = useState('');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    uptime: 99.5,
    response_time: 24,
    resolution_time: 72
  });
  const [generatedSLA, setGeneratedSLA] = useState<SLAGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templateViewMode, setTemplateViewMode] = useState<'cards' | 'list'>('cards');

  // Load available templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/sla/templates?industry=software_development');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
        if (data.templates.length > 0) {
          setSelectedTemplateId(data.templates[0].id);
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const handleGenerateSLA = async () => {
    if (!quoteId) {
      setError('Please select a quote first');
      return;
    }

    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: SLAGenerationRequest = {
        quote_id: quoteId,
        template_id: selectedTemplateId,
        client_requirements: customRequirements || undefined,
        industry_specifics: industrySpecifics || undefined,
        performance_requirements: performanceMetrics
      };

      const response = await fetch('/api/sla/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedSLA(data);
        onSLAGenerated?.(data.service_agreement.id);
      } else {
        setError(data.error || 'Failed to generate SLA');
      }
    } catch {
      setError('An error occurred while generating the SLA');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSLA = () => {
    if (generatedSLA?.service_agreement?.id) {
      router.push(`/sla/${generatedSLA.service_agreement.id}`);
    } else if (generatedSLA?.service_agreement) {
      console.error('Service agreement ID is missing');
    }
  };

  const handleTemplateSelect = (template: SLATemplate) => {
    setSelectedTemplate(template);
    setSelectedTemplateId(template.id);
    // Update performance metrics with template defaults
    setPerformanceMetrics({
      uptime: template.default_uptime_percentage,
      response_time: template.default_response_time_hours,
      resolution_time: template.default_resolution_time_hours
    });
  };

  // Update selectedTemplate when selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId);
      if (template) {
        setSelectedTemplate(template);
      }
    }
  }, [selectedTemplateId, templates]);

  const handleTemplatesChange = () => {
    loadTemplates();
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Service Level Agreement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Template Management Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">SLA Template</Label>
                <p className="text-sm text-muted-foreground">
                  Choose a template or create a new one for your SLA
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex border rounded-md">
                  <Button
                    variant={templateViewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTemplateViewMode('cards')}
                    className="rounded-r-none"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={templateViewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTemplateViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <TemplateManager
              templates={templates}
              onTemplatesChange={handleTemplatesChange}
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplateId}
            />
          </div>

          <Separator />

          {/* Performance Metrics Configuration */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Settings className="w-5 h-5" />
                Performance Metrics
              </h3>
              <p className="text-sm text-muted-foreground">
                Configure the performance standards for this SLA
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Uptime Guarantee</Label>
                    <Badge variant="outline">{performanceMetrics.uptime}%</Badge>
                  </div>
                  <Slider
                    value={[performanceMetrics.uptime]}
                    onValueChange={(value: number[]) =>
                      setPerformanceMetrics(prev => ({ ...prev, uptime: value[0] }))
                    }
                    max={99.99}
                    min={95}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum {selectedTemplate?.default_uptime_percentage || 99.5}% required
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Response Time</Label>
                    <Badge variant="outline">{performanceMetrics.response_time}h</Badge>
                  </div>
                  <Slider
                    value={[performanceMetrics.response_time]}
                    onValueChange={(value: number[]) =>
                      setPerformanceMetrics(prev => ({ ...prev, response_time: value[0] }))
                    }
                    max={72}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum {selectedTemplate?.default_response_time_hours || 24} hours
                  </p>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Resolution Time</Label>
                    <Badge variant="outline">{performanceMetrics.resolution_time}h</Badge>
                  </div>
                  <Slider
                    value={[performanceMetrics.resolution_time]}
                    onValueChange={(value: number[]) =>
                      setPerformanceMetrics(prev => ({ ...prev, resolution_time: value[0] }))
                    }
                    max={168}
                    min={24}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum {selectedTemplate?.default_resolution_time_hours || 72} hours
                  </p>
                </div>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Custom Requirements and Industry Specifics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="requirements" className="text-sm font-medium">Custom Requirements</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add specific client requirements or custom clauses
                  </p>
                </div>
                <Textarea
                  id="requirements"
                  placeholder="Enter any specific client requirements or custom clauses..."
                  value={customRequirements}
                  onChange={(e) => setCustomRequirements(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="industry" className="text-sm font-medium">Industry Specifics</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Include industry-specific compliance requirements or standards
                  </p>
                </div>
                <Textarea
                  id="industry"
                  placeholder="Enter industry-specific compliance requirements or standards..."
                  value={industrySpecifics}
                  onChange={(e) => setIndustrySpecifics(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGenerateSLA}
                  disabled={loading || !selectedTemplateId}
                  className="flex-1"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating SLA...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Generate SLA
                    </>
                  )}
                </Button>

                {generatedSLA && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePreviewSLA} size="lg">
                      <Eye className="w-5 h-5 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="lg">
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Generated SLA Summary */}
      {generatedSLA && generatedSLA.service_agreement && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5 text-green-500" />
              SLA Generated Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Agreement Details</h4>
                <div className="space-y-2 text-sm bg-white p-3 rounded-md border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Agreement #:</span>
                    <span className="font-medium">{generatedSLA.service_agreement.agreement_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">{generatedSLA.service_agreement.uptime_guarantee}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response:</span>
                    <span className="font-medium">{generatedSLA.service_agreement.response_time_hours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span className="font-medium">{generatedSLA.service_agreement.resolution_time_hours}h</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-green-700">Next Steps</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">Review Content</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">Send to Client</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">Collect Signature</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}