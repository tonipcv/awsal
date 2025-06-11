import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const submitResponseSchema = z.object({
  protocolId: z.string(),
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  }))
});

// GET - Buscar perguntas de check-in e status para um protocolo específico
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!protocolId) {
      return NextResponse.json(
        { error: 'Protocol ID is required' },
        { status: 400 }
      );
    }

    // Verificar se o paciente tem acesso ao protocolo
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        protocolId,
        userId: user.id,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Protocol not found or not assigned' },
        { status: 404 }
      );
    }

    // Buscar perguntas do protocolo
    const questions = await prisma.dailyCheckinQuestion.findMany({
      where: {
        protocolId,
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    // Verificar se já respondeu hoje
    const existingResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: user.id,
        protocolId,
        date: new Date(date)
      },
      include: {
        question: true
      }
    });

    // Mapear respostas existentes
    const responseMap = existingResponses.reduce((acc, response) => {
      acc[response.questionId] = response.answer;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      questions,
      hasCheckinToday: existingResponses.length > 0,
      existingResponses: responseMap,
      date
    });

  } catch (error) {
    console.error('Error in GET /api/mobile/daily-checkin:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Error fetching check-in data' },
      { status: 500 }
    );
  }
}

// POST - Submeter respostas do check-in diário
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { protocolId, responses } = submitResponseSchema.parse(body);

    // Verificar se o paciente tem acesso ao protocolo
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        protocolId,
        userId: user.id,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Protocol not found or not assigned' },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já respondeu hoje
    const existingResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: user.id,
        protocolId,
        date: today
      }
    });

    let createdResponses;

    if (existingResponses.length > 0) {
      // Atualizar respostas existentes
      createdResponses = await prisma.$transaction(
        responses.map(response => {
          const existingResponse = existingResponses.find(er => er.questionId === response.questionId);
          
          if (existingResponse) {
            // Atualizar resposta existente
            return prisma.dailyCheckinResponse.update({
              where: { id: existingResponse.id },
              data: { answer: response.answer },
              include: { question: true }
            });
          } else {
            // Criar nova resposta (caso tenha sido adicionada uma nova pergunta)
            return prisma.dailyCheckinResponse.create({
              data: {
                id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: user.id,
                questionId: response.questionId,
                protocolId,
                date: today,
                answer: response.answer
              },
              include: { question: true }
            });
          }
        })
      );
    } else {
      // Criar todas as respostas em uma transação (primeira vez)
      createdResponses = await prisma.$transaction(
        responses.map(response => 
          prisma.dailyCheckinResponse.create({
            data: {
              id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: user.id,
              questionId: response.questionId,
              protocolId,
              date: today,
              answer: response.answer
            },
            include: {
              question: true
            }
          })
        )
      );
    }

    return NextResponse.json({ 
      success: true, 
      responses: createdResponses,
      message: existingResponses.length > 0 ? 'Check-in updated successfully!' : 'Check-in completed successfully!',
      isUpdate: existingResponses.length > 0
    }, { status: existingResponses.length > 0 ? 200 : 201 });

  } catch (error: any) {
    console.error('Error in POST /api/mobile/daily-checkin:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error submitting check-in' },
      { status: 500 }
    );
  }
} 