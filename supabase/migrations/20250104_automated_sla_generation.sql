-- Automated SLA Generation System
-- Migration: 20250104_automated_sla_generation.sql

-- Function to automatically generate SLA when quote status changes to 'accepted'
CREATE OR REPLACE FUNCTION trigger_sla_generation_on_quote_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    existing_sla_count INTEGER;
    new_sla_id UUID;
    sla_generation_result JSONB;
BEGIN
    -- Only trigger when status changes to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

        -- Check if SLA already exists for this quote
        SELECT COUNT(*) INTO existing_sla_count
        FROM service_agreements
        WHERE quote_id = NEW.id;

        -- Only generate if no SLA exists for this quote
        IF existing_sla_count = 0 THEN

            -- Generate SLA using the SLA service function
            -- We'll call a stored procedure that handles the SLA generation
            SELECT generate_sla_for_quote(NEW.id) INTO sla_generation_result;

            -- Log the generation attempt for debugging
            RAISE NOTICE 'SLA generation triggered for quote %: %', NEW.id, sla_generation_result;

        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate SLA for a specific quote
CREATE OR REPLACE FUNCTION generate_sla_for_quote(p_quote_id UUID)
RETURNS JSONB AS $$
DECLARE
    sla_request JSONB;
    generation_result JSONB;
    template_id UUID;
    default_template_id UUID;
BEGIN
    -- Get the default SLA template for software development
    SELECT id INTO default_template_id
    FROM sla_templates
    WHERE industry = 'software_development'
    AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    -- Prepare SLA generation request
    sla_request := jsonb_build_object(
        'quote_id', p_quote_id,
        'template_id', COALESCE(default_template_id, NULL),
        'performance_requirements', jsonb_build_object(
            'uptime', 99.5,
            'response_time', 24,
            'resolution_time', 72
        )
    );

    -- For now, we'll create a basic SLA record
    -- In a full implementation, this would call the actual SLA generation logic
    INSERT INTO service_agreements (
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
        generated_at
    )
    SELECT
        q.id,
        q.client_id,
        default_template_id,
        jsonb_build_object(
            'title', 'Service Level Agreement',
            'status', 'auto_generated'
        ),
        jsonb_build_object(
            'client_name', c.name,
            'client_company', c.company,
            'total_contract_value', q.total_incl_vat,
            'deposit_percentage', q.deposit_percentage
        ),
        99.5, -- uptime_guarantee
        24,   -- response_time_hours
        72,   -- resolution_time_hours
        0.5,  -- penalty_percentage
        10.0, -- penalty_cap_percentage
        'generated', -- status
        true, -- requires_signature
        'pending', -- signature_status
        COALESCE(q.created_by_user_id, '550e8400-e29b-41d4-a716-446655440000'), -- created_by_user_id
        NOW() -- generated_at
    FROM quotes q
    JOIN clients c ON q.client_id = c.id
    WHERE q.id = p_quote_id
    RETURNING id INTO new_sla_id;

    -- Return success result
    RETURN jsonb_build_object(
        'success', true,
        'sla_id', new_sla_id,
        'message', 'SLA generated successfully'
    );

EXCEPTION WHEN OTHERS THEN
    -- Return error result
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to generate SLA'
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger on quotes table
DROP TRIGGER IF EXISTS trigger_sla_generation_on_quotes ON quotes;
CREATE TRIGGER trigger_sla_generation_on_quotes
    AFTER UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sla_generation_on_quote_acceptance();

-- Add automation tracking columns to service_agreements table
ALTER TABLE service_agreements
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS automation_trigger TEXT,
ADD COLUMN IF NOT EXISTS generation_error TEXT;

-- Function to manually trigger SLA generation for existing accepted quotes
CREATE OR REPLACE FUNCTION generate_slas_for_existing_accepted_quotes()
RETURNS TABLE(
    quote_id UUID,
    sla_id UUID,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    quote_record RECORD;
    sla_result JSONB;
    result_sla_id UUID;
BEGIN
    -- Loop through all accepted quotes that don't have SLAs
    FOR quote_record IN
        SELECT q.id, q.quote_number
        FROM quotes q
        WHERE q.status = 'accepted'
        AND NOT EXISTS (
            SELECT 1 FROM service_agreements sa WHERE sa.quote_id = q.id
        )
    LOOP
        -- Generate SLA for this quote
        SELECT generate_sla_for_quote(quote_record.id) INTO sla_result;

        -- Extract SLA ID if successful
        IF sla_result->>'success' = 'true' THEN
            result_sla_id := (sla_result->>'sla_id')::UUID;

            -- Update the SLA record to mark it as auto-generated
            UPDATE service_agreements
            SET
                auto_generated = true,
                automation_trigger = 'manual_retroactive_generation',
                updated_at = NOW()
            WHERE id = result_sla_id;
        ELSE
            result_sla_id := NULL;
        END IF;

        -- Return the result
        quote_id := quote_record.id;
        sla_id := result_sla_id;
        success := (sla_result->>'success')::BOOLEAN;
        message := sla_result->>'message';

        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on automation queries
CREATE INDEX IF NOT EXISTS idx_service_agreements_auto_generated ON service_agreements(auto_generated);
CREATE INDEX IF NOT EXISTS idx_service_agreements_automation_trigger ON service_agreements(automation_trigger);

-- Add helpful comments
COMMENT ON FUNCTION trigger_sla_generation_on_quote_acceptance() IS 'Automatically generates SLA when quote status changes to accepted';
COMMENT ON FUNCTION generate_sla_for_quote(UUID) IS 'Generates SLA for a specific quote with default template and variables';
COMMENT ON FUNCTION generate_slas_for_existing_accepted_quotes() IS 'Retroactively generates SLAs for existing accepted quotes that don''t have SLAs';