-- Service Level Agreement (SLA) System Schema
-- Migration: 20240930_create_service_agreements_schema.sql

-- Create enum types for SLA management
CREATE TYPE sla_status AS ENUM ('draft', 'generated', 'sent', 'accepted', 'rejected', 'expired');
CREATE TYPE sla_template_type AS ENUM ('standard', 'enterprise', 'custom');
CREATE TYPE performance_metric_type AS ENUM ('uptime', 'response_time', 'resolution_time', 'availability');
CREATE TYPE compliance_framework AS ENUM ('iso_27001', 'gdpr', 'sox', 'pci_dss', 'custom');

-- SLA Templates table - stores reusable SLA templates
CREATE TABLE sla_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type sla_template_type NOT NULL DEFAULT 'standard',
  industry TEXT NOT NULL DEFAULT 'software_development',
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Template content with placeholders
  template_content JSONB NOT NULL DEFAULT '{}',
  template_variables JSONB NOT NULL DEFAULT '{}',

  -- Performance metrics defaults
  default_uptime_percentage DECIMAL(5,2) NOT NULL DEFAULT 99.50,
  default_response_time_hours INTEGER NOT NULL DEFAULT 24,
  default_resolution_time_hours INTEGER NOT NULL DEFAULT 72,

  -- Compliance and legal
  compliance_frameworks compliance_framework[] DEFAULT '{}',
  legal_jurisdiction TEXT NOT NULL DEFAULT 'South Africa',
  governing_law TEXT NOT NULL DEFAULT 'South African Law',

  -- Metadata
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA Clauses Library - reusable clauses for building templates
CREATE TABLE sla_clause_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clause_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'software_development',
  compliance_framework compliance_framework,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Variables that can be customized in this clause
  customizable_variables JSONB NOT NULL DEFAULT '{}',

  -- Metadata
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Agreements table - generated SLAs for specific quotes
CREATE TABLE service_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_number TEXT NOT NULL UNIQUE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- SLA Template reference
  sla_template_id UUID REFERENCES sla_templates(id) ON DELETE SET NULL,

  -- Agreement content
  agreement_content JSONB NOT NULL DEFAULT '{}',
  agreement_variables JSONB NOT NULL DEFAULT '{}',

  -- Performance metrics for this specific agreement
  uptime_guarantee DECIMAL(5,2) NOT NULL DEFAULT 99.50,
  response_time_hours INTEGER NOT NULL DEFAULT 24,
  resolution_time_hours INTEGER NOT NULL DEFAULT 72,

  -- Financial terms
  penalty_percentage DECIMAL(5,2) DEFAULT 0.00,
  penalty_cap_percentage DECIMAL(5,2) DEFAULT 10.00,

  -- Status and workflow
  status sla_status NOT NULL DEFAULT 'draft',
  generated_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at DATE,

  -- E-signature tracking
  requires_signature BOOLEAN NOT NULL DEFAULT true,
  signature_status TEXT DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_ip_address INET,
  signature_data JSONB DEFAULT '{}',

  -- Audit trail
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA Performance Tracking - track actual performance against guarantees
CREATE TABLE sla_performance_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_agreement_id UUID NOT NULL REFERENCES service_agreements(id) ON DELETE CASCADE,
  metric_type performance_metric_type NOT NULL,
  metric_date DATE NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  actual_value DECIMAL(10,2) NOT NULL,
  measurement_unit TEXT NOT NULL,
  is_breach BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,

  -- Metadata
  recorded_by_user_id UUID NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SLA Breach Incidents - track SLA violations and penalties
CREATE TABLE sla_breach_incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_agreement_id UUID NOT NULL REFERENCES service_agreements(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  metric_type performance_metric_type NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  impact_assessment TEXT,

  -- Financial impact
  penalty_amount DECIMAL(10,2) DEFAULT 0.00,
  compensation_offered DECIMAL(10,2) DEFAULT 0.00,

  -- Resolution
  resolution_status TEXT NOT NULL DEFAULT 'open',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID,

  -- Metadata
  reported_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sla_templates_industry ON sla_templates(industry);
CREATE INDEX idx_sla_templates_active ON sla_templates(is_active);
CREATE INDEX idx_sla_clause_library_category ON sla_clause_library(category);
CREATE INDEX idx_sla_clause_library_industry ON sla_clause_library(industry);
CREATE INDEX idx_service_agreements_quote_id ON service_agreements(quote_id);
CREATE INDEX idx_service_agreements_client_id ON service_agreements(client_id);
CREATE INDEX idx_service_agreements_status ON service_agreements(status);
CREATE INDEX idx_service_agreements_expires_at ON service_agreements(expires_at);
CREATE INDEX idx_sla_performance_tracking_agreement_id ON sla_performance_tracking(service_agreement_id);
CREATE INDEX idx_sla_performance_tracking_date ON sla_performance_tracking(metric_date);
CREATE INDEX idx_sla_breach_incidents_agreement_id ON sla_breach_incidents(service_agreement_id);
CREATE INDEX idx_sla_breach_incidents_date ON sla_breach_incidents(incident_date);

-- Row Level Security (RLS)
ALTER TABLE sla_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_clause_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_breach_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic policies - should be refined based on user roles)
CREATE POLICY "Users can view SLA templates" ON sla_templates FOR SELECT USING (true);
CREATE POLICY "Users can manage SLA templates" ON sla_templates FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view clause library" ON sla_clause_library FOR SELECT USING (true);
CREATE POLICY "Users can manage clause library" ON sla_clause_library FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their service agreements" ON service_agreements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage their service agreements" ON service_agreements FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view performance tracking" ON sla_performance_tracking FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage performance tracking" ON sla_performance_tracking FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view breach incidents" ON sla_breach_incidents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can manage breach incidents" ON sla_breach_incidents FOR ALL USING (auth.uid() IS NOT NULL);

