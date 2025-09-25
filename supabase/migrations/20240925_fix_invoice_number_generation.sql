-- Fix invoice number generation to handle formatted invoice numbers properly
-- This migration fixes the issue where casting formatted invoice numbers (like "INV-2024-0001") to INTEGER fails

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS trigger_generate_invoice_on_accept ON quotes;
DROP FUNCTION IF EXISTS generate_invoice_on_quote_accept();
DROP FUNCTION IF EXISTS convert_quote_to_invoice(UUID);

-- Create helper function to extract sequence number from formatted invoice numbers
CREATE OR REPLACE FUNCTION extract_invoice_sequence(p_invoice_number TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_sequence INTEGER;
BEGIN
    -- Try to extract sequence number from various formats
    -- Format: INV-2024-0001 -> extract 0001 and convert to 1
    BEGIN
        -- Use regex to extract the last sequence number (digits after last hyphen or at end)
        v_sequence := SUBSTRING(p_invoice_number FROM '(\d+)$');

        -- If no digits found at end, try to find any sequence of digits
        IF v_sequence IS NULL THEN
            v_sequence := SUBSTRING(p_invoice_number FROM '(\d{4,})');
        END IF;

        -- If still no sequence found, return 0
        IF v_sequence IS NULL THEN
            v_sequence := 0;
        END IF;

        RETURN v_sequence::INTEGER;
    EXCEPTION WHEN OTHERS THEN
        RETURN 0;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate next invoice number based on company settings format
CREATE OR REPLACE FUNCTION generate_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_next_sequence INTEGER;
    v_format TEXT;
    v_current_year TEXT;
    v_result TEXT;
BEGIN
    -- Get company settings
    SELECT numbering_format_invoice, COALESCE(next_invoice_number, 1)
    INTO v_format, v_next_sequence
    FROM company_settings
    LIMIT 1;

    -- If no format found, use default
    IF v_format IS NULL THEN
        v_format := 'INV-{YYYY}-{seq:04d}';
    END IF;

    -- Get current year
    v_current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

    -- Find the maximum sequence number from existing invoices
    -- This handles cases where invoices might have different formats
    SELECT COALESCE(MAX(extract_invoice_sequence(invoice_number)), 0)
    INTO v_next_sequence
    FROM invoices;

    -- Increment sequence
    v_next_sequence := v_next_sequence + 1;

    -- Replace placeholders in format
    v_result := REPLACE(v_format, '{YYYY}', v_current_year);
    v_result := REPLACE(v_result, '{seq:04d}', LPAD(v_next_sequence::TEXT, 4, '0'));
    v_result := REPLACE(v_result, '{seq:03d}', LPAD(v_next_sequence::TEXT, 3, '0'));
    v_result := REPLACE(v_result, '{seq:02d}', LPAD(v_next_sequence::TEXT, 2, '0'));
    v_result := REPLACE(v_result, '{seq:d}', v_next_sequence::TEXT);

    -- Update company settings with next sequence for future use
    UPDATE company_settings
    SET next_invoice_number = v_next_sequence + 1
    WHERE id = (SELECT id FROM company_settings LIMIT 1);

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Recreate the auto-generation trigger function with fixed invoice number generation
CREATE OR REPLACE FUNCTION generate_invoice_on_quote_accept()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_next_invoice_number TEXT;
    v_has_existing_invoice BOOLEAN;
BEGIN
    -- Only proceed if status is changing to 'Accepted'
    IF NEW.status != 'Accepted' OR OLD.status = 'Accepted' THEN
        RETURN NEW;
    END IF;

    -- Check if quote already has an invoice generated
    SELECT EXISTS (
        SELECT 1 FROM invoices
        WHERE created_from_quote_id = NEW.id
    ) INTO v_has_existing_invoice;

    -- Skip if invoice already exists
    IF v_has_existing_invoice THEN
        RETURN NEW;
    END IF;

    -- Generate next invoice number using proper formatting
    SELECT generate_next_invoice_number()
    INTO v_next_invoice_number;

    -- Generate the invoice using correct column names
    INSERT INTO invoices (
        invoice_number,
        created_by_user_id,
        date_issued,
        due_date,
        client_id,
        subtotal_excl_vat,
        vat_amount,
        total_incl_vat,
        deposit_required,
        deposit_amount,
        balance_remaining,
        status,
        payment_instructions,
        created_from_quote_id,
        created_at,
        updated_at
    )
    SELECT
        v_next_invoice_number,
        created_by_user_id,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        client_id,
        subtotal_excl_vat,
        vat_amount,
        total_incl_vat,
        CASE WHEN deposit_percentage > 0 THEN true ELSE false END,
        deposit_amount,
        total_incl_vat - COALESCE(deposit_amount, 0),
        'draft',
        '{"bank": "", "accountName": "", "accountNumber": "", "branchCode": "", "swift": ""}'::jsonb,
        id, -- quote_id
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM quotes
    WHERE id = NEW.id
    RETURNING id INTO v_invoice_id;

    -- Copy quote items to invoice items
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        updated_at
    )
    SELECT
        v_invoice_id,
        qi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM quote_items qi
    JOIN items i ON qi.item_id = i.id
    WHERE qi.quote_id = NEW.id;

    -- Copy package items if any
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        updated_at
    )
    SELECT
        v_invoice_id,
        pi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM package_items pi
    JOIN quote_packages qp ON pi.package_id = qp.package_id
    JOIN items i ON pi.item_id = i.id
    WHERE qp.quote_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the manual conversion function with fixed invoice number generation
