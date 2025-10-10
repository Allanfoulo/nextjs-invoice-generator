import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateSelector } from '@/components/sla/template-selector';
import { slaService } from '@/lib/sla/sla-service';

// Mock the SLA service
jest.mock('@/lib/sla/sla-service');
const mockSlaService = slaService as jest.Mocked<typeof slaService>;

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
  }),
}));

describe('TemplateSelector', () => {
  const mockTemplates = [
    {
      id: '1',
      name: 'E-commerce Site SLA Template',
      description: 'Standard SLA for e-commerce websites',
      package_type: 'ecom_site' as const,
      is_active: true,
      usage_count: 25,
      created_at: '2025-01-09T10:00:00Z',
      updated_at: '2025-01-09T10:00:00Z',
      variables: [],
      default_metrics: {
        uptime_target: 99.9,
        response_time_hours: 2,
        resolution_time_hours: 24,
        availability_hours: '24/7',
        exclusion_clauses: [],
      },
      penalty_structure: {
        breach_penalty_rate: 10,
        maximum_penalty: 10000,
        grace_period_hours: 24,
        credit_terms: 'Service credits applied monthly',
      },
    },
    {
      id: '2',
      name: 'General Website SLA Template',
      description: 'Standard SLA for general websites',
      package_type: 'general_website' as const,
      is_active: true,
      usage_count: 15,
      created_at: '2025-01-09T10:00:00Z',
      updated_at: '2025-01-09T10:00:00Z',
      variables: [],
      default_metrics: {
        uptime_target: 99.5,
        response_time_hours: 4,
        resolution_time_hours: 48,
        availability_hours: 'Business hours',
        exclusion_clauses: [],
      },
      penalty_structure: {
        breach_penalty_rate: 5,
        maximum_penalty: 5000,
        grace_period_hours: 48,
        credit_terms: 'Service credits applied quarterly',
      },
    },
    {
      id: '3',
      name: 'Business Process Systems SLA Template',
      description: 'Standard SLA for business process systems',
      package_type: 'business_process_systems' as const,
      is_active: true,
      usage_count: 10,
      created_at: '2025-01-09T10:00:00Z',
      updated_at: '2025-01-09T10:00:00Z',
      variables: [],
      default_metrics: {
        uptime_target: 99.8,
        response_time_hours: 1,
        resolution_time_hours: 8,
        availability_hours: '24/7',
        exclusion_clauses: [],
      },
      penalty_structure: {
        breach_penalty_rate: 15,
        maximum_penalty: 20000,
        grace_period_hours: 12,
        credit_terms: 'Service credits applied monthly',
      },
    },
    {
      id: '4',
      name: 'Marketing SLA Template',
      description: 'Standard SLA for marketing services',
      package_type: 'marketing' as const,
      is_active: true,
      usage_count: 5,
      created_at: '2025-01-09T10:00:00Z',
      updated_at: '2025-01-09T10:00:00Z',
      variables: [],
      default_metrics: {
        uptime_target: 99.0,
        response_time_hours: 8,
        resolution_time_hours: 72,
        availability_hours: 'Business hours',
        exclusion_clauses: [],
      },
      penalty_structure: {
        breach_penalty_rate: 8,
        maximum_penalty: 7500,
        grace_period_hours: 36,
        credit_terms: 'Service credits applied monthly',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Package Type Filtering', () => {
    it('should display all templates when no package type filter is applied', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      // Wait for templates to load
      expect(await screen.findByText('E-commerce Site SLA Template')).toBeInTheDocument();
      expect(screen.getByText('General Website SLA Template')).toBeInTheDocument();
      expect(screen.getByText('Business Process Systems SLA Template')).toBeInTheDocument();
      expect(screen.getByText('Marketing SLA Template')).toBeInTheDocument();
    });

    it('should filter templates by ecom_site package type', async () => {
      const ecomSiteTemplates = mockTemplates.filter(t => t.package_type === 'ecom_site');
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: ecomSiteTemplates },
      });

      render(<TemplateSelector packageType="ecom_site" />);

      expect(await screen.findByText('E-commerce Site SLA Template')).toBeInTheDocument();
      expect(screen.queryByText('General Website SLA Template')).not.toBeInTheDocument();
      expect(screen.queryByText('Business Process Systems SLA Template')).not.toBeInTheDocument();
      expect(screen.queryByText('Marketing SLA Template')).not.toBeInTheDocument();
    });

    it('should filter templates by general_website package type', async () => {
      const generalWebsiteTemplates = mockTemplates.filter(t => t.package_type === 'general_website');
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: generalWebsiteTemplates },
      });

      render(<TemplateSelector packageType="general_website" />);

      expect(screen.queryByText('E-commerce Site SLA Template')).not.toBeInTheDocument();
      expect(await screen.findByText('General Website SLA Template')).toBeInTheDocument();
      expect(screen.queryByText('Business Process Systems SLA Template')).not.toBeInTheDocument();
      expect(screen.queryByText('Marketing SLA Template')).not.toBeInTheDocument();
    });

    it('should filter templates by business_process_systems package type', async () => {
      const businessProcessTemplates = mockTemplates.filter(t => t.package_type === 'business_process_systems');
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: businessProcessTemplates },
      });

      render(<TemplateSelector packageType="business_process_systems" />);

      expect(screen.queryByText('E-commerce Site SLA Template')).not.toBeInTheDocument();
      expect(screen.queryByText('General Website SLA Template')).not.toBeInTheDocument();
      expect(await screen.findByText('Business Process Systems SLA Template')).toBeInTheDocument();
      expect(screen.queryByText('Marketing SLA Template')).not.toBeInTheDocument();
    });

    it('should filter templates by marketing package type', async () => {
      const marketingTemplates = mockTemplates.filter(t => t.package_type === 'marketing');
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: marketingTemplates },
      });

      render(<TemplateSelector packageType="marketing" />);

      expect(screen.queryByText('E-commerce Site SLA Template')).not.toBeInTheDocument();
      expect(screen.queryByText('General Website SLA Template')).not.toBeInTheDocument();
      expect(screen.queryByText('Business Process Systems SLA Template')).not.toBeInTheDocument();
      expect(await screen.findByText('Marketing SLA Template')).toBeInTheDocument();
    });

    it('should handle empty results for a package type', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: [] },
      });

      render(<TemplateSelector packageType="ecom_site" />);

      expect(await screen.findByText(/No templates found/i)).toBeInTheDocument();
      expect(screen.queryByText('E-commerce Site SLA Template')).not.toBeInTheDocument();
    });

    it('should display loading state while fetching templates', () => {
      mockSlaService.getTemplates.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<TemplateSelector />);

      expect(screen.getByText(/Loading templates/i)).toBeInTheDocument();
    });

    it('should display error state when template fetch fails', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch templates',
        },
      });

      render(<TemplateSelector />);

      expect(await screen.findByText(/Failed to load templates/i)).toBeInTheDocument();
      expect(screen.getByText(/Please try again later/i)).toBeInTheDocument();
    });
  });

  describe('Template Selection', () => {
    it('should call onTemplateSelect when a template is selected', async () => {
      const mockOnTemplateSelect = jest.fn();
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector onTemplateSelect={mockOnTemplateSelect} />);

      const templateCard = await screen.findByText('E-commerce Site SLA Template');
      templateCard.click();

      expect(mockOnTemplateSelect).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should show template details when template is hovered or focused', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      const templateCard = await screen.findByText('E-commerce Site SLA Template');

      // Hover over the template
      templateCard.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

      // Should show package type and usage count
      expect(screen.getByText(/ecom_site/i)).toBeInTheDocument();
      expect(screen.getByText(/Used 25 times/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should render correctly on mobile viewport', async () => {
      // Set mobile viewport
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));

      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      expect(await screen.findByText('E-commerce Site SLA Template')).toBeInTheDocument();

      // Should have mobile-friendly layout classes
      const container = screen.getByTestId('template-selector-container');
      expect(container).toHaveClass('mobile-layout');
    });

    it('should switch to grid layout on tablet viewport', async () => {
      // Set tablet viewport
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.dispatchEvent(new Event('resize'));

      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      expect(await screen.findByText('E-commerce Site SLA Template')).toBeInTheDocument();

      // Should have tablet grid layout classes
      const container = screen.getByTestId('template-selector-container');
      expect(container).toHaveClass('tablet-grid');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for template selection', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      const templateCard = await screen.findByRole('button', {
        name: /Select E-commerce Site SLA Template/i,
      });

      expect(templateCard).toHaveAttribute('aria-describedby', expect.stringContaining('template-description'));
    });

    it('should support keyboard navigation', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      const firstTemplate = await screen.findByRole('button', {
        name: /Select E-commerce Site SLA Template/i,
      });

      firstTemplate.focus();
      expect(firstTemplate).toHaveFocus();

      // Tab to next template
      await userEvent.tab();
      const secondTemplate = screen.getByRole('button', {
        name: /Select General Website SLA Template/i,
      });
      expect(secondTemplate).toHaveFocus();
    });
  });

  describe('Search Functionality', () => {
    it('should filter templates by search term', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      const searchInput = screen.getByPlaceholderText(/Search templates/i);

      // Type search term
      await userEvent.type(searchInput, 'e-commerce');

      // Should only show matching templates
      expect(await screen.findByText('E-commerce Site SLA Template')).toBeInTheDocument();
      expect(screen.queryByText('General Website SLA Template')).not.toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
      mockSlaService.getTemplates.mockResolvedValue({
        success: true,
        data: { templates: mockTemplates },
      });

      render(<TemplateSelector />);

      const searchInput = screen.getByPlaceholderText(/Search templates/i);
      const clearButton = screen.getByRole('button', { name: /Clear search/i });

      // Type search term
      await userEvent.type(searchInput, 'test');

      // Clear search
      await userEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(await screen.findByText('E-commerce Site SLA Template')).toBeInTheDocument();
      expect(screen.getByText('General Website SLA Template')).toBeInTheDocument();
    });
  });
});