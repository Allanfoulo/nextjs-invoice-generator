-- Add missing packages and quote_packages tables to support the auto-generation trigger

-- Create packages table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_packages_quote_id ON quote_packages(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_packages_package_id ON quote_packages(package_id);

-- Enable Row Level Security
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users on packages" ON packages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users on quote_packages" ON quote_packages
  FOR ALL USING (auth.role() = 'authenticated');