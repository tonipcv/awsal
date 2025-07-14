import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { VoiceAnalysisService } from '@/lib/voice-analysis-service';
import { randomUUID } from 'crypto';

interface ChecklistItem {
  title: string;
  description: string;
  type: 'exam' | 'medication' | 'referral' | 'followup';
  status: 'pending' | 'completed';
  dueDate?: string;
}

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
      return NextResponse.json({ error: 'Access denied. Only doctors can analyze voice notes.' }, { status: 403 });
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
        doctorId: session.user.id,
        status: 'TRANSCRIBED' // Only analyze transcribed notes
      }
    });

    if (!voiceNote) {
      return NextResponse.json(
        { error: 'Voice note not found, not transcribed, or not associated with this doctor' },
        { status: 404 }
      );
    }

    // Start analysis
    const analysisService = new VoiceAnalysisService();
    const { summary, checklist } = await analysisService.analyzeTranscription(voiceNoteId);

    // Create checklist and update voice note
    const updatedVoiceNote = await prisma.$transaction(async (tx) => {
      // Create checklist with all items
      await tx.voiceNoteChecklist.create({
        data: {
          id: randomUUID(),
          voiceNoteId,
          items: checklist
        }
      });

      // Update voice note
      return tx.voiceNote.update({
        where: { id: voiceNoteId },
        data: {
          summary,
          status: 'ANALYZED'
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          checklist: true
        }
      });
    });

    return NextResponse.json(updatedVoiceNote);
  } catch (error) {
    console.error('Error analyzing voice note:', error);
    return NextResponse.json(
      { error: 'Error analyzing voice note' },
      { status: 500 }
    );
  }
} 