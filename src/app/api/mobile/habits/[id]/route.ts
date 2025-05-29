import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const habitId = id;

    if (!habitId || habitId === 'undefined') {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: session.user.id
      },
      include: {
        progress: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    // Formatar o hábito para o formato esperado pelo frontend
    const formattedHabit = {
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map((p: any) => ({
        date: p.date.toISOString().split('T')[0],
        isChecked: p.isChecked
      }))
    };

    return NextResponse.json(formattedHabit);
  } catch (error) {
    console.error('Error fetching habit:', error);
    return NextResponse.json(
      { error: 'Error fetching habit' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const habitId = id;

    if (!habitId || habitId === 'undefined') {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    const { title, category } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: session.user.id
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { 
        title: title.trim(),
        category: category || habit.category // Manter categoria atual se não fornecida
      },
      include: {
        progress: true
      }
    });

    // Formatar o hábito para o formato esperado pelo frontend
    const formattedHabit = {
      id: updatedHabit.id,
      title: updatedHabit.title,
      category: updatedHabit.category,
      progress: updatedHabit.progress.map((p: any) => ({
        date: p.date.toISOString().split('T')[0],
        isChecked: p.isChecked
      }))
    };

    return NextResponse.json(formattedHabit);
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: 'Error updating habit' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const habitId = id;

    if (!habitId || habitId === 'undefined') {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: session.user.id
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id: habitId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json(
      { error: 'Error deleting habit' },
      { status: 500 }
    );
  }
} 