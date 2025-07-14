import OpenAI from 'openai';
import { minioClient, BUCKET_NAME } from './minio';
import { prisma } from './prisma';

export class TranscriptionService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async transcribeAudio(voiceNoteId: string): Promise<string> {
    try {
      // Get voice note
      const voiceNote = await prisma.voiceNote.findUnique({
        where: { id: voiceNoteId }
      });

      if (!voiceNote) {
        throw new Error('Voice note not found');
      }

      // Get audio file from MinIO
      const audioStream = await minioClient.getObject(BUCKET_NAME, voiceNote.audioUrl);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);

      // Transcribe using Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.mp3', { type: 'audio/mp3' }),
        model: 'whisper-1',
        language: 'pt',
        response_format: 'text'
      });

      // Update voice note with transcription
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: {
          transcription,
          status: 'TRANSCRIBED'
        }
      });

      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      
      // Update voice note status to error
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: {
          status: 'ERROR'
        }
      });

      throw new Error('Failed to transcribe audio');
    }
  }
} 