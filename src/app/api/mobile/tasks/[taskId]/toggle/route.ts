import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function PUT(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Extract ID from URL
    const segments = request.nextUrl.pathname.split('/');
    const taskId = segments[segments.length - 2]; // -2 because the last segment is 'toggle'

    const task = await prisma.eisenhowerTask.findFirst({
      where: { 
        id: taskId,
        userId: user.id 
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    const updatedTask = await prisma.eisenhowerTask.update({
      where: { id: taskId },
      data: { isCompleted: !task.isCompleted }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 