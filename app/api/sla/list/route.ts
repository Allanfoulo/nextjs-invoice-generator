// SLA List API Route
// Fetches all SLAs with related quote and client information

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');

    let query = supabase
      .from('service_agreements')
      .select(`
        *,
        quotes (
          quote_number,
          total_incl_vat,
          clients (
            name,
            company,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slas: data || []
    });

  } catch (error) {
    console.error('Error fetching SLAs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SLAs'
      },
      { status: 500 }
    );
  }
}