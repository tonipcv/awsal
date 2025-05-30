import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const checkpoints = await prisma.checkpoint.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(checkpoints);
  } catch (error) {
    console.error('Error in GET /api/mobile/checkpoints:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar checkpoints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { title, completed } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um checkpoint com este título para este usuário
    const existingCheckpoint = await prisma.checkpoint.findFirst({
      where: {
        title,
        userId: user.id
      }
    });

    if (existingCheckpoint) {
      // Atualizar checkpoint existente
      const updatedCheckpoint = await prisma.checkpoint.update({
        where: { id: existingCheckpoint.id },
        data: {
          completed: completed ?? !existingCheckpoint.completed
        }
      });
      return NextResponse.json(updatedCheckpoint);
    } else {
      // Criar novo checkpoint
      const checkpoint = await prisma.checkpoint.create({
        data: {
          title,
          completed: completed ?? false,
          userId: user.id
        }
      });
      return NextResponse.json(checkpoint, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/mobile/checkpoints:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar/atualizar checkpoint' },
      { status: 500 }
    );
  }
} 