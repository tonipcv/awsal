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

// POST /api/v2/patients/checkin-responses - Registrar resposta de check-in
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { protocolId, responses } = submitResponseSchema.parse(body);

    // Verificar se o paciente tem acesso ao protocolo
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocol_id: protocolId,
        user_id: user.id,
        status: 'ACTIVE'
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Protocol not found or not assigned' },
        { status: 404 }
      );
    }

    // Verificar se as perguntas existem
    const questions = await prisma.dailyCheckinQuestion.findMany({
      where: {
        id: { in: responses.map(r => r.questionId) },
        protocolId,
        isActive: true
      }
    });

    if (questions.length !== responses.length) {
      return NextResponse.json(
        { error: 'Invalid questions provided' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já respondeu hoje
    const existingResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: user.id,
        protocolId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Criar ou atualizar respostas
    const createdResponses = await Promise.all(
      responses.map(async (response) => {
        const existingResponse = existingResponses.find(
          r => r.questionId === response.questionId
        );

        if (existingResponse) {
          return prisma.dailyCheckinResponse.update({
            where: { id: existingResponse.id },
            data: { answer: response.answer },
            include: {
              question: true
            }
          });
        }

        return prisma.dailyCheckinResponse.create({
          data: {
            userId: user.id,
            protocolId,
            questionId: response.questionId,
            answer: response.answer,
            date: today
          },
          include: {
            question: true
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      responses: createdResponses,
      message: existingResponses.length > 0
        ? 'Check-in atualizado com sucesso!'
        : 'Check-in registrado com sucesso!',
      isUpdate: existingResponses.length > 0
    }, { status: existingResponses.length > 0 ? 200 : 201 });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/checkin-responses:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 