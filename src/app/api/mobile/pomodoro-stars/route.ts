import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { startOfDay, endOfDay } from 'date-fns';

interface PomodoroStar {
  id: string;
  userId: string;
  date: Date;
  createdAt: Date;
}

// GET /api/mobile/pomodoro-stars - Retorna as estrelas do usuário agrupadas por data
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const stars = await prisma.pomodoroStar.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Agrupar estrelas por data
    const groupedStars = stars.reduce((acc: Record<string, number>, star: PomodoroStar) => {
      const date = star.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    return NextResponse.json(groupedStars);
  } catch (error) {
    console.error('Error fetching pomodoro stars (mobile):', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/pomodoro-stars - Adiciona uma nova estrela
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { date } = await request.json();
    if (!date) {
      return NextResponse.json(
        { error: 'Data é obrigatória' },
        { status: 400 }
      );
    }
    
    const starDate = new Date(date);

    const star = await prisma.pomodoroStar.create({
      data: {
        userId: user.id,
        date: starDate
      }
    });

    // Retornar o total de estrelas do dia
    const dayStars = await prisma.pomodoroStar.count({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay(starDate),
          lte: endOfDay(starDate)
        }
      }
    });

    return NextResponse.json({ star, totalStars: dayStars });
  } catch (error) {
    console.error('Error creating pomodoro star (mobile):', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 