import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// POST /api/protocols/progress - Marcar tarefa como concluída/não concluída
export async function POST(request: NextRequest) {
  try {
    // Tentar autenticação web primeiro
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // Se não há sessão web, tentar autenticação mobile
    if (!userId) {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { protocolTaskId, date, notes } = await request.json();

    if (!protocolTaskId || !date) {
      return NextResponse.json({ error: 'ID da tarefa e data são obrigatórios' }, { status: 400 });
    }

    // Normalizar a data para evitar problemas de timezone
    // Criar data sempre no UTC para consistência
    const [year, month, day] = date.split('-').map(Number);
    const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Verificar se a tarefa existe (todas as tarefas estão em sessões)
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
                        userId: userId,
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

    // Verificar acesso
    const protocol = task.protocolSession.protocolDay.protocol;
    const hasAccess = protocol.assignments.length > 0;
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a esta tarefa' }, { status: 403 });
    }

    const dayNumber = task.protocolSession.protocolDay.dayNumber;

    // Verificar se já existe progresso para esta tarefa específica nesta data
    const existingProgress = await prisma.protocolDayProgress.findFirst({
      where: {
        userId: userId,
        protocolTaskId: protocolTaskId,
        date: normalizedDate
      }
    });

    let progress;

    if (existingProgress) {
      // Toggle: se existe, inverter o estado
      const newCompletedState = !existingProgress.isCompleted;
      
      progress = await prisma.protocolDayProgress.update({
        where: { id: existingProgress.id },
        data: {
          isCompleted: newCompletedState,
          notes: notes || existingProgress.notes,
          updatedAt: new Date()
        },
        include: {
          protocolTask: {
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    } else {
      // Se não existe, criar como concluída
      progress = await prisma.protocolDayProgress.create({
        data: {
          userId: userId,
          protocolId: protocol.id,
          dayNumber: dayNumber,
          protocolTaskId: protocolTaskId,
          date: normalizedDate,
          isCompleted: true,
          notes: notes
        },
        include: {
          protocolTask: {
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
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress,
      action: existingProgress ? 'toggled' : 'created',
      isCompleted: progress.isCompleted
    });

  } catch (error) {
    console.error('Error updating protocol progress:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar progresso',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET /api/protocols/progress - Buscar progresso do protocolo
export async function GET(request: NextRequest) {
  try {
    // Tentar autenticação web primeiro
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;
    let userRole: string | undefined;

    // Se não há sessão web, tentar autenticação mobile
    if (!userId) {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser) {
        userId = mobileUser.id;
        userRole = mobileUser.role;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');
    const requestedUserId = searchParams.get('userId');
    const date = searchParams.get('date');

    // Buscar o usuário para verificar o role se não temos da sessão
    if (!userRole) {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      userRole = user.role;
    }

    let whereClause: any = {};

    if (userRole === 'DOCTOR') {
      // Médico pode ver progresso de seus pacientes
      if (requestedUserId && protocolId) {
        // Verificar se o paciente pertence ao médico
        const patient = await prisma.user.findFirst({
          where: {
            id: requestedUserId,
            doctorId: userId
          }
        });

        if (!patient) {
          return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
        }

        whereClause.userId = requestedUserId;
        whereClause.protocolId = protocolId;
      } else {
        // Buscar progresso de todos os pacientes do médico para protocolos do médico
        whereClause.protocolTask = {
          protocolSession: {
            protocolDay: {
              protocol: {
                doctorId: userId
              }
            }
          }
        };
      }
    } else {
      // Paciente vê apenas seu próprio progresso
      whereClause.userId = userId;
      
      if (protocolId) {
        whereClause.protocolId = protocolId;
      }
    }

    if (date) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      whereClause.date = normalizedDate;
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
    return NextResponse.json({ 
      error: 'Erro ao buscar progresso',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 