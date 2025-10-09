-- SLA Creation following Invoice Pattern
-- Migration: 20250105_sla_invoice_pattern.sql
-- This implements SLA creation exactly like invoice creation from quotes

-- Add missing columns to service_agreements table
ALTER TABLE service_agreements
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_trigger TEXT,
ADD COLUMN IF NOT EXISTS generation_error TEXT;

-- Create function to auto-generate SLA when quote status changes to 'Accepted'
CREATE OR REPLACE FUNCTION generate_sla_on_quote_accept()
RETURNS TRIGGER AS $$
DECLARE
    v_sla_id UUID;
    v_next_sla_number TEXT;
    v_user_id UUID;
    v_has_existing_sla BOOLEAN;
BEGIN
    -- Only proceed if status is changing to 'Accepted'
    IF NEW.status != 'Accepted' OR OLD.status = 'Accepted' THEN
        RETURN NEW;
    END IF;

    -- Check if quote already has an SLA generated
    SELECT EXISTS (
        SELECT 1 FROM service_agreements
        WHERE quote_id = NEW.id
    ) INTO v_has_existing_sla;

    -- Skip if SLA already exists
    IF v_has_existing_sla THEN
        RETURN NEW;
    END IF;

    -- Get user info from quote
    SELECT created_by_user_id INTO v_user_id
    FROM quotes
    WHERE id = NEW.id;

    -- Get next SLA number (SLA-YYYY-XXXX format)
    -- For now, use a simple counter - in production this should use company_settings
    SELECT 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(agreement_number FROM '\d+$') AS INTEGER)), 0) + 1::TEXT, 4, '0')
    INTO v_next_sla_number
    FROM service_agreements
    WHERE agreement_number LIKE 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-%';

    -- Generate the SLA using the provided PDF template variables
    INSERT INTO service_agreements (
        agreement_number,
        quote_id,
        client_id,
        sla_template_id,
        agreement_content,
        agreement_variables,
        uptime_guarantee,
        response_time_hours,
        resolution_time_hours,
        penalty_percentage,
        penalty_cap_percentage,
        status,
        requires_signature,
        signature_status,
        created_by_user_id,
        generated_at,
        expires_at,
        auto_generated,
        automation_trigger,
        created_at,
        updated_at
    )
    SELECT
        COALESCE(v_next_sla_number, 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-0001'),
        NEW.id,
        NEW.client_id,
        st.id, -- Use default SLA template
        jsonb_build_object(
            'title', 'Service Level Agreement',
            'effective_date', CURRENT_DATE,
            'service_provider', 'INNOVATION IMPERIAL',
            'client_name', c.name,
            'client_company', c.company,
            'project_value', NEW.total_incl_vat,
            'deposit_percentage', NEW.deposit_percentage,
            'warranty_months', 3,
            'response_time_hours', 24,
            'resolution_time_hours', 72
        ),
        jsonb_build_object(
            'effective_date', CURRENT_DATE,
            'service_provider', 'INNOVATION IMPERIAL',
            'client_name', c.name,
            'client_company', c.company,
            'client_email', c.email,
            'total_contract_value', NEW.total_incl_vat,
            'deposit_percentage', NEW.deposit_percentage,
            'deposit_amount', NEW.deposit_amount,
            'balance_amount', NEW.balance_remaining,
            'warranty_months', 3,
            'response_time_hours', 24,
            'resolution_time_hours', 72,
            'governing_law', 'South African Law',
            'jurisdiction', 'South Africa'
        ),
        99.5, -- uptime_guarantee
        24,   -- response_time_hours
        72,   -- resolution_time_hours
        0.5,  -- penalty_percentage
        10.0, -- penalty_cap_percentage
        'generated', -- status
        true, -- requires_signature
        'pending', -- signature_status
        COALESCE(v_user_id, '550e8400-e29b-41d4-a716-446655440000'), -- created_by_user_id
        CURRENT_TIMESTAMP, -- generated_at
        (CURRENT_DATE + INTERVAL '30 days')::DATE, -- expires_at
        true, -- auto_generated
        'quote_status_change', -- automation_trigger
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM clients c
    CROSS JOIN LATERAL (
        SELECT id FROM sla_templates
        WHERE industry = 'software_development' AND is_active = true
        ORDER BY created_at ASC
        LIMIT 1
    ) st
    WHERE c.id = NEW.client_id
    RETURNING id INTO v_sla_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quote status changes
DROP TRIGGER IF EXISTS trigger_generate_sla_on_accept ON quotes;
CREATE TRIGGER trigger_generate_sla_on_accept
    AFTER UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION generate_sla_on_quote_accept();

-- Create RPC function for manual SLA generation from quote (following invoice pattern)
CREATE OR REPLACE FUNCTION convert_quote_to_sla(p_quote_id UUID)
RETURNS TABLE(sla_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
    v_sla_id UUID;
    v_next_sla_number TEXT;
    v_user_id UUID;
    v_quote_status TEXT;
    v_has_existing_sla BOOLEAN;
    v_client_data RECORD;
BEGIN
    -- Check if quote exists and get its status
    SELECT q.status, q.created_by_user_id, c.name, c.company, c.email
    INTO v_quote_status, v_user_id, v_client_data.name, v_client_data.company, v_client_data.email
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.id = p_quote_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Quote not found';
        RETURN;
    END IF;

    -- Check if quote is in accepted status (lowercase to match enum)
    IF v_quote_status != 'accepted' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Quote must be in accepted status to convert to SLA';
        RETURN;
    END IF;

    -- Check if SLA already exists
    SELECT EXISTS (
        SELECT 1 FROM service_agreements
        WHERE quote_id = p_quote_id
    ) INTO v_has_existing_sla;

    IF v_has_existing_sla THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'SLA already exists for this quote';
        RETURN;
    END IF;

    -- Get next SLA number
    SELECT 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(agreement_number FROM '\d+$') AS INTEGER)), 0) + 1::TEXT, 4, '0')
    INTO v_next_sla_number
    FROM service_agreements
    WHERE agreement_number LIKE 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-%';

    -- Get default SLA template
    SELECT id INTO v_sla_id FROM sla_templates
    WHERE industry = 'software_development' AND is_active = true
    ORDER BY created_at ASC LIMIT 1;

    IF v_sla_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'No active SLA template found for software development';
        RETURN;
    END IF;

    -- Generate the SLA using the provided PDF template variables
    INSERT INTO service_agreements (
        agreement_number,
        quote_id,
        client_id,
        sla_template_id,
        agreement_content,
        agreement_variables,
        uptime_guarantee,
        response_time_hours,
        resolution_time_hours,
        penalty_percentage,
        penalty_cap_percentage,
        status,
        requires_signature,
        signature_status,
        created_by_user_id,
        generated_at,
        expires_at,
        auto_generated,
        automation_trigger,
        created_at,
        updated_at
    )
    SELECT
        COALESCE(v_next_sla_number, 'SLA-' || EXTRACT(YEAR FROM NOW())::TEXT || '-0001'),
        p_quote_id,
        client_id,
        v_sla_id,
        jsonb_build_object(
            'title', 'Service Level Agreement',
            'effective_date', CURRENT_DATE,
            'service_provider', 'INNOVATION IMPERIAL',
            'client_name', v_client_data.name,
            'client_company', v_client_data.company,
            'project_value', total_incl_vat,
            'deposit_percentage', deposit_percentage,
            'warranty_months', 3,
            'response_time_hours', 24,
            'resolution_time_hours', 72
        ),
        jsonb_build_object(
            'effective_date', CURRENT_DATE,
            'service_provider', 'INNOVATION IMPERIAL',
            'client_name', v_client_data.name,
            'client_company', v_client_data.company,
            'client_email', v_client_data.email,
            'total_contract_value', total_incl_vat,
            'deposit_percentage', deposit_percentage,
            'deposit_amount', deposit_amount,
            'balance_amount', balance_remaining,
            'warranty_months', 3,
            'response_time_hours', 24,
            'resolution_time_hours', 72,
            'governing_law', 'South African Law',
            'jurisdiction', 'South Africa'
        ),
        99.5, -- uptime_guarantee
        24,   -- response_time_hours
        72,   -- resolution_time_hours
        0.5,  -- penalty_percentage
        10.0, -- penalty_cap_percentage
        'generated', -- status
        true, -- requires_signature
        'pending', -- signature_status
        COALESCE(v_user_id, '550e8400-e29b-41d4-a716-446655440000'), -- created_by_user_id
        CURRENT_TIMESTAMP, -- generated_at
        (CURRENT_DATE + INTERVAL '30 days')::DATE, -- expires_at
        false, -- auto_generated (manual creation)
        'manual_conversion', -- automation_trigger
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM quotes
    WHERE id = p_quote_id
    RETURNING id INTO v_sla_id;

    -- Check if SLA was created successfully
    IF v_sla_id IS NOT NULL THEN
        RETURN QUERY SELECT v_sla_id, TRUE, 'SLA generated successfully';
    ELSE
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Failed to generate SLA';
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON FUNCTION generate_sla_on_quote_accept() IS 'Automatically generates SLA when quote status changes to Accepted (following invoice pattern)';
COMMENT ON FUNCTION convert_quote_to_sla(UUID) IS 'Manually generates SLA from quote (following convert_quote_to_invoice pattern)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_service_agreements_quote_id_auto ON service_agreements(quote_id, auto_generated);

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'SLA Invoice Pattern Migration Applied Successfully';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - generate_sla_on_quote_accept() - Auto-generates SLA on quote acceptance';
    RAISE NOTICE '  - convert_quote_to_sla() - Manual SLA generation from quote';
    RAISE NOTICE 'Trigger created: trigger_generate_sla_on_accept';
END $$;