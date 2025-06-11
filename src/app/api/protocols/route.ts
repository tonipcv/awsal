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
            sessions: {
              include: {
                tasks: {
                  include: {
                    ProtocolContent: true
                  }
                }
              }
            }
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

    // Transformar dados para formato esperado pelo frontend
    const transformedProtocols = protocols.map(protocol => ({
      ...protocol,
      days: protocol.days.map(day => ({
        ...day,
        tasks: day.sessions.flatMap(session => 
          session.tasks.map(task => ({
            ...task,
            contents: task.ProtocolContent || []
          }))
        ),
        contents: day.sessions.flatMap(session => 
          session.tasks.flatMap(task => task.ProtocolContent || [])
        )
      }))
    }));

    return NextResponse.json(transformedProtocols);
  } catch (error) {
    console.error('Error fetching protocols:', error instanceof Error ? error.message : 'Erro desconhecido');
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

    const body = await request.json();
    console.log('Dados recebidos para criar protocolo:', JSON.stringify(body, null, 2));
    
    const { name, duration, description, isTemplate, days } = body;

    // Validação mais robusta
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.log('Erro de validação: nome inválido', { name, type: typeof name });
      return NextResponse.json({ error: 'Nome é obrigatório e deve ser um texto válido' }, { status: 400 });
    }

    // Converter duration para número se for string
    let durationNumber = duration;
    if (typeof duration === 'string') {
      durationNumber = parseInt(duration, 10);
    }

    if (!durationNumber || typeof durationNumber !== 'number' || durationNumber <= 0 || isNaN(durationNumber)) {
      console.log('Erro de validação: duração inválida', { 
        duration, 
        durationNumber, 
        type: typeof duration,
        typeNumber: typeof durationNumber 
      });
      return NextResponse.json({ error: 'Duração é obrigatória e deve ser um número maior que zero' }, { status: 400 });
    }

    console.log('Validação passou. Criando protocolo...', { 
      name: name.trim(), 
      duration: durationNumber,
      description: description?.trim() || null 
    });

    // Criar protocolo
    const protocol = await prisma.protocol.create({
      data: {
        name: name.trim(),
        duration: durationNumber,
        description: description?.trim() || null,
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
            title: day.title || `Dia ${day.dayNumber}`,
            description: day.description || null,
            protocolId: protocol.id
          }
        });

        // Criar uma sessão padrão para o dia
        const protocolSession = await prisma.protocolSession.create({
          data: {
            sessionNumber: 1,
            title: 'Sessão Principal',
            description: 'Sessão principal do dia',
            protocolDayId: protocolDay.id
          }
        });

        // Criar tarefas da sessão
        if (day.tasks && Array.isArray(day.tasks)) {
          for (let i = 0; i < day.tasks.length; i++) {
            const task = day.tasks[i];
            const protocolTask = await prisma.protocolTask.create({
              data: {
                title: task.title,
                description: task.description,
                type: task.type || 'task',
                duration: task.duration || null,
                orderIndex: i,
                protocolSessionId: protocolSession.id
              }
            });

            // Criar conteúdos da tarefa se existirem
            if (task.contents && Array.isArray(task.contents)) {
              for (let j = 0; j < task.contents.length; j++) {
                const content = task.contents[j];
                await prisma.protocolContent.create({
                  data: {
                    type: content.type,
                    content: content.content,
                    orderIndex: j,
                    protocolTaskId: protocolTask.id
                  }
                });
              }
            }
          }
        }

        // Criar conteúdos do dia se existirem (como conteúdos de uma tarefa geral)
        if (day.contents && Array.isArray(day.contents)) {
          // Criar uma tarefa geral para os conteúdos do dia
          const generalTask = await prisma.protocolTask.create({
            data: {
              title: 'Conteúdos do Dia',
              description: 'Conteúdos gerais do dia',
              type: 'content',
              orderIndex: 999,
              protocolSessionId: protocolSession.id
            }
          });

          for (let i = 0; i < day.contents.length; i++) {
            const content = day.contents[i];
            await prisma.protocolContent.create({
              data: {
                type: content.type,
                content: content.content,
                orderIndex: i,
                protocolTaskId: generalTask.id
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
            sessions: {
              include: {
                tasks: {
                  include: {
                    ProtocolContent: true
                  }
                }
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    });

    // Transformar para formato esperado
    const transformedProtocol = {
      ...completeProtocol,
      days: completeProtocol?.days.map(day => ({
        ...day,
        tasks: day.sessions.flatMap(session => 
          session.tasks.map(task => ({
            ...task,
            contents: task.ProtocolContent || []
          }))
        ),
        contents: day.sessions.flatMap(session => 
          session.tasks.flatMap(task => task.ProtocolContent || [])
        )
      })) || []
    };

    return NextResponse.json(transformedProtocol, { status: 201 });
  } catch (error) {
    console.error('Error creating protocol:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro ao criar protocolo' }, { status: 500 });
  }
} 