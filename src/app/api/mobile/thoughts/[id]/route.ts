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
    const thoughtId = segments[segments.length - 1];
    
    const thought = await prisma.thought.findFirst({
      where: {
        id: thoughtId,
        userId: user.id
      }
    });

    if (!thought) {
      return NextResponse.json({ error: 'Pensamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json(thought);
  } catch (error) {
    console.error('Error in GET /api/mobile/thoughts/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar pensamento' },
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
    const thoughtId = segments[segments.length - 1];
    
    const { content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Conteúdo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o pensamento pertence ao usuário
    const existingThought = await prisma.thought.findFirst({
      where: {
        id: thoughtId,
        userId: user.id
      }
    });

    if (!existingThought) {
      return NextResponse.json({ error: 'Pensamento não encontrado' }, { status: 404 });
    }

    const updatedThought = await prisma.thought.update({
      where: { id: thoughtId },
      data: {
        content: content.trim()
      }
    });

    return NextResponse.json(updatedThought);
  } catch (error) {
    console.error('Error in PUT /api/mobile/thoughts/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar pensamento' },
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
    const thoughtId = segments[segments.length - 1];
    
    // Verificar se o pensamento pertence ao usuário
    const thought = await prisma.thought.findFirst({
      where: {
        id: thoughtId,
        userId: user.id
      }
    });

    if (!thought) {
      return NextResponse.json({ error: 'Pensamento não encontrado' }, { status: 404 });
    }

    // Excluir o pensamento
    await prisma.thought.delete({
      where: { id: thoughtId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/mobile/thoughts/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao excluir pensamento' },
      { status: 500 }
    );
  }
} 