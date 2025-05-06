import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const habitIdStr = segments[segments.length - 1];
    
    // Converter para número
    const habitId = parseInt(habitIdStr, 10);
    if (isNaN(habitId)) {
      return NextResponse.json({ error: 'ID de hábito inválido' }, { status: 400 });
    }

    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id
      },
      include: {
        progress: {
          select: {
            date: true,
            isChecked: true
          }
        }
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Hábito não encontrado' }, { status: 404 });
    }

    // Formatar a resposta
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
    console.error('Error in GET /api/mobile/habits/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar hábito' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const habitIdStr = segments[segments.length - 1];
    
    // Converter para número
    const habitId = parseInt(habitIdStr, 10);
    if (isNaN(habitId)) {
      return NextResponse.json({ error: 'ID de hábito inválido' }, { status: 400 });
    }

    const data = await request.json();
    if (!data.title || !data.category) {
      return NextResponse.json(
        { error: 'Título e categoria são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o hábito pertence ao usuário
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id
      }
    });

    if (!existingHabit) {
      return NextResponse.json({ error: 'Hábito não encontrado' }, { status: 404 });
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        title: data.title.trim(),
        category: data.category
      }
    });

    const formattedHabit = {
      id: updatedHabit.id,
      title: updatedHabit.title,
      category: updatedHabit.category
    };

    return NextResponse.json(formattedHabit);
  } catch (error) {
    console.error('Error in PUT /api/mobile/habits/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar hábito' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const habitIdStr = segments[segments.length - 1];
    
    // Converter para número
    const habitId = parseInt(habitIdStr, 10);
    if (isNaN(habitId)) {
      return NextResponse.json({ error: 'ID de hábito inválido' }, { status: 400 });
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findFirst({
      where: {
        id: habitId,
        userId: user.id
      }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Hábito não encontrado' }, { status: 404 });
    }

    // Excluir o progresso associado ao hábito
    await prisma.dayProgress.deleteMany({
      where: { habitId }
    });

    // Excluir o hábito
    await prisma.habit.delete({
      where: { id: habitId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/mobile/habits/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao excluir hábito' },
      { status: 500 }
    );
  }
} 