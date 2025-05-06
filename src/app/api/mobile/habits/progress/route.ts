import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    
    let habitIdRaw: string | null = null;
    let habitIdFromUrl = false;
    
    // Verificar se o ID está na URL
    if (pathParts.length >= 5 && pathParts[3] !== 'progress') {
      habitIdRaw = pathParts[3];
      habitIdFromUrl = true;
    }
    
    let date: string;
    
    if (habitIdFromUrl) {
      // Se o ID está na URL, só precisamos da data no corpo
      const body = await request.json();
      date = body.date;
    } else {
      // Se não, esperamos ID e data no corpo
      const { habitId, date: bodyDate } = await request.json();
      habitIdRaw = habitId;
      date = bodyDate;
    }
    
    // Validação de campos obrigatórios
    if (!habitIdRaw || !date) {
      return NextResponse.json(
        { error: 'ID do hábito e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Converter ID do hábito para número
    const habitId = parseInt(habitIdRaw, 10);
    if (isNaN(habitId)) {
      return NextResponse.json(
        { error: 'ID do hábito inválido' },
        { status: 400 }
      );
    }

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true }
    });

    if (!habit) {
      return NextResponse.json({ error: 'Hábito não encontrado' }, { status: 404 });
    }

    if (habit.userId !== user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const existingProgress = await prisma.dayProgress.findFirst({
      where: {
        habitId,
        date: new Date(date)
      }
    });

    if (existingProgress) {
      const progress = await prisma.dayProgress.update({
        where: { id: existingProgress.id },
        data: { isChecked: !existingProgress.isChecked }
      });
      return NextResponse.json({ data: progress });
    } else {
      const progress = await prisma.dayProgress.create({
        data: {
          habitId,
          date: new Date(date),
          isChecked: true
        }
      });
      return NextResponse.json({ data: progress });
    }
  } catch (error) {
    console.error('Error in POST /api/mobile/habits/progress:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar progresso' },
      { status: 500 }
    );
  }
} 