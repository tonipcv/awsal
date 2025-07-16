import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/habits - Listar hábitos do usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Buscar hábitos do usuário
    const habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id,
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

    // Formatar os dados para o frontend
    const formattedHabits = habits.map(habit => ({
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map(p => ({
        date: p.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
        isChecked: p.isChecked
      }))
    }));

    return NextResponse.json(formattedHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/habits - Criar novo hábito
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category = 'personal' } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Criar o hábito
    const habit = await prisma.habit.create({
      data: {
        userId: session.user.id,
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

    return NextResponse.json(formattedHabit, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 