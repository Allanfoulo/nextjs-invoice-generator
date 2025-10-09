// SLA PDF Template
// Exact replica of the megasol service agreement PDF with dynamic variables

import React from 'react';
import { SLATemplateVariables } from '@/lib/sla-types';

interface SLATemplateProps {
  variables: SLATemplateVariables;
}

export function SLATemplate({ variables }: SLATemplateProps) {
  // Default values from the provided PDF template
  const defaults = {
    effectiveDate: '09/09/2025',
    serviceProvider: 'INNOVATION IMPERIAL',
    clientName: 'MEGA INDUSTRIAL SOLUTIONS',
    clientCompany: 'MEGA INDUSTRIAL SOLUTIONS',
    depositPercentage: 40,
    timelineDays: 3,
    supportMonths: 3,
    serviceProviderName: 'Mcmarsh dzwimbu',
    serviceProviderTitle: 'chief operating officer',
    ...variables
  };

  return (
    <div style={{
      fontFamily: 'Times New Roman, serif',
      fontSize: '12pt',
      lineHeight: '1.5',
      color: '#000',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px'
    }}>
      {/* Header - Exact match to PDF */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '18pt',
          fontWeight: 'bold',
          margin: '0 0 20px 0',
          textDecoration: 'underline'
        }}>
          Service Terms of Agreement
        </h1>
        <p style={{ margin: '5px 0' }}>
          <strong>Effective Date:</strong> {defaults.effectiveDate}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Service Provider:</strong> {defaults.serviceProvider}
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Client:</strong> {defaults.clientCompany}
        </p>
      </div>

      {/* Section 1: Project Scope and Specifications */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          textDecoration: 'underline'
        }}>
          1. Project Scope and Specifications
        </h2>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          1.1 Specification Document Requirement
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Prior to project commencement, the Client ({defaults.clientName}) must provide a
          comprehensive specification document (the &quot;Spec Sheet&quot;) that details all requirements, features,
          functionalities, and design elements for the online store development project.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          1.2 Scope Definition
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          All work will be performed strictly in accordance with the approved Spec Sheet. The Spec Sheet
          will serve as the definitive guide for project deliverables and will be considered the complete
          scope of work for this agreement.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          1.3 Specification Review
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Upon receipt of the Spec Sheet, the Service Provider ({defaults.serviceProvider}) will review
          the document and may request clarifications or modifications to ensure technical feasibility and
          clear understanding of requirements.
        </p>
      </div>

      {/* Section 2: Payment Terms */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          textDecoration: 'underline'
        }}>
          2. Payment Terms
        </h2>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          2.1 Deposit Payment
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Upon approval of the Spec Sheet, the Client will be invoiced for a deposit of forty percent ({defaults.depositPercentage}%)
          of the total project cost. This deposit covers the procurement of necessary tooling, software
          licenses, development resources, and project initiation costs. This will also serve as commitment
          from the client({defaults.clientName})
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          2.2 Deposit Due Date
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          The {defaults.depositPercentage}% deposit must be paid within {defaults.timelineDays} business days of invoice receipt. Project work will
          commence only after deposit payment is confirmed.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          2.3 Final Payment
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          The remaining sixty percent (60%) balance is due upon completion and delivery of all
          requirements specified in the approved Spec Sheet. Final payment must be made within {defaults.timelineDays}
          business days of project completion notification.
        </p>
      </div>

      {/* Section 3: Change Management and Additional Work */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          textDecoration: 'underline'
        }}>
          3. Change Management and Additional Work
        </h2>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          3.1 Scope Adherence
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          All development work will be limited to the requirements explicitly outlined in the approved
          Spec Sheet. Any requests for modifications, additions, or enhancements not included in the
          original specification will be considered out-of-scope.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          3.2 Change Requests
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Any work requested outside the scope of the approved Spec Sheet will be classified as a &quot;Change
          Request&quot; or &quot;Feature Request&quot; and will require separate authorization and payment.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          3.3 Additional Work Pricing
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Change Requests will be charged as a percentage of the original project cost, determined by:
        </p>
        <ul style={{ margin: '0 0 10px 20px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '5px' }}>• Task complexity and integration requirements</li>
          <li style={{ marginBottom: '5px' }}>• Development time and resources needed</li>
          <li style={{ marginBottom: '5px' }}>• Impact on existing functionality</li>
          <li style={{ marginBottom: '5px' }}>• Technical difficulty of implementation</li>
        </ul>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          3.4 Change Request Process
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          All Change Requests must be:
        </p>
        <ul style={{ margin: '0 0 10px 20px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '5px' }}>• Submitted in writing by the Client ({defaults.clientName})</li>
          <li style={{ marginBottom: '5px' }}>• Reviewed and quoted by the Service Provider ({defaults.serviceProvider})</li>
          <li style={{ marginBottom: '5px' }}>• Approved and paid for before work commences</li>
          <li style={{ marginBottom: '5px' }}>• Documented with clear specifications and acceptance criteria</li>
        </ul>
      </div>

      {/* Section 4: Project Delivery and Completion */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          textDecoration: 'underline'
        }}>
          4. Project Delivery and Completion
        </h2>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          4.1 Completion Criteria
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          The project will be considered complete when all requirements listed in the approved Spec Sheet
          have been implemented, tested, and delivered to the Client&apos;s satisfaction.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          4.2 Delivery Method
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Upon completion, the Service Provider will provide the Client with access to the completed
          online store system and any relevant documentation, credentials, or transfer materials as
          specified in the Spec Sheet.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          4.3 Acceptance Period
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          The Client ({defaults.clientName}) will have {defaults.timelineDays} business days from delivery
          notification to review the completed work and confirm acceptance based on the Spec Sheet
          requirements.
        </p>
      </div>

      {/* Section 5: General Terms */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          textDecoration: 'underline'
        }}>
          5. General Terms
        </h2>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          5.1 Timeline
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Project timeline will be established upon approval of the Spec Sheet and confirmation of deposit
          payment. Timelines may be adjusted based on Client feedback response times and Change
          Request implementations.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          5.2 Communication
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Regular project updates will be provided to the Client. All project communications, approvals,
          and Change Requests must be documented in writing.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          5.3 Intellectual Property
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Upon final payment, all custom development work specific to the Client&apos;s online store will be
          transferred to the Client and the software and application will be 100% owned by the client as
          their intellectual property. Third-party tools, licenses, and frameworks remain subject to their
          respective terms.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          5.4 Support and Warranty
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          {defaults.supportMonths} months of support will be given to the client ({defaults.clientName}) free of
          charge for any technical maintenance (e.g downtime ) and after the {defaults.supportMonths} months lapse the client
          ({defaults.clientName}) will be charged for maintenance depending on the
          complexity of the maintenance query.
        </p>

        <h3 style={{
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: '15px 0 10px 0'
        }}>
          5.5 Force Majeure and Service Provider Indemnification
        </h3>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          Innovation Imperial shall be indemnified and held harmless from any liability, damages, or
          service interruptions caused by circumstances beyond the control of the custom software
          development, including but not limited to:
        </p>
        <ul style={{ margin: '0 0 10px 20px', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '5px' }}>• Natural disasters (earthquakes, floods, fires, storms, etc.)</li>
          <li style={{ marginBottom: '5px' }}>• Hosting platform failures or outages</li>
          <li style={{ marginBottom: '5px' }}>• Database platform failures or service interruptions</li>
          <li style={{ marginBottom: '5px' }}>• Third-party service provider failures</li>
          <li style={{ marginBottom: '5px' }}>• Internet service provider outages</li>
          <li style={{ marginBottom: '5px' }}>• Power grid failures or electrical outages</li>
          <li style={{ marginBottom: '5px' }}>• Cyber attacks on infrastructure providers</li>
          <li style={{ marginBottom: '5px' }}>• Government regulations or actions affecting third-party services</li>
          <li style={{ marginBottom: '5px' }}>• Any other technical circumstances beyond the scope of the custom software delivered</li>
        </ul>

        <p style={{ margin: '0 0 10px 0', textAlign: 'justify' }}>
          The Service Provider&apos;s responsibility is limited to the custom software functionality as specified
          in the Spec Sheet. Infrastructure failures, third-party service disruptions, and force majeure
          events are outside the Service Provider&apos;s control and liability. {defaults.clientName} acknowledges that such events may cause temporary service interruptions and
          agrees to hold Innovation Imperial harmless for any resulting business losses or damages.
        </p>
      </div>

      {/* Section 6: Agreement Acceptance */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '14pt',
          fontWeight: 'bold',
          margin: '0 0 15px 0',
          textDecoration: 'underline'
        }}>
          6. Agreement Acceptance
        </h2>

        <p style={{ margin: '0 0 20px 0', textAlign: 'justify' }}>
          By signing below, both parties acknowledge they have read, understood, and agree to be bound
          by these terms and conditions.
        </p>

        {/* Signature blocks */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginTop: '40px'
        }}>
          {/* Service Provider Signature */}
          <div style={{
            border: '1px solid #000',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 20px 0', fontWeight: 'bold' }}>Service Provider:</p>
            <div style={{
              borderBottom: '1px solid #000',
              margin: '20px 0',
              minHeight: '30px'
            }}>
              _______________________
            </div>
            <p style={{ margin: '5px 0' }}>Signature/ initials</p>
            <div style={{
              borderBottom: '1px solid #000',
              margin: '20px 0',
              minHeight: '30px'
            }}>
              ____{defaults.effectiveDate}_______
            </div>
            <p style={{ margin: '5px 0' }}>Date</p>
            <p style={{ margin: '10px 0 5px 0' }}><strong>{defaults.serviceProviderName}</strong></p>
            <p style={{ margin: '5px 0' }}>{defaults.serviceProviderTitle}</p>
            <p style={{ margin: '5px 0' }}>{defaults.serviceProvider}</p>
          </div>

          {/* Client Signature */}
          <div style={{
            border: '1px solid #000',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 20px 0', fontWeight: 'bold' }}>Client:</p>
            <div style={{
              borderBottom: '1px solid #000',
              margin: '20px 0',
              minHeight: '30px'
            }}>
              ___________________________
            </div>
            <p style={{ margin: '5px 0' }}>Signature</p>
            <div style={{
              borderBottom: '1px solid #000',
              margin: '20px 0',
              minHeight: '30px'
            }}>
              ___________
            </div>
            <p style={{ margin: '5px 0' }}>Date</p>
            <p style={{ margin: '10px 0 5px 0' }}><strong>{variables.client_name || '________________'}</strong></p>
            <p style={{ margin: '5px 0' }}>Title</p>
            <p style={{ margin: '5px 0' }}>{defaults.clientName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}