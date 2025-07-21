import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; progressId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar se o progresso existe e pertence ao usuário
    const progress = await prisma.protocolTaskProgress.findFirst({
      where: {
        id: params.progressId,
        prescription: {
          id: params.id,
          user_id: user.id
        }
      }
    });

    if (!progress) {
      return NextResponse.json(
        { error: 'Progresso não encontrado' },
        { status: 404 }
      );
    }

    // Alternar o status
    const isCompleted = progress.status === 'COMPLETED';
    const updatedProgress = await prisma.protocolTaskProgress.update({
      where: { id: params.progressId },
      data: {
        status: isCompleted ? 'PENDING' : 'COMPLETED',
        completedAt: isCompleted ? null : new Date()
      }
    });

    // Atualizar taxa de aderência da prescrição
    const totalTasks = await prisma.protocolTaskProgress.count({
      where: {
        prescriptionId: params.id
      }
    });

    const completedTasks = await prisma.protocolTaskProgress.count({
      where: {
        prescriptionId: params.id,
        status: 'COMPLETED'
      }
    });

    const adherenceRate = Math.round((completedTasks / totalTasks) * 100);

    await prisma.protocolPrescription.update({
      where: { id: params.id },
      data: {
        adherence_rate: adherenceRate,
        last_progress_date: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      progress: updatedProgress,
      adherenceRate,
      message: `Tarefa ${isCompleted ? 'desmarcada' : 'marcada'} como concluída`
    });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/prescriptions/[id]/progress/[progressId]/toggle:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 