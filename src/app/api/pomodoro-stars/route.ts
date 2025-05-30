import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

interface PomodoroStar {
  id: string;
  userId: string;
  earnedAt: Date;
}

// GET /api/pomodoro-stars - Retorna as estrelas do usuário agrupadas por data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stars = await prisma.pomodoroStar.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });

    // Agrupar estrelas por data
    const groupedStars = stars.reduce((acc: Record<string, number>, star: PomodoroStar) => {
      const date = star.earnedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date]++;
      return acc;
    }, {});

    return NextResponse.json(groupedStars);
  } catch (error) {
    console.error('Error fetching pomodoro stars:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/pomodoro-stars - Adiciona uma nova estrela
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { date } = await request.json();
    const starDate = new Date(date);

    const star = await prisma.pomodoroStar.create({
      data: {
        userId: session.user.id,
        earnedAt: starDate
      }
    });

    // Retornar o total de estrelas do dia
    const dayStars = await prisma.pomodoroStar.count({
      where: {
        userId: session.user.id,
        earnedAt: {
          gte: startOfDay(starDate),
          lte: endOfDay(starDate)
        }
      }
    });

    return NextResponse.json({ star, totalStars: dayStars });
  } catch (error) {
    console.error('Error creating pomodoro star:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 