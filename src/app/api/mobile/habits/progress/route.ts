import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';
import { parseISO, startOfDay } from 'date-fns';

const updateProgressSchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
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

    // Converter a data para o início do dia para evitar problemas de timezone
    const targetDate = startOfDay(parseISO(date));

    // Verificar se já existe progresso para esta data
    const existingProgress = await prisma.habitProgress.findUnique({
      where: {
        habitId_date: {
          habitId,
          date: targetDate
        }
      }
    });

    let progress;
    let isUpdate = false;
    let newIsChecked = true; // Valor padrão para novo progresso

    if (existingProgress) {
      // Atualizar progresso existente (toggle)
      newIsChecked = !existingProgress.isChecked;
      progress = await prisma.habitProgress.update({
        where: {
          habitId_date: {
            habitId,
            date: targetDate
          }
        },
        data: {
          isChecked: newIsChecked
        }
      });
      isUpdate = true;
    } else {
      // Criar novo progresso
      progress = await prisma.habitProgress.create({
        data: {
          habitId,
          date: targetDate,
          isChecked: newIsChecked
        }
      });
    }

    // Buscar o estado atual do hábito para verificação
    const currentHabit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        progress: {
          where: {
            date: targetDate
          }
        }
      }
    });

    // Adicionar informações de debug em desenvolvimento
    const debug = process.env.NODE_ENV === 'development' ? {
      targetDate,
      existingProgress: existingProgress ? {
        id: existingProgress.id,
        wasChecked: existingProgress.isChecked
      } : null,
      newProgress: {
        id: progress.id,
        isChecked: progress.isChecked
      },
      currentHabitState: currentHabit
    } : undefined;

    return NextResponse.json({
      success: true,
      habitId,
      date: progress.date.toISOString().split('T')[0],
      isChecked: newIsChecked, // Usar o valor que sabemos que está correto
      message: isUpdate 
        ? `Hábito ${newIsChecked ? 'marcado' : 'desmarcado'} com sucesso!`
        : 'Progresso registrado com sucesso!',
      isUpdate,
      debug
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