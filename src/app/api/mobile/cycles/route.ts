import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const cycles = await prisma.cycle.findMany({
      where: {
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
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(cycles);
  } catch (error) {
    console.error('Error in GET /api/mobile/cycles:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao buscar ciclos' },
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

    const data = await request.json();
    
    if (!data.startDate || !data.endDate) {
      return NextResponse.json(
        { error: 'Data de início e fim são obrigatórias' },
        { status: 400 }
      );
    }

    // Verificar datas
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Formato de data inválido' },
        { status: 400 }
      );
    }
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'A data de início deve ser anterior à data de fim' },
        { status: 400 }
      );
    }

    // Criar ciclo
    const cycle = await prisma.cycle.create({
      data: {
        startDate,
        endDate,
        vision: data.vision || null,
        userId: user.id
      }
    });

    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/mobile/cycles:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro ao criar ciclo' },
      { status: 500 }
    );
  }
} 