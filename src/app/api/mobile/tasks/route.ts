import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await requireMobileAuth(req);
    
    if (!user) {
      return unauthorizedResponse();
    }

    const tasks = await prisma.eisenhowerTask.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        { importance: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[MOBILE_TASKS_GET]', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireMobileAuth(req);
    
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await req.json();
    const { title, dueDate, importance } = body;

    if (!title || !dueDate || typeof importance !== 'number') {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes ou inválidos' },
        { status: 400 }
      );
    }

    // Garantir que a data está no formato correto
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de data inválido' },
        { status: 400 }
      );
    }

    const task = await prisma.eisenhowerTask.create({
      data: {
        title: String(title),
        dueDate: parsedDate,
        importance: Number(importance),
        userId: user.id
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('[MOBILE_TASKS_POST]', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 