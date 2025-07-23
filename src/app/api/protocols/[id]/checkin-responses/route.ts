import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitResponseSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  }))
});

// GET - Buscar respostas do paciente para uma data específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: protocolId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Check if user has access to the protocol
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        OR: [
          { doctor_id: session.user.id },
          { prescriptions: { some: { user_id: session.user.id } } }
        ]
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
    }

    // If doctor, can see all patient responses
    // If patient, can only see their own responses
    const whereClause: any = {
      protocolId,
      date: new Date(date)
    };

    // Check if user is doctor through protocol
    const isDoctor = protocol.doctor_id === session.user.id;
    if (!isDoctor) {
      whereClause.userId = session.user.id;
    }

    const responses = await prisma.dailyCheckinResponse.findMany({
      where: whereClause,
      include: {
        question: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { question: { order: 'asc' } }
      ]
    });

    return NextResponse.json({ responses });

  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit daily check-in responses
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: protocolId } = await params;
    const body = await request.json();
    const { responses } = submitResponseSchema.parse(body);

    // Check if user has access to the protocol
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        OR: [
          { doctor_id: session.user.id },
          { prescriptions: { some: { user_id: session.user.id } } }
        ]
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 });
    }

    // Check if all questions belong to this protocol
    const questionIds = responses.map(r => r.questionId);
    const questions = await prisma.dailyCheckinQuestion.findMany({
      where: {
        id: { in: questionIds },
        protocolId
      }
    });

    if (questions.length !== questionIds.length) {
      return NextResponse.json({ error: 'One or more questions do not belong to this protocol' }, { status: 400 });
    }

    // Create responses
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdResponses = await Promise.all(
      responses.map(async (response) => {
        // Check if response already exists for today
        const existingResponse = await prisma.dailyCheckinResponse.findFirst({
          where: {
            questionId: response.questionId,
            userId: session.user.id,
            protocolId,
            date: today
          }
        });

        if (existingResponse) {
          // Update existing response
          return prisma.dailyCheckinResponse.update({
            where: { id: existingResponse.id },
            data: { answer: response.answer }
          });
        } else {
          // Create new response
          return prisma.dailyCheckinResponse.create({
            data: {
              id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              questionId: response.questionId,
              userId: session.user.id,
              protocolId,
              date: today,
              answer: response.answer
            }
          });
        }
      })
    );

    return NextResponse.json({ success: true, responses: createdResponses });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data format', details: error.errors }, { status: 400 });
    }
    console.error('Error submitting responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
