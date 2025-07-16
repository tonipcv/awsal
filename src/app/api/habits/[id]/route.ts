import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/habits/[id] - Atualizar hábito
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verificar se o hábito pertence ao usuário
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      }
    });

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Atualizar o hábito
    const habit = await prisma.habit.update({
      where: {
        id: params.id,
      },
      data: {
        title: title.trim(),
        category: category?.trim() || existingHabit.category,
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

    return NextResponse.json(formattedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/habits/[id] - Deletar hábito
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o hábito pertence ao usuário
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      }
    });

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Deletar o hábito (cascade irá deletar o progresso também)
    await prisma.habit.delete({
      where: {
        id: params.id,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 