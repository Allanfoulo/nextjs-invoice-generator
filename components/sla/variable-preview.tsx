'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Edit,
  Save,
  Download
} from 'lucide-react';
import { slaService } from '@/lib/sla/sla-service';
import { variableMapper } from '@/lib/sla/variable-mapper';
import { SLATemplate, TemplateVariable, VariableSubstitution, PackageType } from '@/lib/sla/sla-types';
import { Quote, Client, CompanySettings } from '@/lib/invoice-types';

interface VariablePreviewProps {
  template: SLATemplate;
  initialVariables?: Record<string, any>;
  quoteData?: {
    quote: Quote;
    client: Client;
    companySettings: CompanySettings;
    additionalContext?: Record<string, any>;
  };
  onSaveVariables?: (variables: Record<string, any>) => void;
  readOnly?: boolean;
  className?: string;
  showAdvancedOptions?: boolean;
  maxHeight?: string;
}

interface VariableInputProps {
  variable: TemplateVariable;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Mobile-optimized variable input component
 */
const VariableInput: React.FC<VariableInputProps> = ({
  variable,
  value,
  onChange,
  disabled = false,
  error
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const renderInput = () => {
    switch (variable.type) {
      case 'text':
        if (variable.validation?.pattern?.includes('email')) {
          return (
            <Input
              type="email"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={`Enter ${variable.display_name.toLowerCase()}`}
              className={error ? 'border-destructive' : ''}
            />
          );
        }
        if (variable.validation?.pattern?.includes('phone')) {
          return (
            <Input
              type="tel"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={`Enter ${variable.display_name.toLowerCase()}`}
              className={error ? 'border-destructive' : ''}
            />
          );
        }
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${variable.display_name.toLowerCase()}`}
            className={`min-h-[80px] resize-none ${error ? 'border-destructive' : ''}`}
            rows={3}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            disabled={disabled}
            min={variable.validation?.min}
            max={variable.validation?.max}
            step={variable.validation?.min && variable.validation?.min % 1 !== 0 ? '0.01' : '1'}
            placeholder={`Enter ${variable.display_name.toLowerCase()}`}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={error ? 'border-destructive' : ''}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={variable.name}
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor={variable.name} className="text-sm font-medium">
              {variable.display_name}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={`Enter ${variable.display_name.toLowerCase()}`}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={variable.name} className="text-sm font-medium">
          {variable.display_name}
          {variable.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {variable.data_source && (
          <Badge variant="outline" className="text-xs">
            {variable.data_source}
          </Badge>
        )}
      </div>

      {variable.description && (
        <p className="text-xs text-muted-foreground">{variable.description}</p>
      )}

      <div className="relative">
        {renderInput()}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertTriangle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}

      {/* Validation hints */}
      {variable.validation && (
        <div className="text-xs text-muted-foreground space-y-1">
          {variable.validation.min !== undefined && variable.type === 'number' && (
            <p>Minimum: {variable.validation.min}</p>
          )}
          {variable.validation.max !== undefined && variable.type === 'number' && (
            <p>Maximum: {variable.validation.max}</p>
          )}
          {variable.validation.options && (
            <p>Options: {variable.validation.options.join(', ')}</p>
          )}
        </div>
      )}

      {/* Default value hint */}
      {variable.default_value !== undefined && !value && !disabled && (
        <p className="text-xs text-muted-foreground">
          Default: {String(variable.default_value)}
        </p>
      )}
    </div>
  );
};

/**
 * Mobile-optimized variable preview component with real-time substitution
 */
export const VariablePreview: React.FC<VariablePreviewProps> = ({
  template,
  initialVariables = {},
  quoteData,
  onSaveVariables,
  readOnly = false,
  className = '',
  showAdvancedOptions = false,
  maxHeight = '600px'
}) => {
  const [variables, setVariables] = useState<Record<string, any>>(initialVariables);
  const [previewData, setPreviewData] = useState<{
    preview_content: string;
    substituted_variables: VariableSubstitution[];
    missing_variables: string[];
    validation_errors: string[];
  } | null>(null);
  const [detectedPackageType, setDetectedPackageType] = useState<PackageType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'variables' | 'preview'>('variables');
  const [windowWidth, setWindowWidth] = useState(0);
  const [showValidationSummary, setShowValidationSummary] = useState(true);

  // Track window size for responsive behavior
  useEffect(() => {
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect package type and auto-populate variables
  useEffect(() => {
    if (quoteData) {
      try {
        // Detect package type from quote data
        const detectedType = variableMapper.detectPackageType(
          quoteData.quote,
          quoteData.client,
          quoteData.additionalContext || {}
        );
        setDetectedPackageType(detectedType);

        // Extract all possible variables from quote data
        const extractedData = variableMapper.extractVariablesFromQuote(
          quoteData.quote,
          quoteData.client,
          quoteData.companySettings,
          quoteData.additionalContext || {}
        );

        // Map template variables to extracted data
        const mappings = variableMapper.mapTemplateVariables(template, extractedData);

        // Create auto-populated variables from mappings
        const autoPopulated: Record<string, any> = {};
        mappings.forEach(mapping => {
          if (mapping.suggested_value !== undefined && mapping.suggested_value !== null) {
            autoPopulated[mapping.template_variable] = mapping.suggested_value;
          }
        });

        // Add package type specific variables
        autoPopulated.package_type = detectedType;

        // Add common defaults
        autoPopulated.effective_date = new Date().toISOString().split('T')[0];
        autoPopulated.agreement_date = new Date().toISOString().split('T')[0];

        setVariables(prev => ({ ...prev, ...autoPopulated }));
      } catch (error) {
        console.error('Error auto-populating variables:', error);
        // Fallback to basic extraction
        const fallbackVariables: Record<string, any> = {
          client_name: quoteData.client.name || quoteData.client.company,
          client_email: quoteData.client.email,
          client_phone: quoteData.client.phone,
          project_value: quoteData.quote.totalInclVat,
          effective_date: new Date().toISOString().split('T')[0],
        };
        setVariables(prev => ({ ...prev, ...fallbackVariables }));
      }
    }
  }, [quoteData, template, variables]);

  // Generate preview whenever variables change (debounced)
  const generatePreview = useCallback(async () => {
    if (!template) return;

    setLoading(true);
    setError(null);

    try {
      // Try using variable mapper first for real-time preview
      if (quoteData) {
        const extractedData = variableMapper.extractVariablesFromQuote(
          quoteData.quote,
          quoteData.client,
          quoteData.companySettings,
          quoteData.additionalContext || {}
        );

        const previewContent = variableMapper.generatePreview(template, extractedData, variables);
        const substitutions = variableMapper.substituteVariables(template, extractedData, variables);

        // Validate required variables
        const missingVariables = template.variables
          .filter(v => v.is_required && !variables[v.name] && !substitutions.find(s => s.variable_name === v.name))
          .map(v => v.name);

        // Validate variable values
        const validationErrors: string[] = [];
        substitutions.forEach(substitution => {
          const variable = template.variables.find(v => v.name === substitution.variable_name);
          if (variable && variable.validation) {
            const value = substitution.value;
            if (variable.type === 'number' && typeof value === 'number') {
              if (variable.validation.min !== undefined && value < variable.validation.min) {
                validationErrors.push(`${variable.display_name} must be at least ${variable.validation.min}`);
              }
              if (variable.validation.max !== undefined && value > variable.validation.max) {
                validationErrors.push(`${variable.display_name} must be at most ${variable.validation.max}`);
              }
            }
          }
        });

        setPreviewData({
          preview_content: previewContent,
          substituted_variables: substitutions,
          missing_variables: missingVariables,
          validation_errors: validationErrors
        });
      } else {
        // Fallback to API-based preview
        const result = await slaService.previewAgreement(template.id, variables);
        if (result.success && result.data) {
          setPreviewData(result.data);
        } else {
          setError(result.error || 'Failed to generate preview');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred while generating preview');
      console.error('Error generating preview:', err);
    } finally {
      setLoading(false);
    }
  }, [template, variables, quoteData]);

  // Debounced preview generation
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => clearTimeout(timer);
  }, [generatePreview]);

  const handleVariableChange = (variableName: string, value: any) => {
    setVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleSaveVariables = () => {
    onSaveVariables?.(variables);
  };

  const handleResetVariables = () => {
    setVariables(initialVariables);
  };

  const isMobile = windowWidth < 768;
  const hasErrors = previewData?.validation_errors && previewData.validation_errors.length > 0;
  const hasMissingVariables = previewData?.missing_variables && previewData.missing_variables.length > 0;

  // Group variables by category for better organization
  const groupedVariables = useMemo(() => {
    const groups: Record<string, TemplateVariable[]> = {
      client_info: [],
      project_details: [],
      performance_metrics: [],
      legal_terms: [],
      other: []
    };

    template.variables.forEach(variable => {
      if (variable.name.includes('client') || variable.name.includes('customer')) {
        groups.client_info.push(variable);
      } else if (variable.name.includes('project') || variable.name.includes('scope') || variable.name.includes('description')) {
        groups.project_details.push(variable);
      } else if (variable.name.includes('uptime') || variable.name.includes('response') || variable.name.includes('resolution')) {
        groups.performance_metrics.push(variable);
      } else if (variable.name.includes('term') || variable.name.includes('clause') || variable.name.includes('liability')) {
        groups.legal_terms.push(variable);
      } else {
        groups.other.push(variable);
      }
    });

    return groups;
  }, [template.variables]);

  return (
    <div className={`space-y-4 ${className}`} data-testid="variable-preview-container">
      {/* Header */}
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>
                {template.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {template.description}
              </CardDescription>

              {/* Package Type Indicator */}
              <div className="flex items-center gap-2 mt-2">
                {detectedPackageType && (
                  <Badge variant="outline" className="text-xs">
                    Package Type: {detectedPackageType.replace('_', ' ')}
                  </Badge>
                )}
                {template.package_type && detectedPackageType !== template.package_type && (
                  <Badge variant="secondary" className="text-xs">
                    Template: {template.package_type.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!readOnly && (
                <Button
                  onClick={handleSaveVariables}
                  size="sm"
                  className="flex gap-1"
                >
                  <Save className="h-3 w-3" />
                  {isMobile ? '' : 'Save'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleResetVariables}
                size="sm"
                className="flex gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                {isMobile ? '' : 'Reset'}
              </Button>
            </div>
          </div>

          {/* Validation Summary */}
          {showValidationSummary && previewData && (
            <div className="space-y-2">
              {(hasErrors || hasMissingVariables) ? (
                <Alert className="border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Validation Issues</AlertTitle>
                  <AlertDescription className="text-xs">
                    {hasMissingVariables && (
                      <p>Missing required variables: {previewData.missing_variables.join(', ')}</p>
                    )}
                    {hasErrors && (
                      <p>Validation errors: {previewData.validation_errors.length} found</p>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle className="text-sm">Ready</AlertTitle>
                  <AlertDescription className="text-xs">
                    All variables properly configured. Preview is ready.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'variables' | 'preview')}>
        <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
          <TabsTrigger value="variables" className="flex gap-2">
            <Edit className="h-4 w-4" />
            {isMobile ? 'Variables' : 'Edit Variables'}
            {previewData?.missing_variables && previewData.missing_variables.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                {previewData.missing_variables.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex gap-2">
            <Eye className="h-4 w-4" />
            {isMobile ? 'Preview' : 'Live Preview'}
            {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
          </TabsTrigger>
        </TabsList>

        {/* Variables Tab */}
        <TabsContent value="variables" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Variables</CardTitle>
              <CardDescription>
                Configure the variables that will be substituted in your SLA template.
                Required fields are marked with an asterisk (*).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className={`${isMobile ? 'max-h-96' : ''}`} style={{ maxHeight: isMobile ? undefined : maxHeight }}>
                <div className="space-y-6">
                  {Object.entries(groupedVariables).map(([groupName, vars]) => (
                    vars.length > 0 && (
                      <div key={groupName} className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          {groupName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <div className="space-y-4">
                          {vars.map((variable) => (
                            <VariableInput
                              key={variable.name}
                              variable={variable}
                              value={variables[variable.name]}
                              onChange={(value) => handleVariableChange(variable.name, value)}
                              disabled={readOnly}
                              error={
                                previewData?.missing_variables?.includes(variable.name)
                                  ? 'This variable is required'
                                  : undefined
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                  <CardDescription>
                    See how your SLA will look with the current variable values.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowValidationSummary(!showValidationSummary)}
                  >
                    {showValidationSummary ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generatePreview}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : error ? (
                <Alert className="border-destructive/50 bg-destructive/5">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Preview Generation Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : previewData ? (
                <div className="space-y-4">
                  {/* Substituted Variables Summary */}
                  {previewData.substituted_variables.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Substituted Variables</h4>
                      <div className="flex flex-wrap gap-2">
                        {previewData.substituted_variables.map((substitution, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {substitution.variable_name}: {String(substitution.value).substring(0, 20)}
                            {String(substitution.value).length > 20 && '...'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview Content */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Preview Content</h4>
                    <ScrollArea className="border rounded-md p-4 bg-muted/30" style={{ maxHeight: '400px' }}>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                          {previewData.preview_content}
                        </pre>
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Validation Errors */}
                  {hasErrors && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-destructive">Validation Errors</h4>
                      <div className="space-y-1">
                        {previewData.validation_errors.map((error, index) => (
                          <div key={index} className="text-xs text-destructive flex items-start gap-1">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Configure variables to see a live preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VariablePreview;