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
    const circleIdStr = segments[segments.length - 1];
    
    // Converter para número
    const circleId = parseInt(circleIdStr, 10);
    if (isNaN(circleId)) {
      return NextResponse.json({ error: 'ID de círculo inválido' }, { status: 400 });
    }

    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        userId: user.id
      }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Círculo não encontrado' }, { status: 404 });
    }

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Error in GET /api/mobile/circles/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar círculo' },
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
    const circleIdStr = segments[segments.length - 1];
    
    // Converter para número
    const circleId = parseInt(circleIdStr, 10);
    if (isNaN(circleId)) {
      return NextResponse.json({ error: 'ID de círculo inválido' }, { status: 400 });
    }

    const { title, maxClicks, clicks } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o círculo pertence ao usuário
    const existingCircle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        userId: user.id
      }
    });

    if (!existingCircle) {
      return NextResponse.json({ error: 'Círculo não encontrado' }, { status: 404 });
    }

    const updatedCircle = await prisma.circle.update({
      where: { id: circleId },
      data: {
        title,
        ...(maxClicks !== undefined && { maxClicks }),
        ...(clicks !== undefined && { clicks })
      }
    });

    return NextResponse.json(updatedCircle);
  } catch (error) {
    console.error('Error in PUT /api/mobile/circles/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar círculo' },
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
    const circleIdStr = segments[segments.length - 1];
    
    // Converter para número
    const circleId = parseInt(circleIdStr, 10);
    if (isNaN(circleId)) {
      return NextResponse.json({ error: 'ID de círculo inválido' }, { status: 400 });
    }

    // Verificar se o círculo pertence ao usuário
    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        userId: user.id
      }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Círculo não encontrado' }, { status: 404 });
    }

    // Excluir o círculo
    await prisma.circle.delete({
      where: { id: circleId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/mobile/circles/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao excluir círculo' },
      { status: 500 }
    );
  }
} 