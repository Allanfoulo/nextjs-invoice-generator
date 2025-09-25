-- Comprehensive fix for invoice generation system
-- This script combines all necessary fixes to resolve the invoice display issue

-- 1. Add missing packages schema
CREATE TABLE IF NOT EXISTS packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_excl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_packages junction table
CREATE TABLE IF NOT EXISTS quote_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package_items junction table (missing from original migrations)
CREATE TABLE IF NOT EXISTS package_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_packages_quote_id ON quote_packages(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_packages_package_id ON quote_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_package_items_item_id ON package_items(item_id);

-- Enable Row Level Security
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users on packages" ON packages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on quote_packages" ON quote_packages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on package_items" ON package_items
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Update invoice_items table with missing columns
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update quote_items table for consistency
ALTER TABLE quote_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_generate_invoice_on_accept ON quotes;
DROP FUNCTION IF EXISTS generate_invoice_on_quote_accept();

-- 4. Create corrected auto-generation trigger function
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

    -- Get company info from company_settings
    SELECT id INTO v_company_id
    FROM company_settings
    LIMIT 1;

    -- Get user info from the quote
    SELECT created_by_user_id INTO v_user_id
    FROM quotes
    WHERE id = NEW.id;

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

-- 5. Create the trigger
CREATE OR REPLACE TRIGGER trigger_generate_invoice_on_accept
    AFTER UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION generate_invoice_on_quote_accept();

-- 6. Drop and recreate manual conversion function
DROP FUNCTION IF EXISTS convert_quote_to_invoice(UUID);

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

-- 7. Return results for verification
SELECT 'Schema update completed successfully' as message,
       'packages' as table1_created,
       'quote_packages' as table2_created,
       'package_items' as table3_created,
       'invoice_items_columns_added' as columns_updated,
       'trigger_created' as trigger_ready,
       'rpc_function_created' as function_ready;