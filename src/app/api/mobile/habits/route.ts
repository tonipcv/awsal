import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().default('personal')
});

// GET /api/mobile/habits - Listar hábitos do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Buscar hábitos do usuário
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        progress: {
          where: month ? {
            date: {
              gte: new Date(month),
              lt: new Date(new Date(month).setMonth(new Date(month).getMonth() + 1))
            }
          } : undefined,
          orderBy: {
            date: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatar os dados para o mobile
    const formattedHabits = habits.map(habit => ({
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map(p => ({
        date: p.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
        isChecked: p.isChecked
      }))
    }));

    return NextResponse.json({
      success: true,
      habits: formattedHabits,
      total: formattedHabits.length
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/habits:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Error fetching habits' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/habits - Criar novo hábito
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { title, category = 'personal' } = createHabitSchema.parse(body);

    // Criar o hábito
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        title: title.trim(),
        category: category.trim(),
      },
      include: {
        progress: true
      }
    });

    // Formatar resposta
    const formattedHabit = {
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map(p => ({
        date: p.date.toISOString().split('T')[0],
        isChecked: p.isChecked
      }))
    };

    return NextResponse.json({
      success: true,
      habit: formattedHabit,
      message: 'Hábito criado com sucesso!'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/mobile/habits:', error);
    
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
      { error: 'Error creating habit' },
      { status: 500 }
    );
  }
} 