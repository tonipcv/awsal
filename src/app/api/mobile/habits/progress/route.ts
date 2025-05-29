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
    
    let habitIdRaw: string | number | null = null;
    let habitIdFromUrl = false;
    
    console.log("Processando requisição:", {
      url: url.pathname,
      pathParts,
      method: request.method
    });
    
    // Verificar se o ID está na URL
    if (pathParts.length >= 5 && pathParts[3] !== 'progress') {
      habitIdRaw = pathParts[3];
      habitIdFromUrl = true;
      console.log("ID encontrado na URL:", habitIdRaw);
    }
    
    let date: string;
    let requestBody;
    
    try {
      requestBody = await request.json();
      console.log("Corpo da requisição:", requestBody);
    } catch (error) {
      console.error("Erro ao analisar o corpo da requisição:", error);
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }
    
    if (habitIdFromUrl) {
      // Se o ID está na URL, só precisamos da data no corpo
      date = requestBody.date;
    } else {
      // Se não, esperamos ID e data no corpo
      habitIdRaw = requestBody.habitId;
      date = requestBody.date;
      console.log("ID encontrado no corpo:", habitIdRaw);
    }
    
    // Validação de campos obrigatórios
    if (!habitIdRaw || !date) {
      console.error("Campos obrigatórios faltando:", { habitIdRaw, date });
      return NextResponse.json(
        { error: 'ID do hábito e data são obrigatórios' },
        { status: 400 }
      );
    }

    let habitId: string;
    
    if (typeof habitIdRaw === 'string') {
      habitId = habitIdRaw;
    } else if (Array.isArray(habitIdRaw)) {
      habitId = habitIdRaw[0];
    } else {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }

    if (!habitId || habitId === 'undefined') {
      return NextResponse.json({ error: 'Invalid habit ID' }, { status: 400 });
    }
    
    console.log("ID do hábito convertido:", habitId);

    // Verificar se o hábito pertence ao usuário
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { userId: true }
    });

    if (!habit) {
      console.error("Hábito não encontrado:", habitId);
      return NextResponse.json({ error: 'Hábito não encontrado' }, { status: 404 });
    }

    if (habit.userId !== user.id) {
      console.error("Usuário não autorizado:", { habitUserId: habit.userId, requestUserId: user.id });
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
      console.log("Progresso atualizado:", progress);
      return NextResponse.json({ data: progress });
    } else {
      const progress = await prisma.dayProgress.create({
        data: {
          habitId,
          date: new Date(date),
          isChecked: true
        }
      });
      console.log("Novo progresso criado:", progress);
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