// Automated SLA Generation API Route
// Handles automatic SLA generation when quotes are accepted

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SLAGenerationRequest } from '@/lib/sla-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quote_id, trigger_source = 'manual' } = body;

    if (!quote_id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Verify the quote exists and is in accepted status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (quote.status !== 'sent' && quote.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Quote must be in sent or accepted status to generate SLA' },
        { status: 400 }
      );
    }

    // Check if SLA already exists for this quote
    const { data: existingSLA, error: slaCheckError } = await supabase
      .from('service_agreements')
      .select('id, status')
      .eq('quote_id', quote_id)
      .single();

    if (existingSLA && slaCheckError === null) {
      return NextResponse.json(
        {
          error: 'SLA already exists for this quote',
          existing_sla_id: existingSLA.id,
          status: existingSLA.status
        },
        { status: 409 }
      );
    }

    // Get the default SLA template
    const { data: template, error: templateError } = await supabase
      .from('sla_templates')
      .select('*')
      .eq('industry', 'software_development')
      .eq('is_active', true)
      .order('created_at')
      .limit(1)
      .single();

    if (templateError && templateError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching template:', templateError);
    }

    // Prepare SLA generation request
    const slaRequest: SLAGenerationRequest = {
      quote_id: quote_id,
      template_id: template?.id,
      performance_requirements: {
        uptime: 99.5,
        response_time: 24,
        resolution_time: 72
      }
    };

    // Generate SLA using the existing SLA service
    const { data: slaResult, error: generationError } = await supabase
      .rpc('generate_sla_for_quote', {
        p_quote_id: quote_id
      });

    if (generationError) {
      console.error('Database function error:', generationError);

      // Fallback to manual generation using the SLA service
      return await fallbackSLAGeneration(quote, slaRequest, trigger_source);
    }

    if (!slaResult || !slaResult.success) {
      console.error('SLA generation failed:', slaResult);

      // Fallback to manual generation
      return await fallbackSLAGeneration(quote, slaRequest, trigger_source);
    }

    // Update the generated SLA with automation metadata
    const { error: updateError } = await supabase
      .from('service_agreements')
      .update({
        auto_generated: true,
        automation_trigger: trigger_source,
        updated_at: new Date().toISOString()
      })
      .eq('id', slaResult.sla_id);

    if (updateError) {
      console.error('Error updating SLA metadata:', updateError);
    }

    return NextResponse.json({
      success: true,
      sla_id: slaResult.sla_id,
      message: slaResult.message || 'SLA generated successfully',
      auto_generated: true,
      trigger_source: trigger_source
    });

  } catch (error) {
    console.error('Error in auto-generate SLA:', error);
    return NextResponse.json(
      { error: 'Failed to generate SLA' },
      { status: 500 }
    );
  }
}

// Fallback function for SLA generation when database function fails
async function fallbackSLAGeneration(quote: any, request: SLAGenerationRequest, triggerSource: string) {
  try {
    // Use the existing SLA generation endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-sla`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`SLA generation service returned ${response.status}`);
    }

    const result = await response.json();

    if (result.success && result.service_agreement) {
      // Update with automation metadata
      await supabase
        .from('service_agreements')
        .update({
          auto_generated: true,
          automation_trigger: triggerSource,
          updated_at: new Date().toISOString()
        })
        .eq('id', result.service_agreement.id);

      return NextResponse.json({
        success: true,
        sla_id: result.service_agreement.id,
        message: 'SLA generated successfully via fallback method',
        auto_generated: true,
        trigger_source: triggerSource
      });
    } else {
      return NextResponse.json(
        {
          error: result.error || 'SLA generation failed',
          fallback_attempted: true
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Fallback SLA generation error:', error);
    return NextResponse.json(
      {
        error: 'Both primary and fallback SLA generation methods failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check automation status and manually trigger generation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quote_id = searchParams.get('quote_id');
    const trigger = searchParams.get('trigger');

    if (!quote_id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    // Check if quote exists and get its status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, status, quote_number')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check existing SLA status
    const { data: existingSLA, error: slaError } = await supabase
      .from('service_agreements')
      .select('id, status, auto_generated, automation_trigger, created_at')
      .eq('quote_id', quote_id)
      .single();

    if (trigger === 'manual' && (quote.status === 'sent' || quote.status === 'accepted')) {
      // Manually trigger SLA generation
      const manualRequest = await fetch(`${request.nextUrl.origin}/api/sla/auto-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quote_id: quote_id,
          trigger_source: 'manual_api_call'
        })
      });

      if (manualRequest.ok) {
        const result = await manualRequest.json();
        return NextResponse.json(result);
      } else {
        const errorData = await manualRequest.json();
        return NextResponse.json(errorData, { status: manualRequest.status });
      }
    }

    return NextResponse.json({
      quote_id: quote.id,
      quote_status: quote.status,
      quote_number: quote.quote_number,
      existing_sla: existingSLA ? {
        id: existingSLA.id,
        status: existingSLA.status,
        auto_generated: existingSLA.auto_generated,
        automation_trigger: existingSLA.automation_trigger,
        created_at: existingSLA.created_at
      } : null,
      can_auto_generate: (quote.status === 'sent' || quote.status === 'accepted') && !existingSLA,
      automation_enabled: true
    });

  } catch (error) {
    console.error('Error checking SLA automation status:', error);
    return NextResponse.json(
      { error: 'Failed to check automation status' },
      { status: 500 }
    );
  }
}