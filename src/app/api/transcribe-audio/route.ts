import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json({ 
        error: 'Audio file too large. Maximum size is 25MB.' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/flac',
      'audio/m4a'
    ];

    if (!allowedTypes.some(type => audioFile.type.includes(type.split('/')[1]))) {
      return NextResponse.json({ 
        error: 'Unsupported audio format' 
      }, { status: 400 });
    }

    console.log('Transcribing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    try {
      // Convert File to Buffer for OpenAI API
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a File-like object that OpenAI expects
      const file = new File([buffer], audioFile.name || 'recording.webm', {
        type: audioFile.type || 'audio/webm'
      });

      // Transcribe using Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'en', // English - changed from 'pt'
        response_format: 'text',
        temperature: 0.2 // Lower temperature for more consistent results
      });

      console.log('Transcription successful:', {
        textLength: transcription.length,
        preview: transcription.substring(0, 100)
      });

      // Clean up the transcription text
      const cleanedText = transcription
        .trim()
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

      return NextResponse.json({ 
        text: cleanedText,
        originalLength: transcription.length,
        success: true
      });

    } catch (openaiError) {
      console.error('OpenAI Whisper API error:', openaiError);
      
      // Handle specific OpenAI errors
      if (openaiError instanceof Error) {
        if (openaiError.message.includes('rate_limit')) {
          return NextResponse.json({ 
            error: 'Rate limit exceeded. Please try again in a moment.' 
          }, { status: 429 });
        }
        
        if (openaiError.message.includes('invalid_request')) {
          return NextResponse.json({ 
            error: 'Invalid audio format or corrupted file.' 
          }, { status: 400 });
        }
      }

      return NextResponse.json({ 
        error: 'Transcription service temporarily unavailable. Please try again.' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error in transcribe-audio API:', error);
    
    if (error instanceof Error) {
      // Handle specific errors
      if (error.message.includes('FormData')) {
        return NextResponse.json({ 
          error: 'Invalid request format' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 