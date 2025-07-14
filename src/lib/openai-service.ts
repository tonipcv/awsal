import OpenAI from 'openai';

interface ProtocolData {
  name: string;
  description: string;
  days: Array<{
    dayNumber: number;
    title: string;
    sessions: Array<{
      name: string;
      tasks: Array<{
        title: string;
        description?: string;
        hasMoreInfo?: boolean;
        videoUrl?: string;
        fullExplanation?: string;
      }>;
    }>;
  }>;
}

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeProtocolPDF(text: string): Promise<ProtocolData> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a medical protocol analyzer specialized in extracting structured information from medical protocols. Your task is to carefully analyze PDF content and create a well-organized protocol structure.

IMPORTANT RULES:
1. Focus on identifying clear day-by-day instructions and tasks
2. Maintain medical terminology exactly as written
3. Group related tasks into logical sessions
4. Keep task descriptions clear and actionable
5. Identify any specific product recommendations
6. Preserve any timing or scheduling information
7. Extract any special instructions or warnings
8. Maintain the original sequence of steps
9. Do not add or infer information not present in the text
10. If something is unclear, use the exact text from the PDF

Your response MUST be a valid JSON object with this structure:
{
  "name": "Protocol Name (use the main title or first heading)",
  "description": "Brief but complete protocol overview",
  "days": [
    {
      "dayNumber": 1,
      "title": "Day 1 Title (if specified, otherwise use 'Day 1')",
      "sessions": [
        {
          "name": "Session Name (group related tasks, e.g., 'Morning Routine', 'Evening Care')",
          "tasks": [
            {
              "title": "Task Title (clear, actionable instruction)",
              "description": "Detailed task description",
              "hasMoreInfo": false,
              "videoUrl": "",
              "fullExplanation": ""
            }
          ]
        }
      ]
    }
  ]
}

VALIDATION REQUIREMENTS:
1. All text fields must use the exact wording from the PDF where possible
2. Day numbers must be sequential
3. Each day must have at least one session
4. Each session must have at least one task
5. Task titles must be clear and actionable
6. Do not generate placeholder content`
          },
          {
            role: "user",
            content: `Extract the protocol information from this text and return it as JSON. Remember to preserve medical terminology and maintain the exact sequence of steps:\n\n${text}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      const protocolData = JSON.parse(response.choices[0].message.content || '{}');
      
      // Enhanced validation
      if (!protocolData.name || !protocolData.description || !Array.isArray(protocolData.days)) {
        throw new Error('Invalid protocol data structure');
      }

      // Validate days structure
      protocolData.days.forEach((day, index) => {
        if (!day.dayNumber || !Array.isArray(day.sessions)) {
          throw new Error(`Invalid day structure at day ${index + 1}`);
        }
        if (day.sessions.length === 0) {
          day.sessions = [{
            name: "Main Session",
            tasks: [{
              title: "Review and edit protocol content",
              description: "Please review and structure the content for this day",
              hasMoreInfo: false,
              videoUrl: "",
              fullExplanation: ""
            }]
          }];
        }
      });

      return protocolData;
    } catch (error) {
      console.error('Error analyzing protocol PDF:', error);
      return this.createFallbackProtocol(text);
    }
  }

  private createFallbackProtocol(text: string): ProtocolData {
    // Create a basic protocol structure when OpenAI is not available
    const truncatedText = text.substring(0, 200);
    
    return {
      name: "Protocol from PDF",
      description: `Protocol created from uploaded PDF. Content preview: ${truncatedText}...`,
      days: [
        {
          dayNumber: 1,
          title: "Day 1",
          sessions: [
            {
              name: "Review Protocol",
              tasks: [
                {
                  title: "Review uploaded PDF content",
                  description: "Please review and edit the protocol content based on the uploaded PDF",
                  hasMoreInfo: false,
                  videoUrl: "",
                  fullExplanation: ""
                }
              ]
            }
          ]
        }
      ]
    };
  }
} 