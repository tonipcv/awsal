import OpenAI from 'openai';
import { Protocol, ProtocolDay, ProtocolSession, ProtocolTask } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ProtocolAnalysis {
  name: string;
  description: string;
  duration: number;
  days: {
    dayNumber: number;
    title: string;
    sessions: {
      name: string;
      tasks: {
        title: string;
        description?: string;
        hasMoreInfo?: boolean;
        videoUrl?: string;
        fullExplanation?: string;
      }[];
    }[];
  }[];
  recommendedProducts?: string[];
}

export class AIService {
  static async analyzePDFContent(text: string): Promise<ProtocolAnalysis> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a specialized medical protocol analyzer with expertise in structuring medical treatment protocols. Your task is to carefully analyze PDF content and create a well-organized protocol structure.

CRITICAL REQUIREMENTS:
1. EXACT EXTRACTION: Never modify or paraphrase medical terms, dosages, or instructions
2. MAINTAIN SEQUENCE: Preserve the exact order of steps as presented in the document
3. NO INFERENCE: Do not add information that isn't explicitly stated in the text
4. MEDICAL PRECISION: Keep all medical terminology, measurements, and timings exactly as written

STRUCTURAL GUIDELINES:
1. Days: Identify clear day-by-day breakdowns
   - If days aren't explicitly numbered, look for temporal markers
   - Each day must have a clear title and purpose

2. Sessions: Group related tasks into logical sessions
   - Morning/Evening routines
   - Treatment sessions
   - Medication schedules
   - Care procedures

3. Tasks: Break down instructions into clear, actionable steps
   - Maintain exact medical terminology
   - Include all specified durations and frequencies
   - Preserve any warnings or special instructions
   - Keep product names and dosages exactly as written

4. Products: Identify any mentioned products or medications
   - Extract exact product names
   - Include any specific usage instructions
   - Note if products are required or optional

VALIDATION RULES:
1. All extracted text must exist in the original document
2. Day numbers must follow the sequence in the document
3. Each day must have at least one session
4. Each session must have at least one task
5. Task descriptions must be complete and precise
6. No placeholder or generated content allowed

If any section is unclear or ambiguous in the source document:
1. Use the exact text from the PDF
2. Do not attempt to clarify or interpret
3. Maintain the original wording
4. Flag any potential ambiguities in the description`
          },
          {
            role: "user",
            content: `Analyze this medical protocol content and extract the exact structure, maintaining all medical terminology and instructions precisely as written:\n\n${text}`
          }
        ],
        temperature: 0.1, // Reduced temperature for more consistent output
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Validate and structure the response
      return this.validateAndStructureAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing PDF content:', error);
      throw new Error('Failed to analyze PDF content');
    }
  }

  private static validateAndStructureAnalysis(analysis: any): ProtocolAnalysis {
    // Validate required fields
    if (!analysis.name?.trim()) {
      throw new Error('Protocol name is required and cannot be empty');
    }
    if (!analysis.description?.trim()) {
      throw new Error('Protocol description is required and cannot be empty');
    }
    if (!Array.isArray(analysis.days) || analysis.days.length === 0) {
      throw new Error('Protocol must have at least one day');
    }

    // Validate and structure days
    const structuredDays = analysis.days.map((day: any, dayIndex: number) => {
      // Validate day structure
      if (!day.dayNumber || typeof day.dayNumber !== 'number') {
        throw new Error(`Invalid day number at day ${dayIndex + 1}`);
      }
      if (!day.title?.trim()) {
        throw new Error(`Day title is required at day ${dayIndex + 1}`);
      }
      if (!Array.isArray(day.sessions)) {
        throw new Error(`Sessions must be an array at day ${dayIndex + 1}`);
      }
      if (day.sessions.length === 0) {
        throw new Error(`Day ${dayIndex + 1} must have at least one session`);
      }

      // Validate and structure sessions
      const structuredSessions = day.sessions.map((session: any, sessionIndex: number) => {
        // Validate session structure
        if (!session.name?.trim()) {
          throw new Error(`Session name is required at day ${dayIndex + 1}, session ${sessionIndex + 1}`);
        }
        if (!Array.isArray(session.tasks)) {
          throw new Error(`Tasks must be an array at day ${dayIndex + 1}, session ${sessionIndex + 1}`);
        }
        if (session.tasks.length === 0) {
          throw new Error(`Session must have at least one task at day ${dayIndex + 1}, session ${sessionIndex + 1}`);
        }

        // Validate and structure tasks
        const structuredTasks = session.tasks.map((task: any, taskIndex: number) => {
          // Validate task structure
          if (!task.title?.trim()) {
            throw new Error(`Task title is required at day ${dayIndex + 1}, session ${sessionIndex + 1}, task ${taskIndex + 1}`);
          }

          // Return structured task with defaults for optional fields
          return {
            title: task.title.trim(),
            description: task.description?.trim() || '',
            hasMoreInfo: Boolean(task.hasMoreInfo),
            videoUrl: task.videoUrl?.trim() || '',
            fullExplanation: task.fullExplanation?.trim() || ''
          };
        });

        // Return structured session
        return {
          name: session.name.trim(),
          tasks: structuredTasks
        };
      });

      // Return structured day
      return {
        dayNumber: day.dayNumber,
        title: day.title.trim(),
        sessions: structuredSessions
      };
    });

    // Validate day sequence
    const dayNumbers = structuredDays.map((day: { dayNumber: number }) => day.dayNumber);
    const expectedSequence = Array.from({ length: dayNumbers.length }, (_, i) => i + 1);
    const isSequential = dayNumbers.every((num: number, i: number) => num === expectedSequence[i]);
    if (!isSequential) {
      throw new Error('Day numbers must be sequential starting from 1');
    }

    // Validate recommended products if present
    const recommendedProducts = Array.isArray(analysis.recommendedProducts) 
      ? analysis.recommendedProducts.filter((product: any) => typeof product === 'string' && product.trim())
      : [];

    // Return final structured and validated protocol
    return {
      name: analysis.name.trim(),
      description: analysis.description.trim(),
      duration: structuredDays.length,
      days: structuredDays,
      recommendedProducts
    };
  }
} 