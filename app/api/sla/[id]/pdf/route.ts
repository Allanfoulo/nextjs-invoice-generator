import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs"
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const slaId = id

    // Fetch service agreement with related data
    const { data: serviceAgreement, error: slaError } = await supabase
      .from('service_agreements')
      .select(`
        *,
        client:clients(*),
        company_settings(*),
        created_by_user:users(*),
        quote:quotes(*)
      `)
      .eq('id', slaId)
      .single()

    if (slaError || !serviceAgreement) {
      return NextResponse.json(
        { error: 'Service Agreement not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to access this SLA
    if (serviceAgreement.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Generate HTML for the SLA
    const htmlContent = generateSLAHTML(serviceAgreement)

    // Return HTML as response for client-side PDF generation
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'X-PDF-Filename': `sla-${serviceAgreement.agreement_number}.pdf`,
      },
    })

  } catch (error) {
    console.error('Error generating SLA PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateSLAHTML(serviceAgreement: {
  id: string
  agreement_number: string
  quote_id: string
  client_id: string
  status: string
  uptime_guarantee: number
  response_time_hours: number
  resolution_time_hours: number
  penalty_percentage: number
  penalty_cap_percentage: number
  generated_at?: string
  sent_at?: string
  accepted_at?: string
  auto_generated?: boolean
  automation_trigger?: string
  agreement_content: Record<string, any>
  agreement_variables: Record<string, any>
  client: {
    name: string
    company: string
    email: string
    phone: string
    billing_address?: string
    vat_number?: string
  }
  company_settings: {
    company_name: string
    address: string
    email: string
    phone: string
    currency?: string
    vat_percentage?: number
    terms_text?: string
  }
  quote: {
    quote_number: string
    date_issued: string
    valid_until: string
    total_incl_vat: number
    deposit_percentage?: number
    deposit_amount?: number
    balance_remaining?: number
  }
  created_by_user: {
    name: string
    email: string
  }
}): string {
  const client = serviceAgreement.client
  const company = serviceAgreement.company_settings
  const quote = serviceAgreement.quote

  // Extract variables for template
  const variables = {
    // Client Information
    client_name: client.name,
    client_company: client.company,
    client_email: client.email,
    client_address: client.billing_address || '',

    // Service Provider Information
    provider_company: company.company_name,
    provider_email: company.email,

    // Service Details
    service_description: serviceAgreement.agreement_content?.service_description || 'Custom software development services',
    project_scope: serviceAgreement.agreement_content?.project_scope || `Development project as per quote ${quote.quote_number}`,

    // Financial Terms
    total_contract_value: serviceAgreement.agreement_variables?.total_contract_value || quote.total_incl_vat,
    deposit_percentage: serviceAgreement.agreement_variables?.deposit_percentage || quote.deposit_percentage || 40,
    deposit_amount: serviceAgreement.agreement_variables?.deposit_amount || quote.deposit_amount || 0,
    balance_percentage: serviceAgreement.agreement_variables?.balance_percentage || (100 - (quote.deposit_percentage || 40)),
    balance_amount: serviceAgreement.agreement_variables?.balance_amount || quote.balance_remaining || 0,

    // Performance Metrics
    uptime_guarantee: serviceAgreement.uptime_guarantee,
    response_time_hours: serviceAgreement.response_time_hours,
    resolution_time_hours: serviceAgreement.resolution_time_hours,

    // Timeline
    project_start_date: serviceAgreement.agreement_variables?.project_start_date || new Date().toISOString().split('T')[0],
    warranty_months: serviceAgreement.agreement_variables?.warranty_months || 3,

    // Legal Terms
    governing_law: serviceAgreement.agreement_variables?.governing_law || 'South African Law',
    jurisdiction: serviceAgreement.agreement_variables?.jurisdiction || 'South Africa',

    // Template-specific variables
    effectiveDate: serviceAgreement.agreement_variables?.effective_date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/'),
    serviceProvider: company.company_name,
    timelineDays: serviceAgreement.agreement_variables?.project_timeline_days || 3,
    supportMonths: serviceAgreement.agreement_variables?.warranty_months || 3,
    serviceProviderName: 'Mcmarsh Dzwimbu',
    serviceProviderTitle: 'Chief Operating Officer'
  }

  const formatCurrency = (amount: number) => {
    // Use consistent formatting to avoid hydration issues
    const value = Number(amount || 0).toFixed(2)
    const parts = value.split('.')
    const integerPart = Number(parts[0]).toLocaleString('en-US')

    if (company.currency === 'ZAR') {
      return `R ${integerPart}.${parts[1].padEnd(2, '0')}`
    } else if (company.currency === 'USD') {
      return `$${integerPart}.${parts[1].padEnd(2, '0')}`
    } else if (company.currency === 'EUR') {
      return `€${integerPart.replace(/\./g, '')},${parts[1].padEnd(2, '0')}`
    } else {
      return `${company.currency || 'USD'} ${integerPart}.${parts[1].padEnd(2, '0')}`
    }
  }

  const formatDate = (dateString: string) => {
    // Use consistent date formatting to avoid hydration issues
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.toLocaleDateString('en-US', { month: 'long' })
    const day = date.getDate()

    return `${month} ${day}, ${year}`
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Service Level Agreement - ${serviceAgreement.agreement_number}</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
          margin: 0;
          padding: 40px 20px;
          background-color: #fff;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 0 0 20px 0;
          text-decoration: underline;
        }
        .header p {
          margin: 5px 0;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          font-size: 14pt;
          font-weight: bold;
          margin: 0 0 15px 0;
          text-decoration: underline;
        }
        .section h3 {
          font-size: 12pt;
          font-weight: bold;
          margin: 15px 0 10px 0;
        }
        .section p {
          margin: 0 0 10px 0;
          text-align: justify;
        }
        .section ul {
          margin: 0 0 10px 20px;
          padding-left: 20px;
        }
        .section li {
          margin-bottom: 5px;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 40px;
        }
        .signature-block {
          border: 1px solid #000;
          padding: 20px;
          text-align: center;
        }
        .signature-line {
          border-bottom: 1px solid #000;
          margin: 20px 0;
          height: 30px;
        }
        .performance-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        .metric {
          text-align: center;
          padding: 15px;
          background-color: #fff;
          border-radius: 6px;
          border: 1px solid #ddd;
        }
        .metric-value {
          font-size: 24pt;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 5px;
        }
        .metric-label {
          font-size: 10pt;
          color: #666;
        }
        .financial-summary {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .financial-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .financial-row.total {
          border-top: 2px solid #000;
          padding-top: 15px;
          font-weight: bold;
        }
        @media print {
          body { padding: 20px; }
          .container { max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="container">

        <!-- Header -->
        <div class="header">
          <h1>Service Terms of Agreement</h1>
          <p><strong>Effective Date:</strong> ${variables.effectiveDate}</p>
          <p><strong>Service Provider:</strong> ${variables.serviceProvider}</p>
          <p><strong>Client:</strong> ${variables.clientCompany}</p>
          <p><strong>Agreement Number:</strong> ${serviceAgreement.agreement_number}</p>
        </div>

        <!-- Performance Summary -->
        <div class="performance-summary">
          <div class="metric">
            <div class="metric-value">${variables.uptime_guarantee}%</div>
            <div class="metric-label">Uptime Guarantee</div>
          </div>
          <div class="metric">
            <div class="metric-value">${variables.response_time_hours}h</div>
            <div class="metric-label">Response Time</div>
          </div>
          <div class="metric">
            <div class="metric-value">${variables.resolution_time_hours}h</div>
            <div class="metric-label">Resolution Time</div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="financial-summary">
          <h3 style="margin-bottom: 15px;">Financial Terms</h3>
          <div class="financial-row">
            <span>Total Contract Value:</span>
            <span><strong>${formatCurrency(variables.total_contract_value)}</strong></span>
          </div>
          <div class="financial-row">
            <span>Deposit (${variables.deposit_percentage}%):</span>
            <span>${formatCurrency(variables.deposit_amount)}</span>
          </div>
          <div class="financial-row">
            <span>Balance (${variables.balance_percentage}%):</span>
            <span>${formatCurrency(variables.balance_amount)}</span>
          </div>
        </div>

        <!-- Section 1: Project Scope and Specifications -->
        <div class="section">
          <h2>1. Project Scope and Specifications</h2>

          <h3>1.1 Specification Document Requirement</h3>
          <p>
            Prior to project commencement, the Client (${variables.client_name}) must provide a
            comprehensive specification document (the "Spec Sheet") that details all requirements, features,
            functionalities, and design elements for the online store development project.
          </p>

          <h3>1.2 Scope Definition</h3>
          <p>
            All work will be performed strictly in accordance with the approved Spec Sheet. The Spec Sheet
            will serve as the definitive guide for project deliverables and will be considered the complete
            scope of work for this agreement.
          </p>

          <h3>1.3 Specification Review</h3>
          <p>
            Upon receipt of the Spec Sheet, the Service Provider (${variables.serviceProvider}) will review
            the document and may request clarifications or modifications to ensure technical feasibility and
            clear understanding of requirements.
          </p>
        </div>

        <!-- Section 2: Payment Terms -->
        <div class="section">
          <h2>2. Payment Terms</h2>

          <h3>2.1 Deposit Payment</h3>
          <p>
            Upon approval of the Spec Sheet, the Client will be invoiced for a deposit of ${variables.deposit_percentage}%
            of the total project cost. This deposit covers the procurement of necessary tooling, software
            licenses, development resources, and project initiation costs. This will also serve as commitment
            from the client(${variables.client_name})
          </p>

          <h3>2.2 Deposit Due Date</h3>
          <p>
            The ${variables.deposit_percentage}% deposit must be paid within ${variables.timelineDays} business days of invoice receipt. Project work will
            commence only after deposit payment is confirmed.
          </p>

          <h3>2.3 Final Payment</h3>
          <p>
            The remaining ${variables.balance_percentage}% balance is due upon completion and delivery of all
            requirements specified in the approved Spec Sheet. Final payment must be made within ${variables.timelineDays}
            business days of project completion notification.
          </p>
        </div>

        <!-- Section 3: Change Management and Additional Work -->
        <div class="section">
          <h2>3. Change Management and Additional Work</h2>

          <h3>3.1 Scope Adherence</h3>
          <p>
            All development work will be limited to the requirements explicitly outlined in the approved
            Spec Sheet. Any requests for modifications, additions, or enhancements not included in the
            original specification will be considered out-of-scope.
          </p>

          <h3>3.2 Change Requests</h3>
          <p>
            Any work requested outside the scope of the approved Spec Sheet will be classified as a "Change
            Request" or "Feature Request" and will require separate authorization and payment.
          </p>

          <h3>3.3 Additional Work Pricing</h3>
          <p>
            Change Requests will be charged as a percentage of the original project cost, determined by:
          </p>
          <ul>
            <li>• Task complexity and integration requirements</li>
            <li>• Development time and resources needed</li>
            <li>• Impact on existing functionality</li>
            <li>• Technical difficulty of implementation</li>
          </ul>

          <h3>3.4 Change Request Process</h3>
          <p>
            All Change Requests must be:
          </p>
          <ul>
            <li>• Submitted in writing by the Client (${variables.client_name})</li>
            <li>• Reviewed and quoted by the Service Provider (${variables.serviceProvider})</li>
            <li>• Approved and paid for before work commences</li>
            <li>• Documented with clear specifications and acceptance criteria</li>
          </ul>
        </div>

        <!-- Section 4: Project Delivery and Completion -->
        <div class="section">
          <h2>4. Project Delivery and Completion</h2>

          <h3>4.1 Completion Criteria</h3>
          <p>
            The project will be considered complete when all requirements listed in the approved Spec Sheet
            have been implemented, tested, and delivered to the Client's satisfaction.
          </p>

          <h3>4.2 Delivery Method</h3>
          <p>
            Upon completion, the Service Provider will provide the Client with access to the completed
            online store system and any relevant documentation, credentials, or transfer materials as
            specified in the Spec Sheet.
          </p>

          <h3>4.3 Acceptance Period</h3>
          <p>
            The Client (${variables.client_name}) will have ${variables.timelineDays} business days from delivery
            notification to review the completed work and confirm acceptance based on the Spec Sheet
            requirements.
          </p>
        </div>

        <!-- Section 5: General Terms -->
        <div class="section">
          <h2>5. General Terms</h2>

          <h3>5.1 Timeline</h3>
          <p>
            Project timeline will be established upon approval of the Spec Sheet and confirmation of deposit
            payment. Timelines may be adjusted based on Client feedback response times and Change
            Request implementations.
          </p>

          <h3>5.2 Communication</h3>
          <p>
            Regular project updates will be provided to the Client. All project communications, approvals,
            and Change Requests must be documented in writing.
          </p>

          <h3>5.3 Intellectual Property</h3>
          <p>
            Upon final payment, all custom development work specific to the Client's online store will be
            transferred to the Client and the software and application will be 100% owned by the client as
            their intellectual property. Third-party tools, licenses, and frameworks remain subject to their
            respective terms.
          </p>

          <h3>5.4 Support and Warranty</h3>
          <p>
            ${variables.supportMonths} months of support will be given to the client (${variables.client_name}) free of
            charge for any technical maintenance (e.g downtime ) and after the ${variables.supportMonths} months lapse the client
            (${variables.client_name}) will be charged for maintenance depending on the
            complexity of the maintenance query.
          </p>

          <h3>5.5 Force Majeure and Service Provider Indemnification</h3>
          <p>
            Innovation Imperial shall be indemnified and held harmless from any liability, damages, or
            service interruptions caused by circumstances beyond the control of the custom software
            development, including but not limited to:
          </p>
          <ul>
            <li>• Natural disasters (earthquakes, floods, fires, storms, etc.)</li>
            <li>• Hosting platform failures or outages</li>
            <li>• Database platform failures or service interruptions</li>
            <li>• Third-party service provider failures</li>
            <li>• Internet service provider outages</li>
            <li>• Power grid failures or electrical outages</li>
            <li>• Cyber attacks on infrastructure providers</li>
            <li>• Government regulations or actions affecting third-party services</li>
            <li>• Any other technical circumstances beyond the scope of the custom software delivered</li>
          </ul>

          <p>
            The Service Provider's responsibility is limited to the custom software functionality as specified
            in the Spec Sheet. Infrastructure failures, third-party service disruptions, and force majeure
            events are outside the Service Provider's control and liability. ${variables.client_name} acknowledges that such events may cause temporary service interruptions and
            agrees to hold Innovation Imperial harmless for any resulting business losses or damages.
          </p>
        </div>

        <!-- Section 6: Agreement Acceptance -->
        <div class="section">
          <h2>6. Agreement Acceptance</h2>

          <p>
            By signing below, both parties acknowledge they have read, understood, and agree to be bound
            by these terms and conditions.
          </p>

          <!-- Signature blocks -->
          <div class="signatures">
            <!-- Service Provider Signature -->
            <div class="signature-block">
              <p style="margin: 0 0 20px 0; font-weight: bold;">Service Provider:</p>
              <div class="signature-line">_____________________</div>
              <p style="margin: 5px 0;">Signature/ initials</p>
              <div class="signature-line">____${variables.effectiveDate}_______</div>
              <p style="margin: 5px 0;">Date</p>
              <p style="margin: 10px 0 5px 0;"><strong>${variables.serviceProviderName}</strong></p>
              <p style="margin: 5px 0;">${variables.serviceProviderTitle}</p>
              <p style="margin: 5px 0;">${variables.serviceProvider}</p>
            </div>

            <!-- Client Signature -->
            <div class="signature-block">
              <p style="margin: 0 0 20px 0; font-weight: bold;">Client:</p>
              <div class="signature-line">_________________________</div>
              <p style="margin: 5px 0;">Signature</p>
              <div class="signature-line">___________</div>
              <p style="margin: 5px 0;">Date</p>
              <p style="margin: 10px 0 5px 0;"><strong>${variables.client_name}</strong></p>
              <p style="margin: 5px 0;">Title</p>
              <p style="margin: 5px 0;">${variables.clientCompany}</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
          <p>Generated on ${formatDate(serviceAgreement.generated_at || new Date().toISOString())}</p>
          <p>Agreement Number: ${serviceAgreement.agreement_number}</p>
          ${serviceAgreement.auto_generated ? '<p style="color: #2563eb;">Auto-generated SLA</p>' : ''}
        </div>
      </div>
    </body>
    </html>
  `
}