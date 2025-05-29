import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/protocols - Listar protocolos do médico
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o usuário para verificar o role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar protocolos.' }, { status: 403 });
    }

    const protocols = await prisma.protocol.findMany({
      where: {
        doctorId: session.user.id
      },
      include: {
        days: {
          include: {
            tasks: true,
            contents: true
          },
          orderBy: {
            dayNumber: 'asc'
          }
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(protocols);
  } catch (error) {
    console.error('Error fetching protocols:', error);
    return NextResponse.json({ error: 'Erro ao buscar protocolos' }, { status: 500 });
  }
}

// POST /api/protocols - Criar novo protocolo
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem criar protocolos.' }, { status: 403 });
    }

    const { name, duration, description, isTemplate, days } = await request.json();

    if (!name || !duration || duration <= 0) {
      return NextResponse.json({ error: 'Nome e duração são obrigatórios' }, { status: 400 });
    }

    // Criar protocolo
    const protocol = await prisma.protocol.create({
      data: {
        name,
        duration,
        description,
        isTemplate: isTemplate || false,
        doctorId: session.user.id
      }
    });

    // Criar dias do protocolo se fornecidos
    if (days && Array.isArray(days)) {
      for (const day of days) {
        const protocolDay = await prisma.protocolDay.create({
          data: {
            dayNumber: day.dayNumber,
            protocolId: protocol.id
          }
        });

        // Criar tarefas do dia
        if (day.tasks && Array.isArray(day.tasks)) {
          for (let i = 0; i < day.tasks.length; i++) {
            const task = day.tasks[i];
            await prisma.protocolTask.create({
              data: {
                title: task.title,
                description: task.description,
                protocolDayId: protocolDay.id,
                order: i
              }
            });
          }
        }

        // Criar conteúdos do dia
        if (day.contents && Array.isArray(day.contents)) {
          for (let i = 0; i < day.contents.length; i++) {
            const content = day.contents[i];
            await prisma.protocolContent.create({
              data: {
                type: content.type,
                title: content.title,
                content: content.content,
                description: content.description,
                protocolDayId: protocolDay.id,
                order: i
              }
            });
          }
        }
      }
    }

    // Buscar protocolo completo para retornar
    const completeProtocol = await prisma.protocol.findUnique({
      where: { id: protocol.id },
      include: {
        days: {
          include: {
            tasks: true,
            contents: true
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    });

    return NextResponse.json(completeProtocol, { status: 201 });
  } catch (error) {
    console.error('Error creating protocol:', error);
    return NextResponse.json({ error: 'Erro ao criar protocolo' }, { status: 500 });
  }
} 