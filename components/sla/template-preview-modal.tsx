'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Clock,
  CheckCircle,
  Building,
  Stethoscope,
  Eye,
  Settings,
  Copy,
  Download,
  Star,
  Users,
  AlertTriangle,
  CheckSquare,
  FileText,
  Scale,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign
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

interface TemplatePreviewModalProps {
  template: SLATemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (template: SLATemplate) => void;
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onSelect
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'enterprise': return <Building className="w-4 h-4" />;
      case 'specialized': return <Star className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getComplianceColor = (standard: string) => {
    const colors: Record<string, string> = {
      'South African Law': 'bg-blue-100 text-blue-800',
      'Standard Business Practices': 'bg-gray-100 text-gray-800',
    };
    return colors[standard] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${template.color} text-white`}>
              {template.icon}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {getCategoryIcon(template.category)}
                  <span className="ml-1 capitalize">{template.category}</span>
                </Badge>
                <Badge variant="secondary">{template.industry}</Badge>
                {template.popular && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                    Most Popular
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{template.description}</p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="sample">Sample Content</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Payment Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Deposit Payment</span>
                        </div>
                        <span className="text-lg font-bold text-green-600">40%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Final Payment</span>
                        </div>
                        <span className="text-lg font-bold text-blue-600">60%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Standards */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Scale className="w-5 h-5 text-green-500" />
                      Legal Framework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {template.compliance.map((standard, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <Badge className={getComplianceColor(standard)}>
                            {standard}
                          </Badge>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Project Terms */}
              <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary mb-2">3</div>
                      <div className="font-medium">Months Support</div>
                      <div className="text-sm text-muted-foreground">Free technical support</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary mb-2">100%</div>
                      <div className="font-medium">IP Transfer</div>
                      <div className="text-sm text-muted-foreground">Upon final payment</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary mb-2">3</div>
                      <div className="font-medium">Business Days</div>
                      <div className="text-sm text-muted-foreground">Payment terms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-green-500" />
                    Complete Feature List
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {template.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="sample" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Megasol Service Agreement Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Scope */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      1. Project Scope and Specifications
                    </h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm">
                        Prior to project commencement, the Client must provide a comprehensive specification document
                        detailing all requirements for the online store development project. All work will be performed
                        strictly in accordance with the approved specification document.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Terms */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      2. Payment Terms
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium mb-2">Deposit Payment</h5>
                        <p className="text-sm text-gray-700">
                          <strong>40%</strong> of total project cost due within <strong>3 business days</strong> of
                          specification approval. Covers tooling, licenses, and project initiation.
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium mb-2">Final Payment</h5>
                        <p className="text-sm text-gray-700">
                          <strong>60%</strong> balance due within <strong>3 business days</strong> of project completion
                          and delivery of all specified requirements.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Change Management */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      3. Change Management
                    </h4>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-gray-700 mb-2">
                        Any modifications outside the approved specification will be treated as Change Requests requiring:
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Separate authorization and payment</li>
                        <li>• Written submission and review process</li>
                        <li>• Impact assessment on existing functionality</li>
                        <li>• Technical difficulty evaluation</li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  {/* Support & Warranty */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      4. Support and Warranty
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium mb-2">Support Period</h5>
                        <p className="text-sm text-gray-700">
                          <strong>3 months</strong> of free technical support for maintenance and downtime issues.
                          Additional support charged based on complexity after this period.
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium mb-2">Intellectual Property</h5>
                        <p className="text-sm text-gray-700">
                          Upon final payment, all custom development work becomes 100% owned by the client as
                          their intellectual property. Third-party tools remain subject to their terms.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Force Majeure */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      5. Force Majeure Indemnification
                    </h4>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-gray-700 mb-2">
                        Service Provider is indemnified from liability for service interruptions caused by:
                      </p>
                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <ul className="space-y-1">
                            <li>• Natural disasters</li>
                            <li>• Hosting platform failures</li>
                            <li>• Third-party service disruptions</li>
                            <li>• Internet service outages</li>
                          </ul>
                        </div>
                        <div>
                          <ul className="space-y-1">
                            <li>• Power grid failures</li>
                            <li>• Cyber attacks on infrastructure</li>
                            <li>• Government regulations</li>
                            <li>• Other technical circumstances beyond control</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close Preview
            </Button>
            <Button onClick={() => { onSelect?.(template); onClose(); }} className="flex-1">
              <Settings className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}