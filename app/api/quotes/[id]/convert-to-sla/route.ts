// Quote to SLA Conversion API Route
// Handles SLA generation from quotes following the exact invoice pattern

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // Get the auth token from the request header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the token and get user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const quoteId = id;

    // Call the RPC function to convert quote to SLA (following invoice pattern)
    const { data: conversionResult, error: conversionError } = await supabase
      .rpc('convert_quote_to_sla', {
        p_quote_id: quoteId
      });

    if (conversionError) {
      console.error('Error converting quote to SLA:', conversionError);
      return NextResponse.json(
        { error: conversionError.message || 'Failed to convert quote to SLA' },
        { status: 500 }
      );
    }

    // The RPC returns a table, so we need to get the first row
    const result = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;

    if (!result || !result.success) {
      return NextResponse.json(
        { error: result?.message || 'Failed to generate SLA' },
        { status: 400 }
      );
    }

    // Fetch the created SLA with related data
    const { data: sla, error: slaError } = await supabase
      .from('service_agreements')
      .select(`
        *,
        quotes (
          quote_number,
          total_incl_vat,
          clients (
            name,
            company,
            email,
            billing_address
          )
        )
      `)
      .eq('id', result.sla_id)
      .single();

    if (slaError) {
      console.error('Error fetching created SLA:', slaError);
      return NextResponse.json(
        { error: 'SLA created but failed to fetch details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      sla
    });

  } catch (error) {
    console.error('Unexpected error in quote to SLA conversion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}