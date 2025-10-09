// SLA Details API Route
// Fetches SLA data with related quote and client information

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: sla, error } = await supabase
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
        ),
        sla_templates (
          name,
          description
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    if (!sla) {
      return NextResponse.json(
        { success: false, error: 'SLA not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sla
    });

  } catch (error) {
    console.error('Error fetching SLA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SLA'
      },
      { status: 500 }
    );
  }
}