import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const updateProgressSchema = z.object({
  habitId: z.string(),
  date: z.string()
});

// POST /api/mobile/habits/progress - Atualizar progresso do hábito
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { habitId, date } = updateProgressSchema.parse(body);

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id,
        isActive: true,
      }
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Hábito não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe progresso para esta data
    const existingProgress = await prisma.habitProgress.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: new Date(date)
        }
      }
    });

    let progress;
    let isUpdate = false;

    if (existingProgress) {
      // Atualizar progresso existente (toggle)
      progress = await prisma.habitProgress.update({
        where: {
          habitId_date: {
            habitId,
            date: new Date(date)
          }
        },
        data: {
          isChecked: !existingProgress.isChecked
        }
      });
      isUpdate = true;
    } else {
      // Criar novo progresso
      progress = await prisma.habitProgress.create({
        data: {
          habitId,
          date: new Date(date),
          isChecked: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      habitId,
      date: progress.date.toISOString().split('T')[0],
      isChecked: progress.isChecked,
      message: isUpdate ? 'Progresso atualizado com sucesso!' : 'Progresso marcado com sucesso!',
      isUpdate
    });
  } catch (error: any) {
    console.error('Error in POST /api/mobile/habits/progress:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error updating habit progress' },
      { status: 500 }
    );
  }
} 