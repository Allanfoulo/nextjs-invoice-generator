// SLA Templates API Route
// Handles SLA template management operations

import { NextRequest, NextResponse } from 'next/server';
import { SLAService } from '@/lib/sla-service';
import { SLATemplate, SLATemplateForm } from '@/lib/sla-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');

    const templates = await SLAService.getSLATemplates(industry || undefined);

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching SLA templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch SLA templates'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SLATemplateForm = await request.json();

    // Get current user (in a real app, this would come from authentication)
    const userId = 'current-user-id'; // Replace with actual user ID from auth

    const template = await SLAService.createSLATemplate({
      ...body,
      created_by_user_id: userId
    });

    return NextResponse.json({
      success: true,
      template
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating SLA template:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create SLA template'
      },
      { status: 500 }
    );
  }
}