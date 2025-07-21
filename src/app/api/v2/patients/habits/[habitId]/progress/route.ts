import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';
import { parseISO, startOfDay } from 'date-fns';

const updateProgressSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
});

// POST /api/v2/patients/habits/[habitId]/progress - Registrar progresso
export async function POST(
  request: NextRequest,
  { params }: { params: { habitId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { date } = updateProgressSchema.parse(body);

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findFirst({
      where: {
        id: params.habitId,
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
          habitId: params.habitId,
          date: targetDate
        }
      }
    });

    let progress;
    let isUpdate = false;
    let newIsChecked = true;

    if (existingProgress) {
      // Atualizar progresso existente (toggle)
      newIsChecked = !existingProgress.isChecked;
      progress = await prisma.habitProgress.update({
        where: {
          habitId_date: {
            habitId: params.habitId,
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
          habitId: params.habitId,
          date: targetDate,
          isChecked: newIsChecked
        }
      });
    }

    return NextResponse.json({
      success: true,
      habitId: params.habitId,
      date: progress.date.toISOString().split('T')[0],
      isChecked: newIsChecked,
      message: isUpdate 
        ? `Hábito ${newIsChecked ? 'marcado' : 'desmarcado'} com sucesso!`
        : 'Progresso registrado com sucesso!',
      isUpdate
    });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/habits/[habitId]/progress:', error);

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