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
          { doctorId: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
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
    const isDoctor = protocol.doctorId === session.user.id;
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

    // Check if patient has access to protocol
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        protocolId,
        userId: session.user.id,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Protocol not found or not assigned' }, { status: 404 });
    }

    const body = await request.json();
    const { responses } = submitResponseSchema.parse(body);

    // Get today's date in local timezone
    const today = new Date();
    const todayString = today.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
    const todayDate = new Date(todayString);

    // Check if already responded today
    const existingResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: session.user.id,
        protocolId,
        date: todayDate
      }
    });

    let createdResponses;

    // If already responded today, update responses
    if (existingResponses.length > 0) {
      // Delete existing responses
      await prisma.dailyCheckinResponse.deleteMany({
        where: {
          userId: session.user.id,
          protocolId,
          date: todayDate
        }
      });
    }

    // Create new responses
    createdResponses = await prisma.dailyCheckinResponse.createMany({
      data: responses.map(response => ({
        userId: session.user.id,
        protocolId,
        questionId: response.questionId,
        answer: response.answer,
        date: todayDate
      }))
    });

    return NextResponse.json({ 
      success: true, 
      responses: createdResponses,
      message: existingResponses.length > 0 ? 'Check-in updated successfully!' : 'Check-in completed successfully!'
    }, { status: existingResponses.length > 0 ? 200 : 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error submitting responses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 