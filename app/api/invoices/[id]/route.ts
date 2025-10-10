// Invoice Update API Route
// Handles invoice updates and can trigger SLA generation if needed

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sgbrlqcquoydwgugaiqn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnYnJscWNxdW95ZHdndWdhaXFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyODg4NjksImV4cCI6MjA3Mzg2NDg2OX0.QdfVq-AWsAoufIWe0d4OyursigMHYcerrqVezp7LhKs";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the auth token from the request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, ...otherUpdates } = body;

    // Fetch current invoice to check for status changes
    const { data: currentInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, status, invoice_number, client_id, total_incl_vat, created_from_quote_id, created_by_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this invoice
    if (currentInvoice.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Update the invoice
    const updateData: any = {
      ...otherUpdates,
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // Check if this invoice was created from a quote and if SLA generation should be triggered
    let slaGenerationResult = null;
    let automationTriggered = false;

    if (currentInvoice.created_from_quote_id && status === 'paid') {
      try {
        // Check if SLA already exists for the associated quote
        const { data: existingSLA, error: slaCheckError } = await supabase
          .from('service_agreements')
          .select('id, status')
          .eq('quote_id', currentInvoice.created_from_quote_id)
          .single();

        if (!existingSLA && slaCheckError?.code === 'PGRST116') {
          // No SLA exists, trigger auto-generation
          const slaResponse = await fetch(`${request.nextUrl.origin}/api/sla/auto-generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              quote_id: currentInvoice.created_from_quote_id,
              trigger_source: 'invoice_payment_complete'
            })
          });

          if (slaResponse.ok) {
            slaGenerationResult = await slaResponse.json();
            automationTriggered = true;
          } else {
            console.error('SLA generation failed:', await slaResponse.text());
            slaGenerationResult = {
              success: false,
              error: 'SLA generation failed',
              trigger_attempted: true
            };
          }
        } else if (existingSLA) {
          slaGenerationResult = {
            success: true,
            message: 'SLA already exists for this invoice\'s quote',
            existing_sla_id: existingSLA.id,
            status: existingSLA.status
          };
        }
      } catch (slaError) {
        console.error('Error triggering SLA generation:', slaError);
        slaGenerationResult = {
          success: false,
          error: 'Failed to trigger SLA generation',
          trigger_attempted: true
        };
      }
    }

    return NextResponse.json({
      invoice: updatedInvoice,
      sla_generation: slaGenerationResult,
      automation_triggered: automationTriggered
    });

  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch a specific invoice
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get the auth token from the request header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to access this invoice
    if (invoice.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ invoice });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}