import { NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf-service';
import { OpenAIService } from '@/lib/openai-service';
import { ProtocolService } from '@/lib/protocol-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the file from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    // Validate file
    if (!file.type || file.type !== 'application/pdf') {
      return new NextResponse('File must be a PDF', { status: 400 });
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return new NextResponse('PDF file size must be less than 10MB', { status: 400 });
    }

    // Convert File to Blob
    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Extract text from PDF
    const text = await extractTextFromPDF(blob);

    // Use OpenAI to analyze the text and create protocol
    const openAIService = new OpenAIService();
    const protocolData = await openAIService.analyzeProtocolPDF(text);

    // Create protocol
    const protocolService = new ProtocolService();
    const protocol = await protocolService.createFromPDF(protocolData, session.user.id);

    return NextResponse.json(protocol);
  } catch (error) {
    console.error('Error processing PDF upload:', error);
    return new NextResponse('Error processing PDF', { status: 500 });
  }
} 