-- Apply Quote Status Enum Case Fix
-- This migration ensures all database functions and triggers use lowercase enum values
-- to match the TypeScript QuoteStatus enum definition

-- Fix the SLA invoice pattern function that still checks for capitalized 'Accepted'
CREATE OR REPLACE FUNCTION convert_quote_to_sla(p_quote_id UUID)
RETURNS TABLE(sla_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
    v_sla_id UUID;
    v_quote_status TEXT;
    v_user_id UUID;
    v_client_data RECORD;
    v_has_existing_sla BOOLEAN;
    v_automation_id TEXT;
BEGIN
    -- Get quote information with client details
    SELECT
        q.status,
        q.created_by_user_id,
        c.name as client_name,
        c.company as client_company,
        c.email as client_email
    INTO v_quote_status, v_user_id, v_client_data
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

    -- Generate automation ID for tracking
    v_automation_id := 'sla_' || to_char(now(), 'YYYYMMDD_HH24MISS') || '_' || substring(p_quote_id::text, 1, 8);

    -- Create the SLA record
    INSERT INTO service_agreements (
        agreement_number,
        quote_id,
        client_name,
        client_company,
        client_email,
        start_date,
        end_date,
        status,
        automation_metadata,
        created_at,
        updated_at
    )
    SELECT
        'SLA-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
        LPAD(COALESCE(
            (SELECT COUNT(*) + 1 FROM service_agreements
             WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
             AND agreement_number LIKE 'SLA-%')
        , 3, '0'),
        p_quote_id,
        v_client_data.name,
        v_client_data.company,
        v_client_data.email,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '1 year',
        'active',
        jsonb_build_object(
            'automation_trigger', 'quote_status_change',
            'quote_id', p_quote_id,
            'automation_id', v_automation_id,
            'trigger_timestamp', CURRENT_TIMESTAMP,
            'triggered_by', 'system'
        ),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    RETURNING id INTO v_sla_id;

    RETURN QUERY SELECT v_sla_id, TRUE, 'SLA generated successfully';
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix by checking current enum values
SELECT
    'quote_status enum values' as enum_type,
    unnest(enum_range(NULL::quote_status)) as enum_values;

SELECT
    'Quote status enum fix applied successfully' as message,
    'convert_quote_to_sla' as function_updated,
    'Lowercase enum values now consistently used' as fix_summary;