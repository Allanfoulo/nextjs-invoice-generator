// Quote Update API Route
// Handles quote updates and triggers SLA generation when status changes to accepted

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

    // Fetch current quote to check for status changes
    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, quote_number, client_id, total_incl_vat, created_by_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this quote
    if (currentQuote.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if status is being changed to 'accepted'
    const statusChangedToAccepted = status === 'accepted' && currentQuote.status !== 'accepted';

    // Update the quote
    const updateData: any = {
      ...otherUpdates,
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
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

    // If status changed to accepted, trigger SLA generation
    let slaGenerationResult = null;
    if (statusChangedToAccepted) {
      try {
        // Call the SLA auto-generation API
        const slaResponse = await fetch(`${request.nextUrl.origin}/api/sla/auto-generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quote_id: id,
            trigger_source: 'quote_status_change'
          })
        });

        if (slaResponse.ok) {
          slaGenerationResult = await slaResponse.json();
        } else {
          console.error('SLA generation failed:', await slaResponse.text());
          slaGenerationResult = {
            success: false,
            error: 'SLA generation failed',
            trigger_attempted: true
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
      quote: updatedQuote,
      sla_generation: slaGenerationResult,
      automation_triggered: statusChangedToAccepted
    });

  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch a specific quote
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

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to access this quote
    if (quote.created_by_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({ quote });

  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}