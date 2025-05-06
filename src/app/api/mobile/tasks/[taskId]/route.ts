import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { isValidDate } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const taskId = segments[segments.length - 1];

    const task = await prisma.eisenhowerTask.findFirst({
      where: {
        id: taskId,
        userId: user.id
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error getting task:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    const taskId = segments[segments.length - 1];
    
    const body = await request.json();
    const { title, dueDate, importance } = body;

    // Validate input
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    if (!dueDate || !isValidDate(dueDate)) {
      return NextResponse.json({ error: 'Data de vencimento válida é obrigatória' }, { status: 400 });
    }

    if (typeof importance !== 'number' || importance < 1 || importance > 4) {
      return NextResponse.json({ error: 'Nível de importância válido (1-4) é obrigatório' }, { status: 400 });
    }

    // Check if task exists and belongs to user
    const existingTask = await prisma.eisenhowerTask.findFirst({
      where: { 
        id: taskId,
        userId: user.id 
      }
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Update task
    const updatedTask = await prisma.eisenhowerTask.update({
      where: { id: taskId },
      data: {
        title: title.trim(),
        dueDate: new Date(dueDate),
        importance
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
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
    const taskId = segments[segments.length - 1];

    const task = await prisma.eisenhowerTask.findFirst({
      where: {
        id: taskId,
        userId: user.id
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    await prisma.eisenhowerTask.delete({
      where: { id: taskId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting task:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 