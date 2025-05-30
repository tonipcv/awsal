import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/protocols/progress - Marcar tarefa como concluída/não concluída
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { protocolTaskId, date, isCompleted, notes } = await request.json();

    if (!protocolTaskId || !date) {
      return NextResponse.json({ error: 'ID da tarefa e data são obrigatórios' }, { status: 400 });
    }

    // Verificar se a tarefa existe
    const task = await prisma.protocolTask.findUnique({
      where: { id: protocolTaskId },
      include: {
        protocolSession: {
          include: {
            protocolDay: {
              include: {
                protocol: {
                  include: {
                    assignments: {
                      where: {
                        userId: session.user.id,
                        isActive: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso a esta tarefa
    // A tarefa pode estar diretamente no dia ou em uma sessão
    const protocol = task.protocolSession?.protocolDay?.protocol;
    
    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    const hasAccess = protocol.assignments.length > 0;
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a esta tarefa' }, { status: 403 });
    }

    // Verificar se já existe progresso para esta data
    const existingProgress = await prisma.protocolDayProgress.findUnique({
      where: {
        userId_protocolTaskId_date: {
          userId: session.user.id,
          protocolTaskId: protocolTaskId,
          date: new Date(date)
        }
      }
    });

    let progress;

    if (existingProgress) {
      // Atualizar progresso existente
      progress = await prisma.protocolDayProgress.update({
        where: { id: existingProgress.id },
        data: {
          isCompleted: isCompleted ?? !existingProgress.isCompleted,
          notes: notes || existingProgress.notes
        },
        include: {
          protocolTask: {
            include: {
              protocolSession: {
                include: {
                  protocolDay: true
                }
              }
            }
          }
        }
      });
    } else {
      // Buscar informações da tarefa para obter protocolId e dayNumber
      const taskInfo = await prisma.protocolTask.findUnique({
        where: { id: protocolTaskId },
        include: {
          protocolSession: {
            include: {
              protocolDay: {
                include: {
                  protocol: true
                }
              }
            }
          }
        }
      });

      if (!taskInfo) {
        return NextResponse.json({ error: 'Tarefa não encontrada' }, { status: 404 });
      }

      // Criar novo progresso
      progress = await prisma.protocolDayProgress.create({
        data: {
          userId: session.user.id,
          protocolId: taskInfo.protocolSession.protocolDay.protocol.id,
          dayNumber: taskInfo.protocolSession.protocolDay.dayNumber,
          protocolTaskId: protocolTaskId,
          date: new Date(date),
          isCompleted: isCompleted ?? true,
          notes: notes
        },
        include: {
          protocolTask: {
            include: {
              protocolSession: {
                include: {
                  protocolDay: true
                }
              }
            }
          }
        }
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating protocol progress:', error);
    return NextResponse.json({ error: 'Erro ao atualizar progresso' }, { status: 500 });
  }
}

// GET /api/protocols/progress - Buscar progresso do protocolo
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    // Buscar o usuário para verificar o role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let whereClause: any = {};

    if (user.role === 'DOCTOR') {
      // Médico pode ver progresso de seus pacientes
      if (userId && protocolId) {
        // Verificar se o paciente pertence ao médico
        const patient = await prisma.user.findFirst({
          where: {
            id: userId,
            doctorId: session.user.id
          }
        });

        if (!patient) {
          return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
        }

        whereClause.userId = userId;
        whereClause.protocolTask = {
          OR: [
            {
              protocolDay: {
                protocolId: protocolId
              }
            },
            {
              protocolSession: {
                protocolDay: {
                  protocolId: protocolId
                }
              }
            }
          ]
        };
      } else {
        // Buscar progresso de todos os pacientes do médico
        whereClause.protocolTask = {
          OR: [
            {
              protocolDay: {
                protocol: {
                  doctorId: session.user.id
                }
              }
            },
            {
              protocolSession: {
                protocolDay: {
                  protocol: {
                    doctorId: session.user.id
                  }
                }
              }
            }
          ]
        };
      }
    } else {
      // Paciente vê apenas seu próprio progresso
      whereClause.userId = session.user.id;
      
      if (protocolId) {
        whereClause.protocolTask = {
          OR: [
            {
              protocolDay: {
                protocolId: protocolId
              }
            },
            {
              protocolSession: {
                protocolDay: {
                  protocolId: protocolId
                }
              }
            }
          ]
        };
      }
    }

    if (date) {
      whereClause.date = new Date(date);
    }

    const progress = await prisma.protocolDayProgress.findMany({
      where: whereClause,
      include: {
        protocolTask: {
          include: {
            protocolSession: {
              include: {
                protocolDay: {
                  include: {
                    protocol: {
                      select: {
                        id: true,
                        name: true,
                        duration: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { dayNumber: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching protocol progress:', error);
    return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 });
  }
} 