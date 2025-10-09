// SLA Generation API Route
// Handles AI-powered SLA generation from quotes

import { NextRequest, NextResponse } from 'next/server';
import { SLAService } from '@/lib/sla-service';
import { SLAGenerationRequest } from '@/lib/sla-types';
import { createSupabaseFromRequest } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body: SLAGenerationRequest = await request.json();

    // Validate required fields
    if (!body.quote_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote ID is required'
        },
        { status: 400 }
      );
    }

    // Create authenticated Supabase client for server-side operations
    const authenticatedSupabase = createSupabaseFromRequest(request);

    const result = await SLAService.generateSLAWithAI(body, authenticatedSupabase);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      service_agreement: result.service_agreement,
      generated_content: result.generated_content,
      variables_used: result.variables_used
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating SLA:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate SLA'
      },
      { status: 500 }
    );
  }
}