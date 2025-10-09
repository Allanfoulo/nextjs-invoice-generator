-- SLA Automation Triggers
-- Creates database functions and triggers for automatic SLA generation

-- Create function to handle SLA generation when quote status changes to accepted
CREATE OR REPLACE FUNCTION handle_quote_status_change_for_sla()
RETURNS TRIGGER AS $$
DECLARE
    sla_count INTEGER;
    quote_value DECIMAL;
BEGIN
    -- Only proceed if status changed to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Check if quote has minimum value for SLA generation (optional business rule)
        IF COALESCE(NEW.total_incl_vat, 0) > 0 THEN
            -- Check if SLA already exists for this quote
            SELECT COUNT(*) INTO sla_count
            FROM service_agreements
            WHERE quote_id = NEW.id
            AND status NOT IN ('rejected', 'expired');

            -- Only generate SLA if one doesn't already exist
            IF sla_count = 0 THEN
                -- Insert new SLA record with automation metadata
                INSERT INTO service_agreements (
                    quote_id,
                    agreement_number,
                    status,
                    start_date,
                    end_date,
                    uptime_guarantee,
                    response_time_hours,
                    resolution_time_hours,
                    penalty_percentage,
                    penalty_cap_percentage,
                    agreement_variables,
                    auto_generated,
                    automation_trigger,
                    created_at,
                    updated_at
                ) VALUES (
                    NEW.id,
                    -- Generate agreement number based on quote number
                    'SLA-' || substring(NEW.quote_number from 3) || '-' || to_char(CURRENT_DATE, 'YY'),
                    'generated',
                    CURRENT_DATE,
                    -- Set end date to 1 year from start (can be customized)
                    CURRENT_DATE + INTERVAL '1 year',
                    -- Default SLA terms (can be customized based on quote value or client)
                    99.5, -- uptime guarantee
                    24,   -- response time in hours
                    72,   -- resolution time in hours
                    10,   -- penalty percentage
                    25,   -- penalty cap percentage
                    -- JSON variables for template
                    jsonb_build_object(
                        'client_company', (SELECT company FROM clients WHERE id = NEW.client_id),
                        'client_name', (SELECT name FROM clients WHERE id = NEW.client_id),
                        'service_description', 'Software development services as per quote ' || NEW.quote_number,
                        'contract_value', NEW.total_incl_vat,
                        'quote_number', NEW.quote_number,
                        'effective_date', CURRENT_DATE,
                        'service_provider', 'INNOVATION IMPERIAL'
                    )::jsonb,
                    true, -- auto generated
                    'quote_status_change', -- trigger source
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );

                -- Log the automation event (optional)
                INSERT INTO sla_automation_logs (
                    quote_id,
                    trigger_type,
                    trigger_source,
                    sla_generated,
                    created_at
                ) VALUES (
                    NEW.id,
                    'status_change',
                    'database_trigger',
                    true,
                    CURRENT_TIMESTAMP
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quote status changes
DROP TRIGGER IF EXISTS quote_status_change_sla_trigger ON quotes;
CREATE TRIGGER quote_status_change_sla_trigger
    AFTER UPDATE OF status ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION handle_quote_status_change_for_sla();

-- Create function to log SLA automation events
CREATE OR REPLACE FUNCTION log_sla_automation_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Log successful SLA generation
    IF TG_OP = 'INSERT' AND NEW.auto_generated = true THEN
        INSERT INTO sla_automation_logs (
            quote_id,
            trigger_type,
            trigger_source,
            sla_generated,
            sla_id,
            created_at
        ) VALUES (
            NEW.quote_id,
            'auto_generation',
            COALESCE(NEW.automation_trigger, 'unknown'),
            true,
            NEW.id,
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SLA insertion logging
DROP TRIGGER IF EXISTS sla_insertion_log_trigger ON service_agreements;
CREATE TRIGGER sla_insertion_log_trigger
    AFTER INSERT ON service_agreements
    FOR EACH ROW
    EXECUTE FUNCTION log_sla_automation_event();

-- Create table for SLA automation logs (if it doesn't exist)
CREATE TABLE IF NOT EXISTS sla_automation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL, -- 'status_change', 'manual', 'api_call', etc.
    trigger_source TEXT NOT NULL, -- 'database_trigger', 'web_interface', 'api', etc.
    sla_generated BOOLEAN NOT NULL DEFAULT false,
    sla_id UUID REFERENCES service_agreements(id) ON DELETE SET NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sla_automation_logs_quote_id ON sla_automation_logs(quote_id);
CREATE INDEX IF NOT EXISTS idx_sla_automation_logs_created_at ON sla_automation_logs(created_at);

-- Enable RLS for the logs table
ALTER TABLE sla_automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for SLA automation logs
CREATE POLICY "Users can view their own SLA automation logs"
    ON sla_automation_logs FOR SELECT
    USING (
        quote_id IN (
            SELECT id FROM quotes
            WHERE created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert SLA automation logs"
    ON sla_automation_logs FOR INSERT
    WITH CHECK (true); -- Allow system to insert logs

-- Create function to check and clean up expired SLA automation attempts
CREATE OR REPLACE FUNCTION cleanup_expired_sla_attempts()
RETURNS VOID AS $$
BEGIN
    -- Delete failed automation attempts older than 30 days
    DELETE FROM sla_automation_logs
    WHERE sla_generated = false
    AND error_message IS NOT NULL
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;