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
        date: 'desc'
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

    const { date, emotion, isCompleted } = await request.json();
    
    if (!date) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se já existe um checkpoint para esta data
    const existingCheckpoint = await prisma.checkpoint.findFirst({
      where: {
        date,
        userId: user.id
      }
    });

    const newIsCompleted = emotion ? true : (isCompleted ?? !existingCheckpoint?.isCompleted);

    if (existingCheckpoint) {
      // Atualizar checkpoint existente
      const updatedCheckpoint = await prisma.checkpoint.update({
        where: { id: existingCheckpoint.id },
        data: {
          isCompleted: newIsCompleted,
          emotion: emotion || null
        }
      });
      return NextResponse.json(updatedCheckpoint);
    } else {
      // Criar novo checkpoint
      const checkpoint = await prisma.checkpoint.create({
        data: {
          date,
          isCompleted: newIsCompleted,
          emotion: emotion || null,
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