CREATE OR REPLACE FUNCTION convert_quote_to_invoice(p_quote_id UUID)
RETURNS TABLE(invoice_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
    v_invoice_id UUID;
    v_next_invoice_number TEXT;
    v_quote_status TEXT;
    v_created_by_user_id UUID;
    v_has_existing_invoice BOOLEAN;
BEGIN
    -- Check if quote exists and get its status
    SELECT status, created_by_user_id INTO v_quote_status, v_created_by_user_id
    FROM quotes
    WHERE id = p_quote_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Quote not found';
        RETURN;
    END IF;

    -- Check if quote is in accepted status
    IF v_quote_status != 'Accepted' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Quote must be in Accepted status to convert to invoice';
        RETURN;
    END IF;

    -- Check if invoice already exists
    SELECT EXISTS (
        SELECT 1 FROM invoices
        WHERE created_from_quote_id = p_quote_id
    ) INTO v_has_existing_invoice;

    IF v_has_existing_invoice THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Invoice already exists for this quote';
        RETURN;
    END IF;

    -- Generate next invoice number using proper formatting
    SELECT generate_next_invoice_number()
    INTO v_next_invoice_number;

    -- Generate the invoice using correct column names
    INSERT INTO invoices (
        invoice_number,
        created_by_user_id,
        date_issued,
        due_date,
        client_id,
        subtotal_excl_vat,
        vat_amount,
        total_incl_vat,
        deposit_required,
        deposit_amount,
        balance_remaining,
        status,
        payment_instructions,
        created_from_quote_id,
        created_at,
        updated_at
    )
    SELECT
        v_next_invoice_number,
        created_by_user_id,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        client_id,
        subtotal_excl_vat,
        vat_amount,
        total_incl_vat,
        CASE WHEN deposit_percentage > 0 THEN true ELSE false END,
        deposit_amount,
        total_incl_vat - COALESCE(deposit_amount, 0),
        'draft',
        '{"bank": "", "accountName": "", "accountNumber": "", "branchCode": "", "swift": ""}'::jsonb,
        p_quote_id,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM quotes
    WHERE id = p_quote_id
    RETURNING id INTO v_invoice_id;

    -- Copy quote items to invoice items
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        updated_at
    )
    SELECT
        v_invoice_id,
        qi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM quote_items qi
    JOIN items i ON qi.item_id = i.id
    WHERE qi.quote_id = p_quote_id;

    -- Copy package items if any
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        created_at,
        updated_at
    )
    SELECT
        v_invoice_id,
        pi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM package_items pi
    JOIN quote_packages qp ON pi.package_id = qp.package_id
    JOIN items i ON pi.item_id = i.id
    WHERE qp.quote_id = p_quote_id;

    RETURN QUERY SELECT v_invoice_id, TRUE, 'Invoice generated successfully';
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE OR REPLACE TRIGGER trigger_generate_invoice_on_accept
    AFTER UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_on_quote_accept();

-- Return verification results
SELECT 'Invoice number generation fix completed successfully' as message,
       'extract_invoice_sequence' as helper_function_created,
       'generate_next_invoice_number' as generator_function_created,
       'trigger_generate_invoice_on_accept' as trigger_updated,
       'convert_quote_to_invoice' as conversion_function_updated;