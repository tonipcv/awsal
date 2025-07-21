import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

// GET /api/v2/patients/habits - Listar hábitos
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    // Calcular o intervalo de datas do mês
    let dateFilter = undefined;
    if (month) {
      // Converter YYYY-MM para data completa
      const monthDate = parseISO(`${month}-01`); // Adiciona o dia 01
      dateFilter = {
        date: {
          gte: startOfMonth(monthDate),
          lt: endOfMonth(monthDate)
        }
      };
    }

    // Buscar hábitos do usuário
    const habits = await prisma.habit.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        progress: {
          where: dateFilter,
          orderBy: {
            date: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatar os dados para o mobile
    const formattedHabits = habits.map(habit => ({
      id: habit.id,
      title: habit.title,
      category: habit.category,
      progress: habit.progress.map(p => ({
        date: p.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
        isChecked: p.isChecked
      }))
    }));

    return NextResponse.json({
      success: true,
      habits: formattedHabits,
      total: formattedHabits.length,
      message: 'Hábitos carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/habits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 