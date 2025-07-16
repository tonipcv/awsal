import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const updateHabitSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().optional()
});

// PUT /api/mobile/habits/[id] - Atualizar hábito
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { title, category } = updateHabitSchema.parse(body);

    // Verificar se o hábito pertence ao usuário
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      }
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Hábito não encontrado' },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      habit: formattedHabit,
      message: 'Hábito atualizado com sucesso!'
    });
  } catch (error: any) {
    console.error('Error in PUT /api/mobile/habits/[id]:', error);
    
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
      { error: 'Error updating habit' },
      { status: 500 }
    );
  }
}

// DELETE /api/mobile/habits/[id] - Deletar hábito
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar se o hábito pertence ao usuário
    const existingHabit = await prisma.habit.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      }
    });

    if (!existingHabit) {
      return NextResponse.json(
        { error: 'Hábito não encontrado' },
        { status: 404 }
      );
    }

    // Deletar o hábito (cascade irá deletar o progresso também)
    await prisma.habit.delete({
      where: {
        id: params.id,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Hábito deletado com sucesso!'
    });
  } catch (error) {
    console.error('Error in DELETE /api/mobile/habits/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Error deleting habit' },
      { status: 500 }
    );
  }
} 