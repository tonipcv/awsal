import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/habits/progress - Atualizar progresso do hábito
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { habitId, date } = body;

    if (!habitId || !date) {
      return NextResponse.json({ error: 'Habit ID and date are required' }, { status: 400 });
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: session.user.id,
        isActive: true,
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
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
      habitId,
      date: progress.date.toISOString().split('T')[0],
      isChecked: progress.isChecked
    });
  } catch (error) {
    console.error('Error updating habit progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 