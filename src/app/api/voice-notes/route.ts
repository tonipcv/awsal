import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const voiceNotes = await prisma.voiceNote.findMany({
      where: {
        patientId,
        doctorId: session.user.id
      },
      include: {
        checklist: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(voiceNotes);
  } catch (error) {
    console.error('Error fetching voice notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { patientId, transcription } = data;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const voiceNote = await prisma.voiceNote.create({
      data: {
        patientId,
        doctorId: session.user.id,
        audioUrl: 'direct-transcription', // Placeholder for direct transcription
        duration: 0, // Default duration for direct transcription
        transcription,
        status: transcription ? 'TRANSCRIBED' : 'PROCESSING'
      }
    });

    return NextResponse.json(voiceNote);
  } catch (error) {
    console.error('Error creating voice note:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 