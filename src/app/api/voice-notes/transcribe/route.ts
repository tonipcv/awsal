import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TranscriptionService } from '@/lib/transcription-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied. Only doctors can transcribe voice notes.' }, { status: 403 });
    }

    const { voiceNoteId } = await request.json();

    if (!voiceNoteId) {
      return NextResponse.json(
        { error: 'Voice note ID is required' },
        { status: 400 }
      );
    }

    // Verify if voice note exists and belongs to the doctor
    const voiceNote = await prisma.voiceNote.findFirst({
      where: {
        id: voiceNoteId,
        doctorId: session.user.id
      }
    });

    if (!voiceNote) {
      return NextResponse.json(
        { error: 'Voice note not found or not associated with this doctor' },
        { status: 404 }
      );
    }

    // Start transcription
    const transcriptionService = new TranscriptionService();
    const transcription = await transcriptionService.transcribeAudio(voiceNoteId);

    // Update voice note with transcription
    const updatedVoiceNote = await prisma.voiceNote.update({
      where: { id: voiceNoteId },
      data: {
        transcription,
        status: 'TRANSCRIBED'
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedVoiceNote);
  } catch (error) {
    console.error('Error transcribing voice note:', error);
    return NextResponse.json(
      { error: 'Error transcribing voice note' },
      { status: 500 }
    );
  }
} 