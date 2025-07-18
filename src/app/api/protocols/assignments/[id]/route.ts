import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { NextRequest } from 'next/server';

// GET /api/protocols/assignments/[id] - Buscar uma atribuição específica de protocolo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Tentar autenticação web primeiro, depois mobile
    let userId: string | null = null;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Tentar autenticação mobile
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser?.id) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Buscar a atribuição com todos os dados necessários
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        id: id,
        userId: userId,
        isActive: true
      },
      include: {
        protocol: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            days: {
              include: {
                sessions: {
                  include: {
                    tasks: {
                      orderBy: {
                        orderIndex: 'asc'
                      }
                    }
                  },
                  orderBy: {
                    sessionNumber: 'asc'
                  }
                }
              },
              orderBy: {
                dayNumber: 'asc'
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou acesso negado' }, { status: 404 });
    }

    // Buscar prescrição ativa se existir
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocolId: assignment.protocolId,
        userId: userId,
        status: {
          in: ['PRESCRIBED', 'ACTIVE', 'PAUSED']
        }
      },
      select: {
        id: true,
        status: true,
        actualStartDate: true,
        currentDay: true,
        plannedEndDate: true
      }
    });

    // Transformar dados para o formato esperado pelo frontend
    const transformedAssignment = {
      ...assignment,
      protocol: {
        ...assignment.protocol,
        days: assignment.protocol.days.map(day => ({
          ...day,
          sessions: day.sessions.map(session => ({
            ...session,
            name: session.title,
            order: session.sessionNumber - 1,
            tasks: session.tasks.map(task => ({
              ...task,
              order: task.orderIndex
            }))
          }))
        })),
        duration: assignment.protocol.days.length
      },
      prescription
    };

    return NextResponse.json(transformedAssignment);
  } catch (error) {
    console.error('Error fetching protocol assignment:', error);
    return NextResponse.json({ error: 'Erro ao buscar protocolo' }, { status: 500 });
  }
}

// PUT /api/protocols/assignments/[id] - Atualizar status da atribuição de protocolo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem atualizar atribuições de protocolos.' }, { status: 403 });
    }

    const { status, startDate, endDate } = await request.json();

    // Validar status
    if (!status || !['ACTIVE', 'INACTIVE', 'UNAVAILABLE'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido. Use: ACTIVE, INACTIVE ou UNAVAILABLE' }, { status: 400 });
    }

    // Verificar se a atribuição existe e pertence a um paciente do médico
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        id: id,
        protocol: {
          doctorId: session.user.id
        }
      },
      include: {
        protocol: true,
        user: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Atribuição de protocolo não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = { 
      status: status,
      isActive: status === 'ACTIVE'
    };

    // Se startDate e endDate foram fornecidos (para reativação), atualizá-los também
    if (startDate) {
      updateData.startDate = new Date(startDate);
    }
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }

    // Atualizar o status da atribuição
    const updatedAssignment = await prisma.userProtocol.update({
      where: { id: id },
      data: updateData,
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true,
            description: true
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

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating protocol assignment status:', String(error));
    return NextResponse.json({ error: 'Erro ao atualizar status da atribuição de protocolo' }, { status: 500 });
  }
}

// DELETE /api/protocols/assignments/[id] - Remover completamente a atribuição de protocolo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem remover atribuições de protocolos.' }, { status: 403 });
    }

    // Verificar se a atribuição existe e pertence a um paciente do médico
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        id: id,
        protocol: {
          doctorId: session.user.id
        }
      },
      include: {
        protocol: true,
        user: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Atribuição de protocolo não encontrada' }, { status: 404 });
    }

    // Remover completamente a atribuição
    await prisma.userProtocol.delete({
      where: { id: id }
    });

    return NextResponse.json({ 
      message: 'Atribuição de protocolo removida com sucesso',
      removedAssignment: {
        id: assignment.id,
        protocolName: assignment.protocol.name,
        userName: assignment.user.name || assignment.user.email
      }
    });
  } catch (error) {
    console.error('Error deleting protocol assignment:', String(error));
    return NextResponse.json({ error: 'Erro ao remover atribuição de protocolo' }, { status: 500 });
  }
} 