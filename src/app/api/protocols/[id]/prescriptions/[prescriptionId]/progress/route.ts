import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { DayStatus } from '@prisma/client';

// GET /api/protocols/[id]/prescriptions/[prescriptionId]/progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; prescriptionId: string } }
) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId, prescriptionId } = params;

    // Buscar a prescrição com todos os dados necessários
    const prescription = await prisma.protocolPrescription.findUnique({
      where: {
        id: prescriptionId,
        protocolId: protocolId
      },
      include: {
        protocol: {
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
        },
        progressV2: true
      }
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescrição não encontrada' }, { status: 404 });
    }

    // Verificar permissão
    if (prescription.userId !== userId && prescription.prescribedBy !== userId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Calcular métricas de progresso
    const totalTasks = prescription.protocol.days.reduce((acc, day) => {
      return acc + day.sessions.reduce((sessionAcc, session) => {
        return sessionAcc + session.tasks.length;
      }, 0);
    }, 0);

    const completedTasks = prescription.progressV2.filter(
      p => p.status === DayStatus.COMPLETED
    ).length;

    // Calcular dias desde o início
    const startDate = prescription.actualStartDate || prescription.plannedStartDate;
    const today = new Date();
    const diffTime = today.getTime() - startDate.getTime();
    const currentDay = Math.max(1, Math.min(
      Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1,
      prescription.protocol.duration || 30
    ));

    // Calcular streak (dias consecutivos com tarefas completadas)
    let streakDays = 0;
    let currentStreak = 0;
    const progressByDate = new Map();

    // Agrupar progresso por data
    prescription.progressV2.forEach(progress => {
      const dateKey = progress.scheduledDate.toISOString().split('T')[0];
      const existing = progressByDate.get(dateKey) || { total: 0, completed: 0 };
      existing.total++;
      if (progress.status === DayStatus.COMPLETED) {
        existing.completed++;
      }
      progressByDate.set(dateKey, existing);
    });

    // Calcular streak atual
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateKey = checkDate.toISOString().split('T')[0];
      const dayProgress = progressByDate.get(dateKey);

      if (!dayProgress || dayProgress.completed < dayProgress.total) {
        break;
      }

      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);

      // Não contar dias futuros no streak
      if (checkDate > today) {
        currentStreak = 0;
        break;
      }

      // Não contar dias antes do início
      if (checkDate < startDate) {
        break;
      }
    }

    streakDays = currentStreak;

    // Calcular taxa de adesão
    const adherenceRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    // Última atividade
    const lastActivity = prescription.lastProgressDate || startDate;

    return NextResponse.json({
      adherenceRate,
      currentDay,
      completedTasks,
      totalTasks,
      lastActivity,
      streakDays,
      status: prescription.status
    });

  } catch (error) {
    console.error('Error fetching prescription progress:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar progresso da prescrição',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 