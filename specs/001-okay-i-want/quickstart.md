# Quick Start Guide: Template-Based SLA Generation System

**Date**: 2025-01-09
**Version**: 1.0
**Target**: Developers implementing the SLA system

## Overview

This guide provides a quick start for implementing the Template-Based Service Level Agreement (SLA) Generation System. The system uses standardized templates with variable substitution for efficient SLA creation, focusing on simplicity and maintainability.

## Prerequisites

### Development Environment

- **Node.js**: 18+ (preferably latest LTS)
- **npm**: 9+
- **Supabase CLI**: Latest version
- **Git**: Latest version

### Required Accounts

- **Supabase**: Database and authentication
- **Domain**: For production deployment

## Setup Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd next-shadcn-auth-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### 2. Environment Configuration

Update `.env.local` with required variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Template System Configuration
DEFAULT_SLA_TEMPLATES_PATH=./lib/templates

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Start Supabase locally
npx supabase start

# Run database migrations
npx supabase db reset

# Apply SLA schema changes
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/20250104_sla_automation_triggers.sql
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to verify the application is running.

## Core Components

### 1. Template-Based SLA Generator

Create `/components/sla/sla-generator.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TemplateSelector } from "./template-selector";
import { VariablePreview } from "./variable-preview";

const slaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  client_id: z.string().min(1, "Client is required"),
  template_id: z.string().min(1, "Template is required"),
  quote_id: z.string().optional(),
  effective_date: z.date(),
  expiry_date: z.date(),
  custom_variables: z.record(z.any()).optional(),
});

type SlaFormData = z.infer<typeof slaFormSchema>;

export function SLAGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [extractedVariables, setExtractedVariables] = useState<Record<string, any>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<SlaFormData>({
    resolver: zodResolver(slaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      client_id: "",
      template_id: "",
      effective_date: new Date(),
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      custom_variables: {},
    },
  });

  const onSubmit = async (data: SlaFormData) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/sla/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          custom_variables: { ...extractedVariables, ...data.custom_variables },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("SLA created:", result.data);
        // Redirect to agreement details or success page
      } else {
        throw new Error("Failed to create SLA");
      }
    } catch (error) {
      console.error("Error creating SLA:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Service Level Agreement</CardTitle>
            <CardDescription>
              Generate an SLA using standardized templates with variable substitution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agreement Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., E-commerce Site SLA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Load clients from API */}
                            <SelectItem value="client-1">Acme Corporation</SelectItem>
                            <SelectItem value="client-2">Tech Industries</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                    name="quote_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quote to extract variables" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No quote selected</SelectItem>
                          <SelectItem value="quote-1">Website Development Quote</SelectItem>
                          <SelectItem value="quote-2">E-commerce Platform Quote</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TemplateSelector
                  onTemplateSelect={setSelectedTemplate}
                  selectedTemplateId={form.watch("template_id")}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the scope and terms of this service level agreement..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="effective_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Effective Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedTemplate && (
                  <VariablePreview
                    template={selectedTemplate}
                    variables={{ ...extractedVariables, ...form.watch("custom_variables") }}
                    onVariablesChange={(vars) => setExtractedVariables(vars)}
                    quoteId={form.watch("quote_id")}
                  />
                )}

                <Button type="submit" disabled={isGenerating} className="w-full">
                  {isGenerating ? "Creating SLA..." : "Create Service Level Agreement"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 2. Template Selector Component

Create `/components/sla/template-selector.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Template {
  id: string;
  name: string;
  description: string;
  package_type: string;
  usage_count: number;
  is_active: boolean;
}

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void;
  selectedTemplateId: string;
}

