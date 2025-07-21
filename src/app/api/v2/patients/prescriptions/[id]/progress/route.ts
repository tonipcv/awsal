import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';
import { DayStatus } from '@prisma/client';

const progressSchema = z.object({
  dayNumber: z.number().int().min(1),
  taskId: z.string(),
  status: z.enum(['PENDING', 'COMPLETED', 'MISSED', 'POSTPONED']),
  notes: z.string().optional(),
  scheduledDate: z.string()
});

// POST /api/v2/patients/prescriptions/[id]/progress - Registrar progresso
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { dayNumber, taskId, status, notes, scheduledDate } = progressSchema.parse(body);

    // Verificar se a prescrição existe e pertence ao usuário
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        id: params.id,
        user_id: user.id
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Verificar se a task existe
    const task = await prisma.protocolTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Criar ou atualizar o progresso
    const progress = await prisma.protocolTaskProgress.upsert({
      where: {
        prescriptionId_protocolTaskId_scheduledDate: {
          prescriptionId: params.id,
          protocolTaskId: taskId,
          scheduledDate: new Date(scheduledDate)
        }
      },
      create: {
        prescriptionId: params.id,
        protocolTaskId: taskId,
        dayNumber,
        status,
        notes,
        scheduledDate: new Date(scheduledDate),
        completedAt: status === 'COMPLETED' ? new Date() : null
      },
      update: {
        status,
        notes,
        completedAt: status === 'COMPLETED' ? new Date() : null
      }
    });

    // Atualizar métricas da prescrição
    const allProgress = await prisma.protocolTaskProgress.findMany({
      where: {
        prescriptionId: params.id
      }
    });

    const completedTasks = allProgress.filter(p => p.status === 'COMPLETED').length;
    const totalTasks = allProgress.length;
    const adherenceRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    await prisma.protocolPrescription.update({
      where: { id: params.id },
      data: {
        current_day: dayNumber,
        adherence_rate: adherenceRate,
        last_progress_date: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      progress,
      message: 'Progresso registrado com sucesso'
    });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/prescriptions/[id]/progress:', error);

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