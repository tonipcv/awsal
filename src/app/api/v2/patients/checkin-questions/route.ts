import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

// GET /api/v2/patients/checkin-questions - Listar perguntas de check-in
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');

    if (!protocolId) {
      return NextResponse.json(
        { error: 'Protocol ID is required' },
        { status: 400 }
      );
    }

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: user.id,
        protocolId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
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
      success: true,
      questions,
      hasCheckinToday: existingResponses.length > 0,
      existingResponses: responseMap,
      date: today.toISOString().split('T')[0],
      message: 'Perguntas de check-in carregadas com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/checkin-questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
