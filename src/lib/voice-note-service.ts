import { minioClient, BUCKET_NAME } from './minio';
import { prisma } from './prisma';
import { TranscriptionService } from './transcription-service';
import { VoiceAnalysisService } from './voice-analysis-service';
import { randomUUID } from 'crypto';

export class VoiceNoteService {
  private transcriptionService: TranscriptionService;
  private analysisService: VoiceAnalysisService;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.analysisService = new VoiceAnalysisService();
  }

  async createVoiceNote(
    audioFile: Buffer,
    duration: number,
    doctorId: string,
    patientId: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const filename = `voice-notes/${doctorId}/${randomUUID()}.mp3`;

      // Upload to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        filename,
        audioFile,
        audioFile.length,
        { 'Content-Type': 'audio/mp3' }
      );

      // Create voice note record
      const voiceNote = await prisma.voiceNote.create({
        data: {
          id: randomUUID(),
          doctorId,
          patientId,
          audioUrl: filename,
          duration,
          status: 'PROCESSING'
        }
      });

      // Start processing in background
      this.processVoiceNote(voiceNote.id).catch(error => {
        console.error('Error processing voice note:', error);
      });

      return voiceNote.id;
    } catch (error) {
      console.error('Error creating voice note:', error);
      throw new Error('Failed to create voice note');
    }
  }

  private async processVoiceNote(voiceNoteId: string): Promise<void> {
    try {
      // Step 1: Transcribe audio
      await this.transcriptionService.transcribeAudio(voiceNoteId);

      // Step 2: Analyze transcription
      await this.analysisService.analyzeTranscription(voiceNoteId);
    } catch (error) {
      console.error('Error processing voice note:', error);
      
      // Update voice note status to error
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: {
          status: 'ERROR'
        }
      });
    }
  }

  async getVoiceNote(voiceNoteId: string, userId: string) {
    const voiceNote = await prisma.voiceNote.findUnique({
      where: {
        id: voiceNoteId,
        OR: [
          { doctorId: userId },
          { patientId: userId }
        ]
      },
      include: {
        checklist: true
      }
    });

    if (!voiceNote) {
      throw new Error('Voice note not found or access denied');
    }

    return voiceNote;
  }

  async listVoiceNotes(userId: string, isDoctor: boolean) {
    return prisma.voiceNote.findMany({
      where: isDoctor ? { doctorId: userId } : { patientId: userId },
      include: {
        checklist: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async deleteVoiceNote(voiceNoteId: string, userId: string) {
    const voiceNote = await prisma.voiceNote.findUnique({
      where: {
        id: voiceNoteId,
        doctorId: userId // Only doctor can delete
      }
    });

    if (!voiceNote) {
      throw new Error('Voice note not found or access denied');
    }

    // Delete from MinIO
    await minioClient.removeObject(BUCKET_NAME, voiceNote.audioUrl);

    // Delete from database (cascade will handle checklist)
    await prisma.voiceNote.delete({
      where: { id: voiceNoteId }
    });
  }
} 