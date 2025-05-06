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
    const cycleIdStr = segments[segments.length - 1];
    
    // Converter para número
    const cycleId = parseInt(cycleIdStr, 10);
    if (isNaN(cycleId)) {
      return NextResponse.json({ error: 'ID de ciclo inválido' }, { status: 400 });
    }

    const cycle = await prisma.cycle.findFirst({
      where: {
        id: cycleId,
        userId: user.id
      },
      include: {
        weeks: {
          include: {
            goals: true,
            keyResults: true,
            days: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    }

    return NextResponse.json(cycle);
  } catch (error) {
    console.error('Error in GET /api/mobile/cycles/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar ciclo' },
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
    const cycleIdStr = segments[segments.length - 1];
    
    // Converter para número
    const cycleId = parseInt(cycleIdStr, 10);
    if (isNaN(cycleId)) {
      return NextResponse.json({ error: 'ID de ciclo inválido' }, { status: 400 });
    }

    const { startDate, endDate, vision } = await request.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Data de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    // Verificar datas
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    
    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de data inválido' },
        { status: 400 }
      );
    }
    
    if (parsedStartDate >= parsedEndDate) {
      return NextResponse.json(
        { error: 'A data de início deve ser anterior à data de fim' },
        { status: 400 }
      );
    }

    // Verificar se o ciclo pertence ao usuário
    const existingCycle = await prisma.cycle.findFirst({
      where: {
        id: cycleId,
        userId: user.id
      }
    });

    if (!existingCycle) {
      return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    }

    const updatedCycle = await prisma.cycle.update({
      where: { id: cycleId },
      data: {
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        vision: vision || null
      }
    });

    return NextResponse.json(updatedCycle);
  } catch (error) {
    console.error('Error in PUT /api/mobile/cycles/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao atualizar ciclo' },
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
    const cycleIdStr = segments[segments.length - 1];
    
    // Converter para número
    const cycleId = parseInt(cycleIdStr, 10);
    if (isNaN(cycleId)) {
      return NextResponse.json({ error: 'ID de ciclo inválido' }, { status: 400 });
    }

    // Verificar se o ciclo pertence ao usuário
    const cycle = await prisma.cycle.findFirst({
      where: {
        id: cycleId,
        userId: user.id
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Ciclo não encontrado' }, { status: 404 });
    }

    // Excluir o ciclo (cascade delete configurado no prisma)
    await prisma.cycle.delete({
      where: { id: cycleId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/mobile/cycles/[id]:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao excluir ciclo' },
      { status: 500 }
    );
  }
} 