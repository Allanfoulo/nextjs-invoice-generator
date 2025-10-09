// Megasol Service Agreement Template
// Based on the service agreement PDF for online store development

export interface SLATemplateHTML {
  id: string;
  name: string;
  category: 'standard' | 'enterprise' | 'specialized';
  htmlContent: string;
  previewText: string;
  variables: Record<string, string>;
}

export const slaTemplateHTMLs: SLATemplateHTML[] = [
  {
    id: 'megasol-service-agreement',
    name: 'Megasol Service Agreement',
    category: 'standard',
    previewText: 'Service agreement for online store development with 40% deposit and 60% final payment structure.',
    variables: {
      client_name: 'MEGA INDUSTRIAL SOLUTIONS',
      client_company: 'MEGA INDUSTRIAL SOLUTIONS',
      service_provider: 'INNOVATION IMPERIAL',
      effective_date: '09/09/2025',
      spec_sheet_required: 'comprehensive specification document',
      deposit_percentage: '40',
      final_percentage: '60',
      deposit_days: '3',
      final_payment_days: '3',
      support_months: '3',
      project_timeline: 'established upon Spec Sheet approval'
    },
    htmlContent: `
      <div class="sla-template-content space-y-8">
        <!-- Header Section -->
        <div class="text-center border-b pb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">Service Terms of Agreement</h1>
          <p class="text-lg text-gray-600 mb-6">Online Store Development Agreement</p>
          <div class="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 class="font-semibold mb-2">Service Provider</h3>
              <p class="text-gray-600">{{SERVICE_PROVIDER}}</p>
              <p class="text-gray-600">Chief Operating Officer: Mcmarsh Dzwimbu</p>
            </div>
            <div>
              <h3 class="font-semibold mb-2">Client</h3>
              <p class="text-gray-600">{{CLIENT_NAME}}</p>
              <p class="text-gray-600">{{CLIENT_COMPANY}}</p>
            </div>
          </div>
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600"><strong>Effective Date:</strong> {{EFFECTIVE_DATE}}</p>
          </div>
        </div>

        <!-- Project Scope and Specifications -->
        <div class="bg-blue-50 p-6 rounded-lg">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            1. Project Scope and Specifications
          </h2>

          <div class="space-y-4">
            <div>
              <h3 class="font-medium mb-2">1.1 Specification Document Requirement</h3>
              <p class="text-gray-700 leading-relaxed">
                Prior to project commencement, the Client ({{CLIENT_NAME}}) must provide a
                {{SPEC_SHEET_REQUIRED}} (the "Spec Sheet") that details all requirements, features,
                functionalities, and design elements for the online store development project.
              </p>
            </div>

            <div>
              <h3 class="font-medium mb-2">1.2 Scope Definition</h3>
              <p class="text-gray-700 leading-relaxed">
                All work will be performed strictly in accordance with the approved Spec Sheet. The Spec Sheet
                will serve as the definitive guide for project deliverables and will be considered the complete
                scope of work for this agreement.
              </p>
            </div>

            <div>
              <h3 class="font-medium mb-2">1.3 Specification Review</h3>
              <p class="text-gray-700 leading-relaxed">
                Upon receipt of the Spec Sheet, the Service Provider ({{SERVICE_PROVIDER}}) will review
                the document and may request clarifications or modifications to ensure technical feasibility and
                clear understanding of requirements.
              </p>
            </div>
          </div>
        </div>

        <!-- Payment Terms -->
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-green-50 p-6 rounded-lg">
            <h3 class="font-semibold mb-4 text-lg flex items-center gap-2">
              <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
              </svg>
              2. Payment Terms
            </h3>

            <div class="space-y-4">
              <div>
                <h4 class="font-medium mb-2">2.1 Deposit Payment</h4>
                <p class="text-sm text-gray-700">
                  Upon approval of the Spec Sheet, the Client will be invoiced for a deposit of
                  <strong>{{DEPOSIT_PERCENTAGE}}%</strong> of the total project cost. This deposit covers
                  the procurement of necessary tooling, software licenses, development resources, and
                  project initiation costs.
                </p>
              </div>

              <div>
                <h4 class="font-medium mb-2">2.2 Deposit Due Date</h4>
                <p class="text-sm text-gray-700">
                  The {{DEPOSIT_PERCENTAGE}}% deposit must be paid within {{DEPOSIT_DAYS}} business days
                  of invoice receipt. Project work will commence only after deposit payment is confirmed.
                </p>
              </div>

              <div>
                <h4 class="font-medium mb-2">2.3 Final Payment</h4>
                <p class="text-sm text-gray-700">
                  The remaining {{FINAL_PERCENTAGE}}% balance is due upon completion and delivery of all
                  requirements specified in the approved Spec Sheet. Final payment must be made within
                  {{FINAL_PAYMENT_DAYS}} business days of project completion notification.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="font-semibold mb-4 text-lg">Payment Schedule</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <div class="font-medium">Deposit Payment</div>
                  <div class="text-sm text-gray-600">{{DEPOSIT_PERCENTAGE}}% of total cost</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-green-600">{{DEPOSIT_PERCENTAGE}}%</div>
                  <div class="text-sm text-gray-600">Due: {{DEPOSIT_DAYS}} business days</div>
                </div>
              </div>

              <div class="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <div class="font-medium">Final Payment</div>
                  <div class="text-sm text-gray-600">{{FINAL_PERCENTAGE}}% of total cost</div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-blue-600">{{FINAL_PERCENTAGE}}%</div>
                  <div class="text-sm text-gray-600">Due: {{FINAL_PAYMENT_DAYS}} business days</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Change Management -->
        <div class="bg-amber-50 p-6 rounded-lg border border-amber-200">
          <h3 class="font-semibold mb-4 text-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            3. Change Management and Additional Work
          </h3>

          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">3.1 Scope Adherence</h4>
              <p class="text-gray-700 text-sm">
                All development work will be limited to the requirements explicitly outlined in the approved
                Spec Sheet. Any requests for modifications, additions, or enhancements not included in the
                original specification will be considered out-of-scope.
              </p>
            </div>

            <div>
              <h4 class="font-medium mb-2">3.2 Change Requests</h4>
              <p class="text-gray-700 text-sm">
                Any work requested outside the scope of the approved Spec Sheet will be classified as a
                "Change Request" or "Feature Request" and will require separate authorization and payment.
              </p>
            </div>

            <div>
              <h4 class="font-medium mb-2">3.3 Additional Work Pricing</h4>
              <p class="text-gray-700 text-sm mb-2">
                Change Requests will be charged as a percentage of the original project cost, determined by:
              </p>
              <ul class="text-sm space-y-1 ml-4">
                <li>• Task complexity and integration requirements</li>
                <li>• Development time and resources needed</li>
                <li>• Impact on existing functionality</li>
                <li>• Technical difficulty of implementation</li>
              </ul>
            </div>

            <div>
              <h4 class="font-medium mb-2">3.4 Change Request Process</h4>
              <p class="text-gray-700 text-sm">
                All Change Requests must be submitted in writing, reviewed and quoted by the Service Provider,
                approved and paid for before work commences, and documented with clear specifications and
                acceptance criteria.
              </p>
            </div>
          </div>
        </div>

        <!-- Project Delivery -->
        <div class="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
          <h3 class="font-semibold mb-4 text-lg flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            4. Project Delivery and Completion
          </h3>

          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">4.1 Completion Criteria</h4>
              <p class="text-gray-700 text-sm">
                The project will be considered complete when all requirements listed in the approved Spec Sheet
                have been implemented, tested, and delivered to the Client's satisfaction.
              </p>
            </div>

            <div>
              <h4 class="font-medium mb-2">4.2 Delivery Method</h4>
              <p class="text-gray-700 text-sm">
                Upon completion, the Service Provider will provide the Client with access to the completed
                online store system and any relevant documentation, credentials, or transfer materials as
                specified in the Spec Sheet.
              </p>
            </div>

            <div>
              <h4 class="font-medium mb-2">4.3 Acceptance Period</h4>
              <p class="text-gray-700 text-sm">
                The Client ({{CLIENT_NAME}}) will have {{FINAL_PAYMENT_DAYS}} business days from delivery
                notification to review the completed work and confirm acceptance based on the Spec Sheet
                requirements.
              </p>
            </div>
          </div>
        </div>

        <!-- General Terms -->
        <div class="grid md:grid-cols-2 gap-8">
          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="font-semibold mb-4 text-lg">5. General Terms</h3>

            <div class="space-y-4">
              <div>
                <h4 class="font-medium mb-2">5.1 Timeline</h4>
                <p class="text-sm text-gray-700">
                  Project timeline will be {{PROJECT_TIMELINE}} and confirmation of deposit
                  payment. Timelines may be adjusted based on Client feedback response times and Change
                  Request implementations.
                </p>
              </div>

              <div>
                <h4 class="font-medium mb-2">5.2 Communication</h4>
                <p class="text-sm text-gray-700">
                  Regular project updates will be provided to the Client. All project communications, approvals,
                  and Change Requests must be documented in writing.
                </p>
              </div>

              <div>
                <h4 class="font-medium mb-2">5.3 Intellectual Property</h4>
                <p class="text-sm text-gray-700">
                  Upon final payment, all custom development work specific to the Client's online store will be
                  transferred to the Client and the software and application will be 100% owned by the client as
                  their intellectual property.
                </p>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 p-6 rounded-lg">
            <h3 class="font-semibold mb-4 text-lg">Support & Warranty</h3>

            <div class="space-y-4">
              <div>
                <h4 class="font-medium mb-2">5.4 Support and Warranty</h4>
                <p class="text-sm text-gray-700">
                  {{SUPPORT_MONTHS}} months of support will be given to the client ({{CLIENT_NAME}}) free of
                  charge for any technical maintenance (e.g downtime) and after the {{SUPPORT_MONTHS}} months lapse
                  the client will be charged for maintenance depending on the complexity of the maintenance query.
                </p>
              </div>

              <div>
                <h4 class="font-medium mb-2">5.5 Force Majeure and Service Provider Indemnification</h4>
                <p class="text-sm text-gray-700 mb-2">
                  {{SERVICE_PROVIDER}} shall be indemnified and held harmless from any liability, damages, or
                  service interruptions caused by circumstances beyond the control of the custom software
                  development, including but not limited to:
                </p>
                <ul class="text-sm space-y-1 ml-4">
                  <li>• Natural disasters (earthquakes, floods, fires, storms, etc.)</li>
                  <li>• Hosting platform failures or outages</li>
                  <li>• Database platform failures or service interruptions</li>
                  <li>• Third-party service provider failures</li>
                  <li>• Internet service provider outages</li>
                  <li>• Power grid failures or electrical outages</li>
                  <li>• Cyber attacks on infrastructure providers</li>
                  <li>• Government regulations or actions affecting third-party services</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Agreement Acceptance -->
        <div class="bg-gray-50 p-8 rounded-lg border">
          <h3 class="font-semibold mb-6 text-lg text-center">6. Agreement Acceptance</h3>
          <p class="text-gray-700 mb-6 text-center">
            By signing below, both parties acknowledge they have read, understood, and agree to be bound
            by these terms and conditions.
          </p>

          <div class="grid grid-cols-2 gap-8">
            <div>
              <p class="text-sm text-gray-600 mb-4">
                <strong>Service Provider:</strong>
              </p>
              <div class="space-y-3">
                <div class="border-b border-gray-300 pb-1">______________________________</div>
                <p class="text-xs text-gray-500">Signature</p>
                <div class="border-b border-gray-300 pb-1">Mcmarsh Dzwimbu</div>
                <p class="text-xs text-gray-500">Print Name</p>
                <div class="border-b border-gray-300 pb-1">Chief Operating Officer</div>
                <p class="text-xs text-gray-500">Title</p>
                <div class="border-b border-gray-300 pb-1">{{SERVICE_PROVIDER}}</div>
                <p class="text-xs text-gray-500">Company</p>
                <div class="border-b border-gray-300 pb-1">{{EFFECTIVE_DATE}}</div>
                <p class="text-xs text-gray-500">Date</p>
              </div>
            </div>

            <div>
              <p class="text-sm text-gray-600 mb-4">
                <strong>Client:</strong>
              </p>
              <div class="space-y-3">
                <div class="border-b border-gray-300 pb-1">______________________________</div>
                <p class="text-xs text-gray-500">Signature</p>
                <div class="border-b border-gray-300 pb-1">______________________________</div>
                <p class="text-xs text-gray-500">Print Name</p>
                <div class="border-b border-gray-300 pb-1">______________________________</div>
                <p class="text-xs text-gray-500">Title</p>
                <div class="border-b border-gray-300 pb-1">{{CLIENT_COMPANY}}</div>
                <p class="text-xs text-gray-500">Company</p>
                <div class="border-b border-gray-300 pb-1">___________</div>
                <p class="text-xs text-gray-500">Date</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

// Helper function to get template by ID
export function getSLATemplateHTML(id: string): SLATemplateHTML | undefined {
  return slaTemplateHTMLs.find(template => template.id === id);
}

// Helper function to get templates by category
export function getSLATemplatesByCategory(category: 'standard' | 'enterprise' | 'specialized'): SLATemplateHTML[] {
  return slaTemplateHTMLs.filter(template => template.category === category);
}

// Helper function to render template with variables
export function renderSLATemplate(template: SLATemplateHTML, variables: Record<string, string>): string {
  let renderedContent = template.htmlContent;

  // Replace all variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key.toUpperCase()}}}`;
    renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), value);
  });

  return renderedContent;
}