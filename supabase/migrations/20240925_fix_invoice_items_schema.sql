-- Fix invoice_items schema mismatch in trigger functions
-- The actual schema has composite primary key (invoice_id, item_id) and no separate id or created_at columns

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS trigger_generate_invoice_on_accept ON quotes;
DROP FUNCTION IF EXISTS generate_invoice_on_quote_accept();
DROP FUNCTION IF EXISTS convert_quote_to_invoice(UUID);

-- Recreate the auto-generation trigger function with correct invoice_items schema
CREATE OR REPLACE FUNCTION generate_invoice_on_quote_accept()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_next_invoice_number TEXT;
    v_has_existing_invoice BOOLEAN;
BEGIN
    -- Only proceed if status is changing to 'accepted' (lowercase to match enum)
    IF NEW.status != 'accepted' OR OLD.status = 'accepted' THEN
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

    -- Copy quote items to invoice items using correct schema
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        updated_at
    )
    SELECT
        v_invoice_id,
        qi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP
    FROM quote_items qi
    JOIN items i ON qi.item_id = i.id
    WHERE qi.quote_id = NEW.id;

    -- Copy package items if any using correct schema
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        updated_at
    )
    SELECT
        v_invoice_id,
        pi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP
    FROM package_items pi
    JOIN quote_packages qp ON pi.package_id = qp.package_id
    JOIN items i ON pi.item_id = i.id
    WHERE qp.quote_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the manual conversion function with correct invoice_items schema
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

    -- Check if quote is in accepted status (lowercase to match enum)
    IF v_quote_status != 'accepted' THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Quote must be in accepted status to convert to invoice';
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

    -- Copy quote items to invoice items using correct schema
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        updated_at
    )
    SELECT
        v_invoice_id,
        qi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
        CURRENT_TIMESTAMP
    FROM quote_items qi
    JOIN items i ON qi.item_id = i.id
    WHERE qi.quote_id = p_quote_id;

    -- Copy package items if any using correct schema
    INSERT INTO invoice_items (
        invoice_id,
        item_id,
        quantity,
        unit_price,
        total_price,
        updated_at
    )
    SELECT
        v_invoice_id,
        pi.item_id,
        i.qty,
        i.unit_price,
        (i.unit_price * i.qty),
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
SELECT 'invoice_items schema fix completed successfully' as message,
       'trigger_generate_invoice_on_accept' as trigger_updated,
       'convert_quote_to_invoice' as conversion_function_updated;