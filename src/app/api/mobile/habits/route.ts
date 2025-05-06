import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const month = url.searchParams.get('month') || new Date().toISOString();
    const start = startOfMonth(new Date(month));
    const end = endOfMonth(new Date(month));

    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id
      },
      include: {
        progress: {
          where: {
            date: {
              gte: start,
              lte: end
            }
          },
          select: {
            date: true,
            isChecked: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Formatar os dados para o formato esperado pelo frontend
    const formattedHabits = habits.map(habit => ({
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map(p => ({
        date: p.date.toISOString().split('T')[0],
        isChecked: p.isChecked
      }))
    }));

    return NextResponse.json(formattedHabits);
  } catch (error) {
    console.error('Error in GET /api/mobile/habits:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar hábitos', data: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const data = await request.json();
    
    if (!data.title || !data.category) {
      return NextResponse.json(
        { error: 'Título e categoria são obrigatórios' },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        title: data.title.trim(),
        category: data.category,
        userId: user.id
      }
    });

    const formattedHabit = {
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: []
    };

    return NextResponse.json(formattedHabit, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/mobile/habits:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json({ 
      error: 'Erro ao criar hábito',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 