-- Functions for auto-numbering and calculations
CREATE OR REPLACE FUNCTION generate_agreement_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get next number from company settings or use default sequence
  SELECT COALESCE(next_agreement_number, 1) INTO next_number
  FROM company_settings
  ORDER BY created_at DESC
  LIMIT 1;

  -- Format as SLA-{year}-{number}
  formatted_number := 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(next_number::TEXT, 4, '0');

  -- Update the counter
  UPDATE company_settings
  SET next_agreement_number = next_number + 1
  WHERE id = (SELECT id FROM company_settings ORDER BY created_at DESC LIMIT 1);

  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate agreement numbers
CREATE OR REPLACE FUNCTION set_agreement_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agreement_number IS NULL OR NEW.agreement_number = '' THEN
    NEW.agreement_number := generate_agreement_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_agreement_number
  BEFORE INSERT ON service_agreements
  FOR EACH ROW
  EXECUTE FUNCTION set_agreement_number();

-- Function to calculate SLA breach penalties
CREATE OR REPLACE FUNCTION calculate_sla_penalty(
  p_agreement_id UUID,
  p_breach_type performance_metric_type,
  p_breach_severity DECIMAL DEFAULT 1.0
) RETURNS DECIMAL AS $$
DECLARE
  v_penalty_percentage DECIMAL(5,2);
  v_penalty_cap DECIMAL(5,2);
  v_monthly_revenue DECIMAL(10,2);
  v_calculated_penalty DECIMAL(10,2);
BEGIN
  -- Get penalty terms from agreement
  SELECT sa.penalty_percentage, sa.penalty_cap_percentage
  INTO v_penalty_percentage, v_penalty_cap
  FROM service_agreements sa
  WHERE sa.id = p_agreement_id;

  -- Calculate monthly revenue (this would need to be stored or calculated)
  -- For now, using a placeholder calculation
  v_monthly_revenue := 10000.00; -- This should be calculated from actual contract value

  -- Calculate penalty
  v_calculated_penalty := (v_monthly_revenue * v_penalty_percentage / 100) * p_breach_severity;

  -- Apply cap
  IF v_calculated_penalty > (v_monthly_revenue * v_penalty_cap / 100) THEN
    v_calculated_penalty := (v_monthly_revenue * v_penalty_cap / 100);
  END IF;

  RETURN v_calculated_penalty;
END;
$$ LANGUAGE plpgsql;

-- Insert default SLA template
INSERT INTO sla_templates (name, description, template_type, industry, created_by_user_id, template_content) VALUES
('Standard Software Development SLA', 'Default SLA template for software development projects', 'standard', 'software_development',
 (SELECT id FROM auth.users LIMIT 1), -- This should be replaced with actual user ID in production
'{
  "sections": {
    "service_description": "Comprehensive software development services including design, development, testing, and deployment of custom applications.",
    "performance_metrics": {
      "uptime": "99.5%",
      "response_time": "24 hours",
      "resolution_time": "72 hours"
    },
    "support_terms": "Business hours support with 24/7 emergency contact for critical issues.",
    "penalty_terms": "0.5% monthly penalty for SLA breaches, capped at 10% of monthly service fees.",
    "termination": "30 days written notice required for termination without cause."
  }
}'::JSONB);

-- Insert common SLA clauses
INSERT INTO sla_clause_library (clause_key, title, content, category, industry, is_mandatory, created_by_user_id) VALUES
('service_scope', 'Service Scope Definition', 'The Service Provider agrees to provide software development services as specified in the attached specification document and quote. All work will be performed in accordance with industry best practices and the agreed technical specifications.', 'service_delivery', 'software_development', true, (SELECT id FROM auth.users LIMIT 1)),
('payment_terms', 'Payment Terms Integration', 'Payment terms for services shall follow the agreed quote structure with {{deposit_percentage}}% deposit due upon project initiation and remaining {{balance_percentage}}% due upon completion and delivery.', 'financial', 'software_development', true, (SELECT id FROM auth.users LIMIT 1)),
('ip_transfer', 'Intellectual Property Rights', 'Upon full payment, all custom development work and intellectual property rights shall transfer to the Client, subject to the Service Provider retaining rights to reusable code components and development methodologies.', 'legal', 'software_development', true, (SELECT id FROM auth.users LIMIT 1)),
('force_majeure', 'Force Majeure Protection', 'The Service Provider shall be indemnified from liability for service interruptions caused by circumstances beyond their control, including but not limited to third-party infrastructure failures, cyber attacks, and natural disasters.', 'liability', 'software_development', false, (SELECT id FROM auth.users LIMIT 1)),
('support_warranty', 'Support and Warranty Period', 'A {{warranty_months}} month support and warranty period is included, covering technical maintenance and bug fixes for issues discovered post-deployment.', 'support', 'software_development', true, (SELECT id FROM auth.users LIMIT 1));

-- Add agreement_number column to company_settings if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'company_settings' AND column_name = 'next_agreement_number') THEN
    ALTER TABLE company_settings ADD COLUMN next_agreement_number INTEGER NOT NULL DEFAULT 1;
  END IF;
END $$;