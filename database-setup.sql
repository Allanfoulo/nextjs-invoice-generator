-- Supabase Database Setup for Invoice Generator
-- Run this SQL in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE item_type AS ENUM ('fixed', 'hourly', 'expense');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'declined', 'expired');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'partially_paid', 'paid', 'overdue');

-- Create items table
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  qty DECIMAL(10,2) NOT NULL DEFAULT 1,
  taxable BOOLEAN NOT NULL DEFAULT true,
  item_type item_type NOT NULL DEFAULT 'fixed',
  unit TEXT NOT NULL DEFAULT 'each',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  billing_address TEXT,
  delivery_address TEXT,
  vat_number TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create company_settings table
CREATE TABLE company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  address TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  logo_url TEXT,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  numbering_format_invoice TEXT NOT NULL DEFAULT 'INV-{seq:04d}',
  numbering_format_quote TEXT NOT NULL DEFAULT 'Q-{seq:04d}',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  next_quote_number INTEGER NOT NULL DEFAULT 1,
  terms_text TEXT NOT NULL DEFAULT '',
  payment_instructions JSONB NOT NULL DEFAULT '{
    "bank": "",
    "accountName": "",
    "accountNumber": "",
    "branchCode": "",
    "swift": ""
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  created_by_user_id UUID NOT NULL, -- References auth.users
  date_issued DATE NOT NULL,
  valid_until DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subtotal_excl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_percentage DECIMAL(5,2) DEFAULT 0,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  balance_remaining DECIMAL(10,2) DEFAULT 0,
  status quote_status NOT NULL DEFAULT 'draft',
  terms_text TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  created_by_user_id UUID NOT NULL, -- References auth.users
  date_issued DATE NOT NULL,
  due_date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  subtotal_excl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_incl_vat DECIMAL(10,2) NOT NULL DEFAULT 0,
  deposit_required BOOLEAN NOT NULL DEFAULT false,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  balance_remaining DECIMAL(10,2) DEFAULT 0,
  status invoice_status NOT NULL DEFAULT 'draft',
  payment_instructions JSONB NOT NULL DEFAULT '{
    "bank": "",
    "accountName": "",
    "accountNumber": "",
    "branchCode": "",
    "swift": ""
  }'::jsonb,
  created_from_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quote_items junction table
CREATE TABLE quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items junction table
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create package_items junction table
CREATE TABLE package_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_clients_company ON clients(company);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_package_items_package_id ON package_items(package_id);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may want to customize these)
-- For demo purposes, allow all authenticated users to do everything
-- In production, you'd want more restrictive policies

CREATE POLICY "Allow all operations for authenticated users on items" ON items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on clients" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on company_settings" ON company_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on quotes" ON quotes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on invoices" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on quote_items" ON quote_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on invoice_items" ON invoice_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on package_items" ON package_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert default company settings (optional - you can do this through the UI)
-- INSERT INTO company_settings (company_name, address, email, phone, currency, vat_percentage, terms_text)
-- VALUES ('Your Company Name', '123 Business St, City, Country', 'info@company.com', '+27 21 123 4567', 'ZAR', 15.00, 'Payment due within 30 days.');

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true);

-- Create storage policies for the profiles bucket
CREATE POLICY "Allow authenticated users to upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to view profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their own profile images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their own profile images" ON storage.objects
  FOR DELETE USING (bucket_id = 'profiles' AND auth.role() = 'authenticated');

-- Create storage bucket for company logos (optional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Create storage policies for company logos
CREATE POLICY "Allow authenticated users to manage company logos" ON storage.objects
  FOR ALL USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');