-- Fix the manual conversion function to use correct column names

-- Drop existing function
DROP FUNCTION IF EXISTS convert_quote_to_invoice(UUID);

-- Create RPC function for manual invoice generation from quote
CREATE OR REPLACE FUNCTION convert_quote_to_invoice(p_quote_id UUID)
RETURNS TABLE(invoice_id UUID, success BOOLEAN, message TEXT) AS $$
DECLARE
    v_invoice_id UUID;
    v_next_invoice_number TEXT;
    v_company_id UUID;
    v_user_id UUID;
    v_quote_status TEXT;
    v_has_existing_invoice BOOLEAN;
BEGIN
    -- Check if quote exists and get its status
    SELECT status, created_by_user_id INTO v_quote_status, v_user_id
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

    -- Get next invoice number
    SELECT COALESCE(MAX(CAST(invoice_number AS INTEGER)), 0) + 1
    INTO v_next_invoice_number
    FROM invoices;

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
        v_next_invoice_number::TEXT,
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