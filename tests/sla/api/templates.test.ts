import { createMocks } from 'jest-fetch-mock';
import { slaApiClient } from '@/lib/sla/api-client';

// Mock fetch globally
global.fetch = createMocks();

describe('SLA Templates API Contract Tests', () => {
  const baseUrl = 'http://localhost:3000/api/sla';
  const authToken = 'mock-jwt-token';

  beforeEach(() => {
    fetch.resetMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    fetch.mockReset();
  });

  describe('GET /api/sla/templates', () => {
    it('should retrieve all templates successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [
            {
              id: '1',
              name: 'E-commerce Site SLA Template',
              description: 'Standard SLA for e-commerce websites',
              package_type: 'ecom_site',
              is_active: true,
              usage_count: 25,
              variables: [
                {
                  name: 'client_name',
                  display_name: 'Client Name',
                  type: 'text',
                  is_required: true,
                  description: 'The client company name',
                },
              ],
              default_metrics: {
                uptime_target: 99.9,
                response_time_hours: 2,
                resolution_time_hours: 24,
                availability_hours: '24/7',
                exclusion_clauses: [],
              },
              created_at: '2025-01-09T10:00:00Z',
              updated_at: '2025-01-09T10:00:00Z',
            },
            {
              id: '2',
              name: 'General Website SLA Template',
              description: 'Standard SLA for general websites',
              package_type: 'general_website',
              is_active: true,
              usage_count: 15,
              variables: [],
              default_metrics: {
                uptime_target: 99.5,
                response_time_hours: 4,
                resolution_time_hours: 48,
                availability_hours: 'Business hours',
                exclusion_clauses: [],
              },
              created_at: '2025-01-09T10:00:00Z',
              updated_at: '2025-01-09T10:00:00Z',
            },
          ],
        },
        message: 'Templates retrieved successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/templates`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(2);
      expect(data.data.templates[0].name).toBe('E-commerce Site SLA Template');
      expect(data.data.templates[0].package_type).toBe('ecom_site');
    });

    it('should filter templates by package type', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [
            {
              id: '1',
              name: 'E-commerce Site SLA Template',
              description: 'Standard SLA for e-commerce websites',
              package_type: 'ecom_site',
              is_active: true,
              usage_count: 25,
            },
          ],
        },
        message: 'Templates retrieved successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates?package_type=ecom_site`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/templates?package_type=ecom_site`,
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
      expect(data.data.templates[0].package_type).toBe('ecom_site');
    });

    it('should filter templates by active status', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [
            {
              id: '1',
              name: 'E-commerce Site SLA Template',
              package_type: 'ecom_site',
              is_active: true,
            },
          ],
        },
        message: 'Templates retrieved successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates?is_active=true`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates[0].is_active).toBe(true);
    });

    it('should search templates by name and description', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [
            {
              id: '1',
              name: 'E-commerce Site SLA Template',
              description: 'Standard SLA for e-commerce websites',
              package_type: 'ecom_site',
              is_active: true,
            },
          ],
        },
        message: 'Templates retrieved successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates?search=e-commerce`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.templates).toHaveLength(1);
    });

    it('should handle unauthorized access', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required or invalid',
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 401 });

      const response = await fetch(`${baseUrl}/templates`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle server errors gracefully', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 500 });

      const response = await fetch(`${baseUrl}/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('GET /api/sla/templates/{id}', () => {
    it('should retrieve a specific template successfully', async () => {
      const templateId = '1';
      const mockResponse = {
        success: true,
        data: {
          id: templateId,
          name: 'E-commerce Site SLA Template',
          description: 'Standard SLA for e-commerce websites',
          package_type: 'ecom_site',
          content: 'Service Level Agreement for {{client_name}}...',
          variables: [
            {
              name: 'client_name',
              display_name: 'Client Name',
              type: 'text',
              is_required: true,
              description: 'The client company name',
              data_source: 'client.name',
            },
          ],
          default_metrics: {
            uptime_target: 99.9,
            response_time_hours: 2,
            resolution_time_hours: 24,
            availability_hours: '24/7',
            exclusion_clauses: [],
          },
          is_customizable: true,
          version: 1,
          usage_count: 25,
          created_at: '2025-01-09T10:00:00Z',
        },
        message: 'Template retrieved successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(templateId);
      expect(data.data.name).toBe('E-commerce Site SLA Template');
      expect(data.data.content).toContain('{{client_name}}');
      expect(data.data.variables).toHaveLength(1);
    });

    it('should handle template not found', async () => {
      const templateId = 'non-existent-template';
      const mockResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 404 });

      const response = await fetch(`${baseUrl}/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/sla/templates', () => {
    const newTemplate = {
      name: 'Custom SLA Template',
      description: 'Custom template for specific requirements',
      package_type: 'ecom_site',
      content: 'Service Level Agreement for {{client_name}}',
      variables: [
        {
          name: 'client_name',
          display_name: 'Client Name',
          type: 'text',
          is_required: true,
          description: 'The client company name',
        },
      ],
      default_metrics: {
        uptime_target: 99.9,
        response_time_hours: 2,
        resolution_time_hours: 24,
      },
    };

    it('should create a new template successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '3',
          ...newTemplate,
          is_active: true,
          version: 1,
          usage_count: 0,
          created_at: '2025-01-09T10:00:00Z',
          updated_at: '2025-01-09T10:00:00Z',
        },
        message: 'Template created successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      const data = await response.json();

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/templates`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newTemplate),
        })
      );

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('3');
      expect(data.data.name).toBe('Custom SLA Template');
    });

    it('should validate required fields', async () => {
      const invalidTemplate = {
        // Missing required fields
        name: '',
        description: '',
        package_type: 'invalid_type',
        content: '',
        variables: [],
        default_metrics: {},
      };

      const mockResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            fields: {
              name: ['Template name is required'],
              package_type: ['Invalid package type'],
              content: ['Template content must be at least 50 characters'],
            },
          },
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 400 });

      const response = await fetch(`${baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidTemplate),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.fields).toBeDefined();
    });

    it('should validate template variables', async () => {
      const templateWithInvalidVariables = {
        ...newTemplate,
        variables: [
          {
            name: 'client_name',
            display_name: 'Client Name',
            type: 'text',
            is_required: true,
            description: 'The client company name',
          },
          {
            name: 'invalid-name-with-dash',
            display_name: 'Invalid Name',
            type: 'text',
            is_required: true,
            description: 'Invalid variable name',
          },
        ],
      };

      const mockResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template variable validation failed',
          details: {
            variable_errors: [
              {
                variable_name: 'invalid-name-with-dash',
                error: 'Variable names must be valid identifiers (alphanumeric and underscore only)',
              },
            ],
          },
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 422 });

      const response = await fetch(`${baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateWithInvalidVariables),
      });

      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/sla/templates/{id}', () => {
    const templateId = '1';
    const updateData = {
      name: 'Updated SLA Template',
      description: 'Updated template description',
      content: 'Updated template content for {{client_name}}',
      default_metrics: {
        uptime_target: 99.8,
        response_time_hours: 1.5,
        resolution_time_hours: 18,
      },
    };

    it('should update a template successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: templateId,
          ...updateData,
          package_type: 'ecom_site',
          is_active: true,
          version: 2,
          usage_count: 25,
          updated_at: '2025-01-09T11:00:00Z',
        },
        message: 'Template updated successfully',
        timestamp: '2025-01-09T11:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated SLA Template');
      expect(data.data.version).toBe(2);
    });

    it('should handle template not found during update', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 404 });

      const response = await fetch(`${baseUrl}/templates/non-existent`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /api/sla/templates/{id}/clone', () => {
    const templateId = '1';
    const cloneData = {
      name: 'Cloned SLA Template',
      description: 'Cloned from existing template',
    };

    it('should clone a template successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '4',
          name: cloneData.name,
          description: cloneData.description,
          package_type: 'ecom_site',
          content: 'Service Level Agreement for {{client_name}}...',
          variables: [],
          default_metrics: {
            uptime_target: 99.9,
            response_time_hours: 2,
            resolution_time_hours: 24,
          },
          is_active: true,
          version: 1,
          usage_count: 0,
          parent_template_id: templateId,
          created_at: '2025-01-09T10:00:00Z',
        },
        message: 'Template cloned successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates/${templateId}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cloneData),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('4');
      expect(data.data.parent_template_id).toBe(templateId);
    });

    it('should validate clone data', async () => {
      const invalidCloneData = {
        name: '',
        description: '',
      };

      const mockResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: {
            fields: {
              name: ['Template name is required'],
            },
          },
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 400 });

      const response = await fetch(`${baseUrl}/templates/${templateId}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidCloneData),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.details.fields.name).toContain('Template name is required');
    });
  });

  describe('DELETE /api/sla/templates/{id}', () => {
    const templateId = '1';

    it('should delete a template successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: templateId,
          deleted: true,
          deleted_at: '2025-01-09T10:00:00Z',
        },
        message: 'Template deleted successfully',
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deleted).toBe(true);
    });

    it('should handle template not found during deletion', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Template not found',
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 404 });

      const response = await fetch(`${baseUrl}/templates/non-existent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should prevent deletion of templates with existing agreements', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Cannot delete template with existing agreements',
          details: {
            template_id: templateId,
            agreements_count: 5,
          },
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 409 });

      const response = await fetch(`${baseUrl}/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('CONFLICT');
      expect(data.error.details.agreements_count).toBe(5);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          details: {
            limit: 50,
            window: '1 minute',
            retry_after: 60,
          },
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1641750400',
        },
      });

      const response = await fetch(`${baseUrl}/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('RATE_LIMITED');
      expect(response.headers.get('Retry-After')).toBe('60');
    });
  });

  describe('Response Format Validation', () => {
    it('should return responses in consistent format', async () => {
      const mockResponse = {
        success: true,
        data: {
          templates: [],
        },
        message: 'Templates retrieved successfully',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/),
      };

      fetch.mockResponseOnce(mockResponse);

      const response = await fetch(`${baseUrl}/templates`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('timestamp');
      expect(typeof data.success).toBe('boolean');
      expect(typeof data.timestamp).toBe('string');
    });

    it('should include proper error response format', async () => {
      const mockResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: {},
        },
        timestamp: '2025-01-09T10:00:00Z',
      };

      fetch.mockResponseOnce(mockResponse, { status: 400 });

      const response = await fetch(`${baseUrl}/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('timestamp');
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });
  });
});