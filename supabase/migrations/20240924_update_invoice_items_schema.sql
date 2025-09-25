-- Update invoice_items table to include quantity, unit_price, and total_price columns
-- These are needed for the auto-generation trigger to work properly

-- Add missing columns to invoice_items table
ALTER TABLE invoice_items
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2) DEFAULT 1,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Also update quote_items table for consistency
ALTER TABLE quote_items
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();