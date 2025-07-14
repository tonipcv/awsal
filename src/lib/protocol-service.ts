import { prisma } from '@/lib/prisma';

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

export class ProtocolService {
  async createFromPDF(data: ProtocolData, doctorId: string) {
    try {
      // Create protocol
      const protocol = await prisma.protocol.create({
        data: {
          name: data.name,
          description: data.description,
          doctorId: doctorId,
          days: {
            create: data.days.map(day => ({
              dayNumber: day.dayNumber,
              title: day.title,
              sessions: {
                create: day.sessions.map((session, sessionIndex) => ({
                  title: session.name,
                  sessionNumber: sessionIndex + 1,
                  tasks: {
                    create: session.tasks.map((task, taskIndex) => ({
                      title: task.title,
                      description: task.description,
                      orderIndex: taskIndex + 1,
                    }))
                  }
                }))
              }
            }))
          }
        },
        include: {
          days: {
            include: {
              sessions: {
                include: {
                  tasks: true
                }
              }
            }
          }
        }
      });

      return protocol;
    } catch (error) {
      console.error('Error creating protocol from PDF:', error);
      throw new Error('Failed to create protocol from PDF data');
    }
  }
} 