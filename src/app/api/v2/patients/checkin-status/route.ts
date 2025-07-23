import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

// GET /api/v2/patients/checkin-status - Verificar status do check-in diário
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
        { 
          success: false, 
          error: 'Protocol ID is required' 
        },
        { status: 400 }
      );
    }

    // Verificar se o paciente tem acesso ao protocolo
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocol_id: protocolId,
        user_id: user.id,
        status: 'ACTIVE'
      },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Protocol not found or not assigned' 
        },
        { status: 404 }
      );
    }

    // Verificar se já fez check-in hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckin = await prisma.dailyCheckinResponse.findFirst({
      where: {
        userId: user.id,
        protocolId: protocolId,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            type: true
          }
        }
      }
    });

    // Buscar todas as respostas de hoje se existirem
    const todayResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: user.id,
        protocolId: protocolId,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            type: true,
            order: true
          }
        }
      },
      orderBy: {
        question: {
          order: 'asc'
        }
      }
    });

    // Buscar total de perguntas do protocolo
    const totalQuestions = await prisma.dailyCheckinQuestion.count({
      where: {
        protocolId: protocolId,
        isActive: true
      }
    });

    // Calcular progresso do protocolo
    const protocolStartDate = prescription.planned_start_date || prescription.actual_start_date;
    const protocolEndDate = prescription.planned_end_date || prescription.actual_end_date;
    
    let currentDay = 1;
    let totalDays = 30; // Default
    let progressPercentage = 0;

    if (protocolStartDate) {
      const daysDiff = Math.floor((today.getTime() - new Date(protocolStartDate).getTime()) / (1000 * 60 * 60 * 24));
      currentDay = Math.max(1, daysDiff + 1);
      
      if (protocolEndDate) {
        totalDays = Math.floor((new Date(protocolEndDate).getTime() - new Date(protocolStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        progressPercentage = Math.min(100, Math.max(0, (currentDay / totalDays) * 100));
      }
    }

    // Buscar histórico de check-ins (últimos 7 dias)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCheckins = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: user.id,
        protocolId: protocolId,
        date: {
          gte: sevenDaysAgo,
          lt: tomorrow
        }
      },
      select: {
        date: true,
        answer: true,
        question: {
          select: {
            question: true,
            type: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Agrupar check-ins por data
    const checkinHistory = recentCheckins.reduce((acc, response) => {
      const dateKey = response.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        question: response.question.question,
        answer: response.answer,
        type: response.question.type
      });
      return acc;
    }, {} as Record<string, Array<{ question: string; answer: string; type: string }>>);

    return NextResponse.json({
      success: true,
      data: {
        hasCheckinToday: todayResponses.length > 0,
        completedQuestions: todayResponses.length,
        totalQuestions: totalQuestions,
        isComplete: todayResponses.length >= totalQuestions,
        date: today.toISOString().split('T')[0],
        protocol: {
          id: prescription.protocol.id,
          name: prescription.protocol.name,
          description: prescription.protocol.description
        },
        progress: {
          currentDay: currentDay,
          totalDays: totalDays,
          percentage: Math.round(progressPercentage)
        },
        todayResponses: todayResponses.map(response => ({
          questionId: response.question.id,
          question: response.question.question,
          answer: response.answer,
          type: response.question.type,
          order: response.question.order
        })),
        recentHistory: checkinHistory
      },
      message: 'Status do check-in carregado com sucesso'
    });

  } catch (error) {
    console.error('Error in GET /api/v2/patients/checkin-status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 