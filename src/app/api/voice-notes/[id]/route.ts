import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VoiceNoteService } from '@/lib/voice-note-service';

const voiceNoteService = new VoiceNoteService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await voiceNoteService.deleteVoiceNote(params.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice note:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice note' },
      { status: 500 }
    );
  }
} 