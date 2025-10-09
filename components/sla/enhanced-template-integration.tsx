'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTemplateShowcase } from './enhanced-template-showcase';
import { TemplatePreviewModal } from './template-preview-modal';
import { getSLATemplateHTML, renderSLATemplate, slaTemplateHTMLs } from '@/lib/sla-templates-html';
import { SLATemplate } from '@/lib/sla-types';
import {
  Shield,
  Eye,
  Settings,
  FileText,
  Download,
  Plus,
  X
} from 'lucide-react';

interface EnhancedTemplateIntegrationProps {
  onTemplateSelect?: (template: SLATemplate) => void;
  selectedTemplateId?: string;
  showAsReplacement?: boolean; // If true, replaces "No templates available" message
}

export function EnhancedTemplateIntegration({
  onTemplateSelect,
  selectedTemplateId,
  showAsReplacement = false
}: EnhancedTemplateIntegrationProps) {
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullShowcase, setShowFullShowcase] = useState(!showAsReplacement);

  // Convert HTML template to SLA template format for compatibility
  const convertToSLATemplate = (htmlTemplate: any) => {
    // Add null checks and validation
    if (!htmlTemplate || !htmlTemplate.variables) {
      console.error('Invalid template structure:', htmlTemplate);
      throw new Error('Template structure is invalid or missing required variables');
    }

    return {
      id: htmlTemplate.id || 'unknown',
      name: htmlTemplate.name || 'Unnamed Template',
      description: htmlTemplate.previewText || '',
      template_type: htmlTemplate.category || 'standard',
      industry: htmlTemplate.id?.includes('megasol') ? 'E-commerce' : 'Technology',
      version: '1.0',
      is_active: true,
      template_content: {
        html_content: htmlTemplate.htmlContent || '',
        variables: htmlTemplate.variables || {}
      },
      template_variables: htmlTemplate.variables || {},
      default_uptime_percentage: 99.5, // Default value since Megasol template doesn't have uptime metrics
      default_response_time_hours: 3, // Default value for response time
      default_resolution_time_hours: 5, // Default value for resolution time
      compliance_frameworks: htmlTemplate.id?.includes('megasol') ? ['gdpr' as const] : ['iso_27001' as const],
      legal_jurisdiction: 'South Africa',
      governing_law: 'South African Law',
      created_by_user_id: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const handleTemplateSelect = (template: any) => {
    const slaTemplate = convertToSLATemplate(template);
    onTemplateSelect?.(slaTemplate);
  };

  const handlePreviewTemplate = (template: any) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDownloadTemplate = (template: any) => {
    const slaTemplate = convertToSLATemplate(template);
    const renderedContent = renderSLATemplate(template, {
      ...template.variables,
      client_name: 'Sample Client',
      client_company: 'Sample Company',
      client_email: 'client@example.com',
      client_address: '123 Client Street, City, South Africa'
    });

    const blob = new Blob([renderedContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}_SLA.html`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (showAsReplacement) {
    return (
      <div className="space-y-6">
        {/* Quick Template Selection */}
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Ready-to-Use SLA Templates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose from professionally crafted templates or create your own
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {slaTemplateHTMLs.map((template) => (
                <Card key={template.id} className="relative group hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500 text-white">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {template.previewText}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewTemplate(template)}
                            className="text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleTemplateSelect(template)}
                            className="text-xs"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Template based on Megasol service agreement structure for online store development projects
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Template Preview Modal */}
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onSelect={handleTemplateSelect}
        />

      </div>
    );
  }

  // Full showcase view
  return (
    <div className="space-y-6">
      <EnhancedTemplateShowcase
        onTemplateSelect={handleTemplateSelect}
        onPreviewTemplate={handlePreviewTemplate}
      />

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}