// SLA Automation Status Component
// Shows automation status and provides manual override options

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Eye,
  Download,
  RefreshCw,
  Settings,
  Info
} from 'lucide-react';

interface SLAAutomationStatusProps {
  quoteId: string;
  onSLAGenerated?: (slaId: string) => void;
  onStatusChange?: (status: AutomationStatus) => void;
}

interface AutomationStatus {
  quote_id: string;
  quote_status: string;
  quote_number: string;
  existing_sla: {
    id: string;
    status: string;
    auto_generated: boolean;
    automation_trigger: string;
    created_at: string;
  } | null;
  can_auto_generate: boolean;
  automation_enabled: boolean;
}

export function SLAAutomationStatus({ quoteId, onSLAGenerated, onStatusChange }: SLAAutomationStatusProps) {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAutomationStatus();
  }, [quoteId]);

  const checkAutomationStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sla/auto-generate?quote_id=${quoteId}`);
      const data = await response.json();

      if (response.ok) {
        setStatus(data);
        onStatusChange?.(data);
      } else {
        setError(data.error || 'Failed to check automation status');
      }
    } catch (err) {
      setError('Failed to connect to automation service');
      console.error('Automation status check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualGeneration = async () => {
    try {
      setGenerating(true);
      setError(null);

      const response = await fetch('/api/sla/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_id: quoteId,
          trigger_source: 'manual_ui_trigger'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await checkAutomationStatus(); // Refresh status
        onSLAGenerated?.(data.sla_id);
      } else {
        setError(data.error || 'Failed to generate SLA');
      }
    } catch (err) {
      setError('Failed to trigger SLA generation');
      console.error('Manual generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleViewSLA = () => {
    if (status?.existing_sla?.id) {
      window.open(`/sla/${status.existing_sla.id}`, '_blank');
    }
  };

  const handleDownloadPDF = async () => {
    if (status?.existing_sla?.id) {
      try {
        const response = await fetch(`/api/sla/${status.existing_sla.id}/pdf`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `SLA-${status.existing_sla.id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } catch (error) {
        console.error('Error downloading PDF:', error);
        setError('Failed to download PDF');
      }
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking automation status...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !status) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={checkAutomationStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Unable to determine automation status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          SLA Automation Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quote Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Quote Status:</span>
            <Badge variant={status.quote_status === 'accepted' ? 'default' : 'secondary'}>
              {status.quote_status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Quote #{status.quote_number}
          </div>
        </div>

        <Separator />

        {/* SLA Status */}
        {status.existing_sla ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">SLA Generated</span>
                {status.existing_sla.auto_generated && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
              <Badge variant={status.existing_sla.status === 'generated' ? 'default' : 'secondary'}>
                {status.existing_sla.status}
              </Badge>
            </div>

            {status.existing_sla.auto_generated && (
              <div className="text-xs text-muted-foreground">
                Generated on {new Date(status.existing_sla.created_at).toLocaleDateString()}
                {status.existing_sla.automation_trigger && (
                  <span> via {status.existing_sla.automation_trigger}</span>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleViewSLA}>
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : status.can_auto_generate ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Ready for Auto-Generation</span>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                This accepted quote is eligible for automatic SLA generation. The SLA will be created using the default template with standard terms.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleManualGeneration}
                disabled={generating}
                size="sm"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate SLA Now
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Configure First
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Cannot Auto-Generate</span>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {status.quote_status !== 'accepted'
                  ? `Quote must be in "accepted" status to generate SLA. Current status: ${status.quote_status}`
                  : 'SLA generation is not available for this quote'
                }
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={checkAutomationStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Automation Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              <span>Automation is {status.automation_enabled ? 'enabled' : 'disabled'}</span>
            </div>
            {status.existing_sla?.auto_generated && (
              <div className="mt-1">
                Auto-generated SLA detected. Manual override available if needed.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}