'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Copy, Trash2, Eye, Clock, Shield, CheckCircle } from 'lucide-react';
import { SLATemplate } from '@/lib/sla-types';
import { SLAService } from '@/lib/sla-service';

interface TemplateManagerProps {
  templates: SLATemplate[];
  onTemplatesChange: () => void;
  onTemplateSelect: (template: SLATemplate) => void;
  selectedTemplateId?: string;
}

export function TemplateManager({ templates, onTemplatesChange, onTemplateSelect, selectedTemplateId }: TemplateManagerProps) {
  const [loading, setLoading] = useState(false);

  const handleDuplicateTemplate = async (template: SLATemplate) => {
    setLoading(true);
    try {
      await SLAService.createSLATemplate({
        ...template,
        name: `${template.name} (Copy)`,
        version: '1.0',
        is_active: true,
        created_by_user_id: 'current-user-id'
      });
      onTemplatesChange();
    } catch (err) {
      console.error('Failed to duplicate template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      await SLAService.deleteSLATemplate(templateId);
      onTemplatesChange();
    } catch (err) {
      console.error('Failed to delete template:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SLA Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage your SLA templates and their configurations
          </p>
        </div>
     </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
                <Badge variant={template.template_type === 'enterprise' ? 'default' : 'secondary'}>
                  {template.template_type}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Performance Metrics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Uptime: {template.default_uptime_percentage}%</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Response: {template.default_response_time_hours}h</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span>Resolution: {template.default_resolution_time_hours}h</span>
                </div>
              </div>

              {/* Legal Info */}
              <div className="pt-2 border-t space-y-1">
                <div className="text-xs text-muted-foreground">
                  Jurisdiction: {template.legal_jurisdiction}
                </div>
                <div className="text-xs text-muted-foreground">
                  Version: {template.version}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onTemplateSelect(template); }}
                  className="flex-1"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Select
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleDuplicateTemplate(template); }}
                  disabled={loading}
                >
                  <Copy className="w-3 h-3" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                  className="text-destructive hover:text-destructive"
                  disabled={loading}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No templates available
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Templates will appear here once they are created.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}