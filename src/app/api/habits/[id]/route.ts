import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair o ID da URL
    const segments = request.nextUrl.pathname.split('/');
    const habitId = segments[segments.length - 1];

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    const habitId = segments[segments.length - 1];

    if (!habitId || habitId === 'undefined') {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (habit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Deletar o hábito
    await prisma.habit.delete({
      where: { id: habitId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    const habitId = segments[segments.length - 1];

    if (!habitId || habitId === 'undefined') {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    if (habit.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, category } = body;

    // Atualizar o hábito
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        title,
        category
      }
    });

    return NextResponse.json({ data: updatedHabit });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}
