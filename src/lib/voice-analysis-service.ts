import OpenAI from 'openai';
import { prisma } from './prisma';

interface AnalysisResult {
  summary: string;
  checklist: Array<{
    title: string;
    description?: string;
    type: 'exam' | 'medication' | 'referral' | 'followup';
    status: 'pending' | 'completed';
    dueDate?: string;
  }>;
}

export class VoiceAnalysisService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeTranscription(voiceNoteId: string): Promise<AnalysisResult> {
    try {
      // Get voice note with transcription
      const voiceNote = await prisma.voiceNote.findUnique({
        where: { id: voiceNoteId }
      });

      if (!voiceNote || !voiceNote.transcription) {
        throw new Error('Voice note or transcription not found');
      }

      // Analyze using GPT-4
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Você é um assistente médico especializado em análise de prontuários.
Analise a transcrição do áudio e extraia:

1. RESUMO CLÍNICO
- Queixa principal
- Sintomas relatados
- Observações importantes
- Decisões tomadas

2. CHECKLIST DE AÇÕES
Para cada item identificado, especifique:
- Título da ação
- Descrição detalhada (opcional)
- Tipo (exam, medication, referral, followup)
- Status (sempre pending)
- Data limite (se mencionada)

Mantenha a terminologia médica exata e organize as informações de forma clara.

Retorne um objeto JSON com a seguinte estrutura:
{
  "summary": "Texto do resumo clínico",
  "checklist": [
    {
      "title": "Título da ação",
      "description": "Descrição detalhada",
      "type": "exam|medication|referral|followup",
      "status": "pending",
      "dueDate": "YYYY-MM-DD" (opcional)
    }
  ]
}`
          },
          {
            role: "user",
            content: voiceNote.transcription
          }
        ],
        temperature: 0.1
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}') as AnalysisResult;

      // Update voice note with summary
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: {
          summary: analysis.summary,
          status: 'ANALYZED'
        }
      });

      // Create checklist
      await prisma.voiceNoteChecklist.create({
        data: {
          voiceNoteId,
          items: analysis.checklist
        }
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing transcription:', error);
      
      // Update voice note status to error
      await prisma.voiceNote.update({
        where: { id: voiceNoteId },
        data: {
          status: 'ERROR'
        }
      });

      throw new Error('Failed to analyze transcription');
    }
  }
} 