export function TemplateSelector({ onTemplateSelect, selectedTemplateId }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/sla/templates?is_active=true");
      const result = await response.json();

      if (result.success) {
        setTemplates(result.data.templates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPackageTypeColor = (packageType: string) => {
    switch (packageType) {
      case "ecom_site":
        return "bg-blue-100 text-blue-800";
      case "general_website":
        return "bg-green-100 text-green-800";
      case "business_process_systems":
        return "bg-purple-100 text-purple-800";
      case "marketing":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPackageTypeLabel = (packageType: string) => {
    switch (packageType) {
      case "ecom_site":
        return "E-commerce Site";
      case "general_website":
        return "General Website";
      case "business_process_systems":
        return "Business Process Systems";
      case "marketing":
        return "Marketing";
      default:
        return packageType;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Select SLA Template</h3>
        <p className="text-sm text-gray-600">Choose a template based on the service package type</p>
      </div>

      <Select value={selectedTemplateId} onValueChange={(value) => {
        const template = templates.find(t => t.id === value);
        if (template) {
          onTemplateSelect(template);
        }
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Select a template" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              <div className="flex items-center gap-2">
                <span>{template.name}</span>
                <Badge className={getPackageTypeColor(template.package_type)}>
                  {getPackageTypeLabel(template.package_type)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedTemplateId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplateId === template.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onTemplateSelect(template)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{template.name}</CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge className={getPackageTypeColor(template.package_type)}>
                    {getPackageTypeLabel(template.package_type)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Used {template.usage_count} times
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Variable Preview Component

Create `/components/sla/variable-preview.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Download } from "lucide-react";

interface VariablePreviewProps {
  template: any;
  variables: Record<string, any>;
  onVariablesChange: (variables: Record<string, any>) => void;
  quoteId?: string;
}

export function VariablePreview({ template, variables, onVariablesChange, quoteId }: VariablePreviewProps) {
  const [extractedVariables, setExtractedVariables] = useState<Record<string, any>>({});
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");

  useEffect(() => {
    if (quoteId) {
      extractVariablesFromQuote();
    }
  }, [quoteId]);

  useEffect(() => {
    generatePreview();
  }, [template, variables, extractedVariables]);

  const extractVariablesFromQuote = async () => {
    if (!quoteId) return;

    try {
      const response = await fetch(`/api/sla/extract-variables/${quoteId}`);
      const result = await response.json();

      if (result.success) {
        setExtractedVariables(result.data.extracted_variables);
        onVariablesChange({ ...variables, ...result.data.extracted_variables });
      }
    } catch (error) {
      console.error("Error extracting variables:", error);
    }
  };

  const generatePreview = () => {
    if (!template) return;

    let content = template.content;
    const allVariables = { ...extractedVariables, ...variables };

    // Replace variables in template
    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(value || `{{${key}}}`));
    });

    setPreviewContent(content);
    setEditedContent(content);
  };

  const handleVariableChange = (variableName: string, value: any) => {
    const newVariables = { ...variables, [variableName]: value };
    onVariablesChange(newVariables);
  };

  const getVariableSource = (variableName: string) => {
    if (extractedVariables[variableName] !== undefined) {
      return "quote";
    }
    if (variables[variableName] !== undefined) {
      return "manual";
    }
    return "missing";
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "quote":
        return "bg-green-100 text-green-800";
      case "manual":
        return "bg-blue-100 text-blue-800";
      case "missing":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Template Variables</h3>
          <p className="text-sm text-gray-600">
            Configure variables for the selected template
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Eye className="h-4 w-4 mr-1" /> : <Edit className="h-4 w-4 mr-1" />}
            {isEditing ? "Preview" : "Edit"}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Variable Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {template.variables?.map((variable: any) => (
          <Card key={variable.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {{variable.name}}
                <Badge className={getSourceColor(getVariableSource(variable.name))}>
                  {getVariableSource(variable.name)}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {variable.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder={`Enter ${variable.display_name}`}
                value={variables[variable.name] || extractedVariables[variable.name] || ""}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
              />
              {variable.is_required && (
                <p className="text-xs text-red-600 mt-1">Required field</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview/Edit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {isEditing ? "Edit Template Content" : "Template Preview"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isEditing
              ? "You can modify the template content before finalizing"
              : "This is how your SLA will appear with the current variables"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
          ) : (
            <div className="border rounded-lg p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap text-sm">{previewContent}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. API Route Example

Create `/app/api/sla/agreements/route.ts`:

```tsx
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createAgreementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  client_id: z.string().uuid("Valid client ID required"),
  template_id: z.string().uuid("Valid template ID required"),
  quote_id: z.string().uuid().optional(),
  effective_date: z.string().transform((val) => new Date(val)),
  expiry_date: z.string().transform((val) => new Date(val)),
  custom_variables: z.record(z.any()).optional(),
  performance_metrics: z.object({
    uptime_target: z.number().min(90).max(100),
    response_time_hours: z.number().min(0.1).max(168),
    resolution_time_hours: z.number().min(1).max(8760),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const clientId = searchParams.get("client_id");
    const status = searchParams.get("status");
    const packageType = searchParams.get("package_type");

    let query = supabase
      .from("service_agreements")
      .select(`
        *,
        client:clients(name, email),
        template:sla_templates(name, package_type)
      `, { count: "exact" });

    // Apply filters
    if (clientId) query = query.eq("client_id", clientId);
    if (status) query = query.eq("status", status);
    if (packageType) query = query.eq("package_type", packageType);

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        agreements: data,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching agreements:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "DATABASE_ERROR", message: "Failed to fetch agreements" },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAgreementSchema.parse(body);

    const supabase = createClient();

    // Get template details
    const { data: template, error: templateError } = await supabase
      .from("sla_templates")
      .select("*, variables")
      .eq("id", validatedData.template_id)
      .single();

    if (templateError) throw templateError;

    // Generate agreement number
    const agreementNumber = `SLA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    // Perform variable substitution
    let finalContent = template.content;
    const allVariables = { ...validatedData.custom_variables };
    const substitutedVariables = [];

    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      if (finalContent.includes(`{{${key}}}`)) {
        finalContent = finalContent.replace(regex, String(value || `{{${key}}}`));
        substitutedVariables.push({
          variable_name: key,
          value: value,
          data_source: "manual",
          substituted_at: new Date(),
        });
      }
    });

    // Create agreement
    const { data, error } = await supabase
      .from("service_agreements")
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        client_id: validatedData.client_id,
        template_id: validatedData.template_id,
        quote_id: validatedData.quote_id,
        effective_date: validatedData.effective_date,
        expiry_date: validatedData.expiry_date,
        final_content,
        substituted_variables,
        performance_metrics: validatedData.performance_metrics || template.default_metrics,
        agreement_number: agreementNumber,
        status: "draft",
        package_type: template.package_type,
        template_version_used: template.version,
        created_by_user_id: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update template usage count
    await supabase
      .from("sla_templates")
      .update({ usage_count: template.usage_count + 1 })
      .eq("id", template.id);

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        agreement_number,
        package_type: template.package_type,
        status: "draft",
        substituted_variables,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid input data", details: error.errors },
        },
        { status: 400 }
      );
    }

    console.error("Error creating agreement:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to create agreement" } },
      { status: 500 }
    );
  }
}
```

## Key Implementation Steps

### 1. Database Setup

```bash
# Run the SLA schema migrations
npx supabase db push

# Verify tables are created
npx supabase db shell --command "\dt"
```

### 2. Create User Roles

```sql
-- Set up initial user roles
INSERT INTO user_roles (user_id, role, department) VALUES
  ('your-user-id', 'internal_admin', 'IT'),
  ('another-user-id', 'client_admin', NULL);
```

### 3. Configure AI Integration

```bash
# Install CopilotKit
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime

# Add to layout.tsx
# (See API contracts for CopilotKit setup)
```

### 4. Test the Implementation

```bash
# Start development server
npm run dev

# Test API endpoints
curl -X GET http://localhost:3000/api/sla/agreements

# Create test agreement
curl -X POST http://localhost:3000/api/sla/agreements \
  -H "Content-Type: application/json" \
  -d '{"title":"Test SLA","description":"Test description","client_id":"uuid","template_id":"uuid","effective_date":"2025-01-01","expiry_date":"2026-01-01","industry":"technology","service_type":"saas","risk_level":"medium"}'
```

## Common Issues and Solutions

### 1. RLS Policy Errors

**Issue**: Permission denied when accessing SLA data
**Solution**: Ensure user roles are properly set up in the `user_roles` table

```sql
-- Check user roles
SELECT * FROM user_roles WHERE user_id = 'your-user-id';
```

### 2. AI Generation Failures

**Issue**: AI template generation not working
**Solution**: Check OpenAI API key and CopilotKit configuration

```bash
# Verify environment variables
echo $OPENAI_API_KEY
echo $COPILOTKIT_PUBLIC_API_KEY
```

### 3. Performance Issues

**Issue**: Slow API responses
**Solution**: Check database indexes and RLS policy performance

```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM service_agreements WHERE client_id = 'uuid';
```

## Next Steps

1. **Complete AI Integration**: Implement full CopilotKit integration with context-aware actions
2. **Add E-Signature**: Implement secure e-signature workflow with audit trails
3. **Performance Monitoring**: Set up automated performance data collection
4. **Testing**: Write comprehensive tests for all components
5. **Documentation**: Create user guides and API documentation

## Support

- **Issues**: Create GitHub issues for bugs and feature requests
- **Documentation**: Check the full implementation guide in `/docs/`
- **Community**: Join our Discord community for support

This quick start guide provides the foundation for implementing the Enhanced SLA Generation System. For detailed implementation guidance, refer to the complete documentation and API contracts.