'use client';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFService } from '@/lib/pdf-service';
import { ProtocolService } from '@/lib/protocol-service';
import { AIService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const confirmCreate = formData.get('confirmCreate') === 'true';

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
      // Validate PDF
      PDFService.validatePDF(file);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }

    // Convert File to Blob
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Extract text from PDF
    const pdfService = new PDFService();
    const text = await pdfService.extractText(blob);

    // Use AIService to analyze the text and create protocol
    const protocolData = await AIService.analyzePDFContent(text);

    // If not confirmed, return preview data
    if (!confirmCreate) {
      return NextResponse.json({
        preview: true,
        data: protocolData
      });
    }

    // Create protocol only if confirmed
    const protocolService = new ProtocolService();
    const protocol = await protocolService.createFromPDF(protocolData, session.user.id);

    return NextResponse.json(protocol);
  } catch (error) {
    console.error('Error creating protocol from PDF:', error);
    return NextResponse.json(
      { error: 'Failed to create protocol from PDF' },
      { status: 500 }
    );
  }
} 