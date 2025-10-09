'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  Eye,
  Settings,
  CheckSquare,
  FileText,
  DollarSign,
  Shield
} from 'lucide-react';

interface SLATemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'enterprise' | 'specialized';
  industry: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  compliance: string[];
  price: string;
  popular?: boolean;
}

interface EnhancedTemplateShowcaseProps {
  onTemplateSelect?: (template: SLATemplate) => void;
  onPreviewTemplate?: (template: SLATemplate) => void;
}

export function EnhancedTemplateShowcase({
  onTemplateSelect,
  onPreviewTemplate
}: EnhancedTemplateShowcaseProps) {
  const templates: SLATemplate[] = [
    {
      id: 'megasol-service-agreement',
      name: 'Megasol Service Agreement',
      description: 'Service agreement for online store development with 40% deposit and 60% final payment structure, including comprehensive project scope and change management.',
      category: 'standard',
      industry: 'E-commerce',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-500',
      features: [
        'Comprehensive specification document requirement',
        '40% deposit with 60% final payment structure',
        'Strict scope adherence to approved specifications',
        'Formal change request process for modifications',
        '3-month support and warranty period',
        'Intellectual property transfer upon completion',
        'Force majeure indemnification clauses'
      ],
      compliance: ['South African Law', 'Standard Business Practices'],
      price: 'Project-based'
    }
  ];

  const getCategoryIcon = (category: string) => {
    return <FileText className="w-4 h-4" />;
  };

  const TemplateCard = ({ template }: { template: SLATemplate }) => (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 hover:border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${template.color} text-white`}>
              {template.icon}
            </div>
            <div>
              <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getCategoryIcon(template.category)}
                  <span className="ml-1 capitalize">{template.category}</span>
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {template.industry}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {template.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Features */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-green-500" />
            Agreement Features
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {template.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                {feature}
              </div>
            ))}
            {template.features.length > 4 && (
              <div className="text-xs text-muted-foreground">
                +{template.features.length - 4} more features
              </div>
            )}
          </div>
        </div>

        {/* Payment Structure */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            Payment Structure
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600 mb-1">40%</div>
              <div className="text-xs text-muted-foreground">Deposit</div>
              <div className="text-xs text-muted-foreground">Due in 3 business days</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-1">60%</div>
              <div className="text-xs text-muted-foreground">Final Payment</div>
              <div className="text-xs text-muted-foreground">Due on completion</div>
            </div>
          </div>
        </div>

        {/* Project Terms */}
        <div>
          <h4 className="font-medium mb-2 text-sm">Project Terms</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>3-month support warranty included</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Comprehensive specification requirement</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4 text-purple-500" />
              <span>Formal change request process</span>
            </div>
          </div>
        </div>

        {/* Compliance */}
        <div>
          <h4 className="font-medium mb-2 text-sm">Legal Framework</h4>
          <div className="flex flex-wrap gap-1">
            {template.compliance.map((standard, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {standard}
              </Badge>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">{template.price}</div>
              <div className="text-xs text-muted-foreground">Project-based pricing</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreviewTemplate?.(template)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onTemplateSelect?.(template)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Select
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SLA Templates</h2>
          <p className="text-muted-foreground mt-2">
            Professional service agreement template for online store development projects
          </p>
        </div>

        {/* Template Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-blue-800 mb-2">
            <FileText className="w-5 h-5" />
            <span className="font-medium">Megasol Service Agreement Template</span>
          </div>
          <p className="text-sm text-blue-700 text-center">
            Based on the service agreement structure for online store development projects with 40% deposit and 60% final payment terms
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

    </div>
  );
}