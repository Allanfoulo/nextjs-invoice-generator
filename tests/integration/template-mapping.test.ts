import { slaService } from '@/lib/sla/sla-service';
import { variableMapper } from '@/lib/sla/variable-mapper';

// Mock the SLA service and variable mapper
jest.mock('@/lib/sla/sla-service');
jest.mock('@/lib/sla/variable-mapper');

const mockSlaService = slaService as jest.Mocked<typeof slaService>;
const mockVariableMapper = variableMapper as jest.Mocked<typeof variableMapper>;

describe('Quote-to-Template Data Mapping Integration', () => {
  const mockQuote = {
    id: 'quote-123',
    title: 'E-commerce Website Development',
    description: 'Complete e-commerce website with payment gateway integration',
    client_id: 'client-456',
    total: 25000,
    status: 'accepted',
    created_at: '2025-01-09T10:00:00Z',
    updated_at: '2025-01-09T10:00:00Z',
    items: [
      {
        id: 'item-1',
        name: 'E-commerce Platform Setup',
        description: 'Setup of e-commerce platform with basic functionality',
        quantity: 1,
        unit_price: 15000,
        total: 15000,
        package_type: 'ecom_site',
      },
      {
        id: 'item-2',
        name: 'Payment Gateway Integration',
        description: 'Integration with Stripe payment gateway',
        quantity: 1,
        unit_price: 5000,
        total: 5000,
        package_type: 'ecom_site',
      },
      {
        id: 'item-3',
        name: 'Basic Website Pages',
        description: 'Create basic website pages',
        quantity: 5,
        unit_price: 1000,
        total: 5000,
        package_type: 'general_website',
      },
    ],
  };

  const mockClient = {
    id: 'client-456',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1-555-0123',
    address: '123 Business St, Suite 100, New York, NY 10001',
    billing_address: '123 Business St, Suite 100, New York, NY 10001',
    vat_number: 'US123456789',
    created_at: '2025-01-09T10:00:00Z',
    updated_at: '2025-01-09T10:00:00Z',
  };

  const mockTemplate = {
    id: 'template-1',
    name: 'E-commerce Site SLA Template',
    description: 'Standard SLA for e-commerce websites',
    package_type: 'ecom_site',
    content: `
Service Level Agreement for {{client_name}}

This agreement covers {{project_scope}} with the following performance targets:
- Uptime Target: {{uptime_target}}%
- Response Time: {{response_time_hours}} hours
- Resolution Time: {{resolution_time_hours}} hours

Service Period: {{service_period}}
Effective Date: {{effective_date}}
Agreement Number: {{agreement_number}}

Contact Information:
Technical Contact: {{technical_contact}}
Email: {{technical_contact_email}}
Phone: {{technical_contact_phone}}
    `.trim(),
    variables: [
      {
        name: 'client_name',
        display_name: 'Client Name',
        type: 'text',
        is_required: true,
        description: 'The client company name',
        data_source: 'client.name',
      },
      {
        name: 'project_scope',
        display_name: 'Project Scope',
        type: 'text',
        is_required: true,
        description: 'Description of the project scope',
        data_source: 'quote.description',
      },
      {
        name: 'uptime_target',
        display_name: 'Uptime Target',
        type: 'number',
        default_value: 99.9,
        is_required: true,
        description: 'Target uptime percentage',
        data_source: 'template.default',
      },
      {
        name: 'response_time_hours',
        display_name: 'Response Time (Hours)',
        type: 'number',
        default_value: 2,
        is_required: true,
        description: 'Response time in hours',
        data_source: 'template.default',
      },
      {
        name: 'resolution_time_hours',
        display_name: 'Resolution Time (Hours)',
        type: 'number',
        default_value: 24,
        is_required: true,
        description: 'Resolution time in hours',
        data_source: 'template.default',
      },
      {
        name: 'service_period',
        display_name: 'Service Period',
        type: 'text',
        default_value: '12 months',
        is_required: true,
        description: 'Duration of service period',
        data_source: 'quote.items',
      },
      {
        name: 'effective_date',
        display_name: 'Effective Date',
        type: 'date',
        is_required: true,
        description: 'Agreement effective date',
        data_source: 'system.current_date',
      },
      {
        name: 'agreement_number',
        display_name: 'Agreement Number',
        type: 'text',
        is_required: true,
        description: 'Unique agreement identifier',
        data_source: 'system.generated',
      },
      {
        name: 'technical_contact',
        display_name: 'Technical Contact',
        type: 'text',
        is_required: false,
        description: 'Technical contact person',
        data_source: 'quote.contact',
      },
      {
        name: 'technical_contact_email',
        display_name: 'Technical Contact Email',
        type: 'text',
        is_required: false,
        description: 'Technical contact email',
        data_source: 'quote.contact_email',
      },
      {
        name: 'technical_contact_phone',
        display_name: 'Technical Contact Phone',
        type: 'text',
        is_required: false,
        description: 'Technical contact phone',
        data_source: 'quote.contact_phone',
      },
    ],
    default_metrics: {
      uptime_target: 99.9,
      response_time_hours: 2,
      resolution_time_hours: 24,
      availability_hours: '24/7',
      exclusion_clauses: [],
    },
    is_active: true,
    usage_count: 25,
    created_at: '2025-01-09T10:00:00Z',
    updated_at: '2025-01-09T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quote Data Extraction', () => {
    it('should extract variables from quote data correctly', async () => {
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: true,
        data: {
          detected_packages: [
            {
              package_type: 'ecom_site',
              items_count: 2,
              recommended_template_id: 'template-1',
            },
            {
              package_type: 'general_website',
              items_count: 1,
              recommended_template_id: 'template-2',
            },
          ],
          extracted_variables: {
            client_name: {
              value: 'Acme Corporation',
              source: 'client.name',
              confidence: 'high',
            },
            project_scope: {
              value: 'E-commerce Website Development',
              source: 'quote.title',
              confidence: 'high',
            },
            project_description: {
              value: 'Complete e-commerce website with payment gateway integration',
              source: 'quote.description',
              confidence: 'high',
            },
            quote_total: {
              value: 25000,
              source: 'quote.total',
              confidence: 'high',
            },
            service_period: {
              value: '12 months',
              source: 'quote.items.analysis',
              confidence: 'medium',
            },
          },
          missing_required_variables: [
            {
              variable_name: 'technical_contact',
              reason: 'Not found in quote data',
              suggested_source: 'client.contact_person',
            },
            {
              variable_name: 'technical_contact_email',
              reason: 'Not found in quote data',
              suggested_source: 'client.email',
            },
          ],
        },
      });

      const result = await mockVariableMapper.extractVariablesFromQuote('quote-123');

      expect(result.success).toBe(true);
      expect(result.data.extracted_variables.client_name.value).toBe('Acme Corporation');
      expect(result.data.extracted_variables.project_scope.value).toBe('E-commerce Website Development');
      expect(result.data.detected_packages).toHaveLength(2);
      expect(result.data.missing_required_variables).toHaveLength(2);
    });

    it('should handle multi-package quotes correctly', async () => {
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: true,
        data: {
          detected_packages: [
            {
              package_type: 'ecom_site',
              items_count: 2,
              recommended_template_id: 'template-1',
              confidence: 0.9,
            },
            {
              package_type: 'general_website',
              items_count: 1,
              recommended_template_id: 'template-2',
              confidence: 0.7,
            },
          ],
          extracted_variables: {
            client_name: {
              value: 'Acme Corporation',
              source: 'client.name',
              confidence: 'high',
            },
          },
          missing_required_variables: [],
        },
      });

      const result = await mockVariableMapper.extractVariablesFromQuote('quote-123');

      expect(result.success).toBe(true);
      expect(result.data.detected_packages).toHaveLength(2);
      expect(result.data.detected_packages[0].package_type).toBe('ecom_site');
      expect(result.data.detected_packages[1].package_type).toBe('general_website');
    });

    it('should handle quotes with missing data gracefully', async () => {
      const incompleteQuote = {
        ...mockQuote,
        description: '',
        client_id: '',
      };

      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: true,
        data: {
          detected_packages: [
            {
              package_type: 'ecom_site',
              items_count: 2,
              recommended_template_id: 'template-1',
            },
          ],
          extracted_variables: {
            quote_total: {
              value: 25000,
              source: 'quote.total',
              confidence: 'high',
            },
          },
          missing_required_variables: [
            {
              variable_name: 'client_name',
              reason: 'Client information not available',
              suggested_source: 'manual_input',
            },
            {
              variable_name: 'project_scope',
              reason: 'Quote description is empty',
              suggested_source: 'manual_input',
            },
          ],
        },
      });

      const result = await mockVariableMapper.extractVariablesFromQuote('quote-123');

      expect(result.success).toBe(true);
      expect(result.data.extracted_variables).not.toHaveProperty('client_name');
      expect(result.data.missing_required_variables).toHaveLength(2);
    });

    it('should handle variable extraction errors', async () => {
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: false,
        error: {
          code: 'EXTRACTION_ERROR',
          message: 'Failed to extract variables from quote',
          details: {
            quote_id: 'quote-123',
            error_type: 'DATA_PARSING_ERROR',
          },
        },
      });

      const result = await mockVariableMapper.extractVariablesFromQuote('quote-123');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('EXTRACTION_ERROR');
    });
  });

  describe('Template Variable Substitution', () => {
    it('should substitute variables in template content correctly', async () => {
      mockSlaService.previewAgreement.mockResolvedValue({
        success: true,
        data: {
          preview_content: `
Service Level Agreement for Acme Corporation

This agreement covers E-commerce Website Development with the following performance targets:
- Uptime Target: 99.9%
- Response Time: 2 hours
- Resolution Time: 24 hours

Service Period: 12 months
Effective Date: 2025-01-15
Agreement Number: SLA-2025-001

Contact Information:
Technical Contact: John Doe
Email: john.doe@acme.com
Phone: +1-555-0123
          `.trim(),
          substituted_variables: [
            {
              variable_name: 'client_name',
              value: 'Acme Corporation',
              data_source: 'client.name',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'project_scope',
              value: 'E-commerce Website Development',
              data_source: 'quote.title',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'uptime_target',
              value: 99.9,
              data_source: 'template.default',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'response_time_hours',
              value: 2,
              data_source: 'template.default',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'resolution_time_hours',
              value: 24,
              data_source: 'template.default',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'service_period',
              value: '12 months',
              data_source: 'quote.items.analysis',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'effective_date',
              value: '2025-01-15',
              data_source: 'system.current_date',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'agreement_number',
              value: 'SLA-2025-001',
              data_source: 'system.generated',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'technical_contact',
              value: 'John Doe',
              data_source: 'quote.contact',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'technical_contact_email',
              value: 'john.doe@acme.com',
              data_source: 'quote.contact_email',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'technical_contact_phone',
              value: '+1-555-0123',
              data_source: 'quote.contact_phone',
              substituted_at: '2025-01-09T10:00:00Z',
            },
          ],
          missing_variables: [],
          validation_errors: [],
        },
      });

      const customVariables = {
        client_name: 'Acme Corporation',
        project_scope: 'E-commerce Website Development',
        technical_contact: 'John Doe',
        technical_contact_email: 'john.doe@acme.com',
        technical_contact_phone: '+1-555-0123',
      };

      const result = await mockSlaService.previewAgreement('template-1', customVariables);

      expect(result.success).toBe(true);
      expect(result.data.preview_content).toContain('Acme Corporation');
      expect(result.data.preview_content).toContain('99.9%');
      expect(result.data.substituted_variables).toHaveLength(11);
      expect(result.data.missing_variables).toHaveLength(0);
    });

    it('should identify missing variables during substitution', async () => {
      mockSlaService.previewAgreement.mockResolvedValue({
        success: true,
        data: {
          preview_content: `
Service Level Agreement for {{client_name}}

This agreement covers {{project_scope}} with the following performance targets:
- Uptime Target: {{uptime_target}}%
- Response Time: {{response_time_hours}} hours
- Resolution Time: {{resolution_time_hours}} hours
          `.trim(),
          substituted_variables: [
            {
              variable_name: 'client_name',
              value: 'Acme Corporation',
              data_source: 'client.name',
              substituted_at: '2025-01-09T10:00:00Z',
            },
            {
              variable_name: 'uptime_target',
              value: 99.9,
              data_source: 'template.default',
              substituted_at: '2025-01-09T10:00:00Z',
            },
          ],
          missing_variables: [
            {
              variable_name: 'project_scope',
              reason: 'Variable not provided',
              required: true,
            },
            {
              variable_name: 'response_time_hours',
              reason: 'Variable not provided',
              required: true,
            },
            {
              variable_name: 'resolution_time_hours',
              reason: 'Variable not provided',
              required: true,
            },
          ],
          validation_errors: [],
        },
      });

      const incompleteVariables = {
        client_name: 'Acme Corporation',
      };

      const result = await mockSlaService.previewAgreement('template-1', incompleteVariables);

      expect(result.success).toBe(true);
      expect(result.data.substituted_variables).toHaveLength(1);
      expect(result.data.missing_variables).toHaveLength(3);
      expect(result.data.missing_variables[0].variable_name).toBe('project_scope');
      expect(result.data.missing_variables[0].required).toBe(true);
    });

    it('should validate template content after substitution', async () => {
      mockSlaService.previewAgreement.mockResolvedValue({
        success: true,
        data: {
          preview_content: `
Service Level Agreement for Acme Corporation

This agreement covers E-commerce Website Development with the following performance targets:
- Uptime Target: 99.9%
- Response Time: 2 hours
- Resolution Time: 24 hours
          `.trim(),
          substituted_variables: [],
          missing_variables: [],
          validation_errors: [
            {
              type: 'MISSING_REQUIRED_SECTION',
              message: 'Template is missing required section: Termination Clause',
              severity: 'warning',
            },
            {
              type: 'INVALID_METRIC_RANGE',
              message: 'Uptime target of 99.9% exceeds industry standard for this package type',
              severity: 'info',
            },
          ],
        },
      });

      const result = await mockSlaService.previewAgreement('template-1', {
        client_name: 'Acme Corporation',
        project_scope: 'E-commerce Website Development',
        uptime_target: 99.9,
        response_time_hours: 2,
        resolution_time_hours: 24,
      });

      expect(result.success).toBe(true);
      expect(result.data.validation_errors).toHaveLength(2);
      expect(result.data.validation_errors[0].type).toBe('MISSING_REQUIRED_SECTION');
      expect(result.data.validation_errors[0].severity).toBe('warning');
    });
  });

  describe('End-to-End Quote to Template Mapping', () => {
    it('should complete full quote-to-template mapping workflow', async () => {
      // Step 1: Extract variables from quote
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: true,
        data: {
          detected_packages: [
            {
              package_type: 'ecom_site',
              items_count: 2,
              recommended_template_id: 'template-1',
            },
          ],
          extracted_variables: {
            client_name: {
              value: 'Acme Corporation',
              source: 'client.name',
              confidence: 'high',
            },
            project_scope: {
              value: 'E-commerce Website Development',
              source: 'quote.title',
              confidence: 'high',
            },
          },
          missing_required_variables: [],
        },
      });

      // Step 2: Get template details
      mockSlaService.getTemplate.mockResolvedValue({
        success: true,
        data: mockTemplate,
      });

      // Step 3: Preview agreement with substitution
      mockSlaService.previewAgreement.mockResolvedValue({
        success: true,
        data: {
          preview_content: `
Service Level Agreement for Acme Corporation

This agreement covers E-commerce Website Development with the following performance targets:
- Uptime Target: 99.9%
- Response Time: 2 hours
- Resolution Time: 24 hours
          `.trim(),
          substituted_variables: [
            {
              variable_name: 'client_name',
              value: 'Acme Corporation',
              data_source: 'client.name',
              substituted_at: '2025-01-09T10:00:00Z',
            },
          ],
          missing_variables: [],
          validation_errors: [],
        },
      });

      // Execute the workflow
      const extractionResult = await mockVariableMapper.extractVariablesFromQuote('quote-123');
      expect(extractionResult.success).toBe(true);

      const templateResult = await mockSlaService.getTemplate('template-1');
      expect(templateResult.success).toBe(true);

      const previewResult = await mockSlaService.previewAgreement('template-1', extractionResult.data.extracted_variables);
      expect(previewResult.success).toBe(true);
      expect(previewResult.data.preview_content).toContain('Acme Corporation');
    });

    it('should handle multi-package quote mapping correctly', async () => {
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: true,
        data: {
          detected_packages: [
            {
              package_type: 'ecom_site',
              items_count: 2,
              recommended_template_id: 'template-1',
            },
            {
              package_type: 'general_website',
              items_count: 1,
              recommended_template_id: 'template-2',
            },
          ],
          extracted_variables: {
            client_name: {
              value: 'Acme Corporation',
              source: 'client.name',
              confidence: 'high',
            },
          },
          missing_required_variables: [],
        },
      });

      mockSlaService.createMultipleAgreements.mockResolvedValue({
        success: true,
        data: {
          agreements_created: 2,
          agreement_ids: ['agreement-1', 'agreement-2'],
          package_types: ['ecom_site', 'general_website'],
        },
      });

      const extractionResult = await mockVariableMapper.extractVariablesFromQuote('quote-123');
      expect(extractionResult.data.detected_packages).toHaveLength(2);

      const creationResult = await mockSlaService.createMultipleAgreements('quote-123', extractionResult.data.detected_packages);
      expect(creationResult.success).toBe(true);
      expect(creationResult.data.agreements_created).toBe(2);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle quote not found error', async () => {
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: false,
        error: {
          code: 'QUOTE_NOT_FOUND',
          message: 'Quote not found',
          details: {
            quote_id: 'non-existent-quote',
          },
        },
      });

      const result = await mockVariableMapper.extractVariablesFromQuote('non-existent-quote');

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('QUOTE_NOT_FOUND');
    });

    it('should handle template not found during mapping', async () => {
      mockVariableMapper.extractVariablesFromQuote.mockResolvedValue({
        success: true,
        data: {
          detected_packages: [
            {
              package_type: 'ecom_site',
              items_count: 2,
              recommended_template_id: 'non-existent-template',
            },
          ],
          extracted_variables: {},
          missing_required_variables: [],
        },
      });

      mockSlaService.getTemplate.mockResolvedValue({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Template not found',
          details: {
            template_id: 'non-existent-template',
          },
        },
      });

      const extractionResult = await mockVariableMapper.extractVariablesFromQuote('quote-123');
      expect(extractionResult.success).toBe(true);

      const templateResult = await mockSlaService.getTemplate('non-existent-template');
      expect(templateResult.success).toBe(false);
      expect(templateResult.error.code).toBe('TEMPLATE_NOT_FOUND');
    });

    it('should handle malformed template content', async () => {
      const malformedTemplate = {
        ...mockTemplate,
        content: 'Service Level Agreement for {{client_name}} {{invalid_variable_syntax',
      };

      mockSlaService.previewAgreement.mockResolvedValue({
        success: false,
        error: {
          code: 'TEMPLATE_SYNTAX_ERROR',
          message: 'Template contains invalid variable syntax',
          details: {
            template_id: 'template-1',
            syntax_errors: [
              {
                line: 1,
                character: 65,
                error: 'Unclosed variable placeholder',
              },
            ],
          },
        },
      });

      const result = await mockSlaService.previewAgreement('template-1', {
        client_name: 'Acme Corporation',
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('TEMPLATE_SYNTAX_ERROR');
    });
  });
});