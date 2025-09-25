-- Fix the auto-generation trigger to use correct column names

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_generate_invoice_on_accept ON quotes;
DROP FUNCTION IF EXISTS generate_invoice_on_quote_accept();

-- Create function to auto-generate invoice when quote status changes to 'Accepted'
CREATE OR REPLACE FUNCTION generate_invoice_on_quote_accept()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id UUID;
    v_next_invoice_number TEXT;
    v_company_id UUID;
    v_user_id UUID;
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

    -- Get company and user info
    -- Note: We need to handle the fact that quotes doesn't have company_id directly
    -- We'll use a default company approach since company_settings is a singleton table
    SELECT id, created_by_user_id INTO v_company_id, v_user_id
    FROM company_settings
    LIMIT 1;

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

-- Create trigger for quote status changes
CREATE OR REPLACE TRIGGER trigger_generate_invoice_on_accept
    AFTER UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_on_quote_accept();