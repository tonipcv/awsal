import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/protocols/[id] - Buscar protocolo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const protocolId = resolvedParams.id;

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem visualizar protocolos.' }, { status: 403 });
    }

    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        days: {
          include: {
            sessions: {
              include: {
                tasks: {
                  include: {
                    ProtocolContent: true
                  },
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Transform data to format expected by frontend (same as /api/protocols)
    const transformedProtocol = {
      ...protocol,
      days: protocol.days.map(day => ({
        ...day,
        // Add direct tasks array by flattening session tasks for compatibility
        tasks: day.sessions.flatMap(session => 
          session.tasks.map(task => ({
            ...task,
            contents: task.ProtocolContent || []
          }))
        ),
        contents: day.sessions.flatMap(session => 
          session.tasks.flatMap(task => task.ProtocolContent || [])
        ),
        // Keep sessions structure intact for new UI
        sessions: day.sessions.map(session => ({
          ...session,
          name: session.title, // Map title to name for compatibility
          order: session.sessionNumber - 1, // Convert to 0-based index for compatibility
          tasks: session.tasks.map(task => ({
            ...task,
            order: task.orderIndex,
            contents: task.ProtocolContent || [],
            // Add compatibility fields expected by frontend
            hasMoreInfo: false,
            videoUrl: '',
            fullExplanation: '',
            productId: '',
            modalTitle: '',
            modalButtonText: ''
          }))
        }))
      }))
    };

    return NextResponse.json(transformedProtocol);
  } catch (error) {
    console.error('Error fetching protocol:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Erro ao buscar protocolo' }, { status: 500 });
  }
}

// PUT /api/protocols/[id] - Atualizar protocolo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const protocolId = resolvedParams.id;
  
  // Declarar variáveis no escopo da função para estarem disponíveis no catch
  let updateData: any = {};
  let days: any;
  
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem editar protocolos.' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, 
      duration, 
      description, 
      isTemplate, 
      showDoctorInfo,
      isAvailable,
      modalTitle,
      modalVideoUrl,
      modalDescription,
      modalButtonText,
      modalButtonUrl
    } = body;
    
    // Atribuir days para estar disponível no catch
    days = body.days;

    // Verificar se o protocolo pertence ao médico
    const existingProtocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!existingProtocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Se está atualizando apenas campos de disponibilidade/modal, não precisa validar name/duration
    const isAvailabilityUpdate = (
      isAvailable !== undefined || 
      modalTitle !== undefined || 
      modalVideoUrl !== undefined || 
      modalDescription !== undefined || 
      modalButtonText !== undefined || 
      modalButtonUrl !== undefined
    ) && !name && !duration && !days;

    // Validar campos obrigatórios apenas se não for uma atualização de disponibilidade
    if (!isAvailabilityUpdate && (!name || !duration)) {
      return NextResponse.json({ error: 'Nome e duração são obrigatórios' }, { status: 400 });
    }

    // Preparar dados para atualização
    if (name !== undefined) updateData.name = name;
    if (duration !== undefined) updateData.duration = duration;
    if (description !== undefined) updateData.description = description;
    if (isTemplate !== undefined) updateData.isTemplate = isTemplate;
    if (showDoctorInfo !== undefined) updateData.showDoctorInfo = showDoctorInfo;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (modalTitle !== undefined) updateData.modalTitle = modalTitle;
    if (modalVideoUrl !== undefined) updateData.modalVideoUrl = modalVideoUrl;
    if (modalDescription !== undefined) updateData.modalDescription = modalDescription;
    if (modalButtonText !== undefined) updateData.modalButtonText = modalButtonText;
    if (modalButtonUrl !== undefined) updateData.modalButtonUrl = modalButtonUrl;

    // Se é apenas atualização de disponibilidade/modal, fazer update simples
    if (isAvailabilityUpdate) {
      const updatedProtocol = await prisma.protocol.update({
        where: { id: protocolId },
        data: updateData
      });

      return NextResponse.json(updatedProtocol);
    }

    // Atualizar protocolo completo em transação (quando há mudanças estruturais)
    const updatedProtocol = await prisma.$transaction(async (tx) => {
      // Atualizar protocolo
      const protocol = await tx.protocol.update({
        where: { id: protocolId },
        data: updateData
      });

      // Se há dias para atualizar, remover e recriar
      if (days && Array.isArray(days)) {
        // Remover dados existentes de forma mais eficiente usando cascade
        // Como ProtocolDay tem cascade, ao deletar os dias, as sessões e tarefas são removidas automaticamente
        await tx.protocolDay.deleteMany({
          where: {
            protocolId: protocolId
          }
        });

        // Criar novos dias e tarefas
        for (const dayData of days) {
          const protocolDay = await tx.protocolDay.create({
            data: {
              dayNumber: dayData.dayNumber,
              title: dayData.title || `Dia ${dayData.dayNumber}`,
              description: dayData.description || null,
              protocolId: protocol.id
            }
          });

          // Criar sessões se existirem
          if (dayData.sessions && Array.isArray(dayData.sessions)) {
            for (const sessionData of dayData.sessions) {
              const protocolSession = await tx.protocolSession.create({
                data: {
                  title: sessionData.title || sessionData.name,
                  description: sessionData.description || null,
                  sessionNumber: sessionData.sessionNumber || sessionData.order || 1,
                  protocolDayId: protocolDay.id
                }
              });

              // Criar tarefas da sessão
              if (sessionData.tasks && Array.isArray(sessionData.tasks)) {
                for (const taskData of sessionData.tasks) {
                  await tx.protocolTask.create({
                    data: {
                      title: taskData.title,
                      description: taskData.description || null,
                      type: taskData.type || 'task',
                      duration: taskData.duration || null,
                      orderIndex: taskData.orderIndex || taskData.order || 0,
                      hasMoreInfo: taskData.hasMoreInfo || false,
                      videoUrl: taskData.videoUrl || null,
                      fullExplanation: taskData.fullExplanation || null,
                      productId: taskData.productId || null,
                      modalTitle: taskData.modalTitle || null,
                      modalButtonText: taskData.modalButtonText || null,
                      modalButtonUrl: taskData.modalButtonUrl || null,
                      protocolSessionId: protocolSession.id
                    }
                  });
                }
              }
            }
          }

          // Criar tarefas diretas do dia (sem sessão) - criar uma sessão padrão
          if (dayData.tasks && Array.isArray(dayData.tasks)) {
            const defaultSession = await tx.protocolSession.create({
              data: {
                title: 'Sessão Principal',
                description: 'Sessão principal do dia',
                sessionNumber: 1,
                protocolDayId: protocolDay.id
              }
            });

            for (const taskData of dayData.tasks) {
              await tx.protocolTask.create({
                data: {
                  title: taskData.title,
                  description: taskData.description || null,
                  type: taskData.type || 'task',
                  duration: taskData.duration || null,
                  orderIndex: taskData.orderIndex || taskData.order || 0,
                  hasMoreInfo: taskData.hasMoreInfo || false,
                  videoUrl: taskData.videoUrl || null,
                  fullExplanation: taskData.fullExplanation || null,
                  productId: taskData.productId || null,
                  modalTitle: taskData.modalTitle || null,
                  modalButtonText: taskData.modalButtonText || null,
                  modalButtonUrl: taskData.modalButtonUrl || null,
                  protocolSessionId: defaultSession.id
                }
              });
            }
          }
        }
      }

      return protocol;
    }, {
      timeout: 15000, // 15 segundos de timeout
    });

    return NextResponse.json(updatedProtocol);
  } catch (error) {
    console.error('Error updating protocol:', { 
      error: error instanceof Error ? error.message : 'Unknown error', 
      stack: error instanceof Error ? error.stack : undefined,
      protocolId,
      timestamp: new Date().toISOString()
    });
    
    // Se for erro de transação, tentar uma abordagem alternativa
    if (error instanceof Error && error.message.includes('Transaction')) {
      console.log('🔄 Tentando abordagem alternativa sem transação...');
      
      try {
        // Usar os dados já parseados do body original
        // Atualizar protocolo primeiro
        const protocol = await prisma.protocol.update({
          where: { id: protocolId },
          data: updateData
        });

        // Se há dias para atualizar, fazer separadamente
        if (days && Array.isArray(days)) {
          // Remover dados existentes
          await prisma.protocolDay.deleteMany({
            where: { protocolId: protocolId }
          });

          // Criar novos dias
          for (const dayData of days) {
            const protocolDay = await prisma.protocolDay.create({
              data: {
                dayNumber: dayData.dayNumber,
                title: dayData.title || `Dia ${dayData.dayNumber}`,
                description: dayData.description || null,
                protocolId: protocol.id
              }
            });

            // Criar sessões se existirem
            if (dayData.sessions && Array.isArray(dayData.sessions)) {
              for (const sessionData of dayData.sessions) {
                const protocolSession = await prisma.protocolSession.create({
                  data: {
                    title: sessionData.title || sessionData.name,
                    description: sessionData.description || null,
                    sessionNumber: sessionData.sessionNumber || sessionData.order || 1,
                    protocolDayId: protocolDay.id
                  }
                });

                // Criar tarefas da sessão
                if (sessionData.tasks && Array.isArray(sessionData.tasks)) {
                  for (const taskData of sessionData.tasks) {
                    await prisma.protocolTask.create({
                      data: {
                        title: taskData.title,
                        description: taskData.description || null,
                        type: taskData.type || 'task',
                        duration: taskData.duration || null,
                        orderIndex: taskData.orderIndex || taskData.order || 0,
                        hasMoreInfo: taskData.hasMoreInfo || false,
                        videoUrl: taskData.videoUrl || null,
                        fullExplanation: taskData.fullExplanation || null,
                        productId: taskData.productId || null,
                        modalTitle: taskData.modalTitle || null,
                        modalButtonText: taskData.modalButtonText || null,
                        modalButtonUrl: taskData.modalButtonUrl || null,
                        protocolSessionId: protocolSession.id
                      }
                    });
                  }
                }
              }
            }

            // Criar tarefas diretas do dia (sem sessão)
            if (dayData.tasks && Array.isArray(dayData.tasks)) {
              const defaultSession = await prisma.protocolSession.create({
                data: {
                  title: 'Sessão Principal',
                  description: 'Sessão principal do dia',
                  sessionNumber: 1,
                  protocolDayId: protocolDay.id
                }
              });

              for (const taskData of dayData.tasks) {
                await prisma.protocolTask.create({
                  data: {
                    title: taskData.title,
                    description: taskData.description || null,
                    type: taskData.type || 'task',
                    duration: taskData.duration || null,
                    orderIndex: taskData.orderIndex || taskData.order || 0,
                    hasMoreInfo: taskData.hasMoreInfo || false,
                    videoUrl: taskData.videoUrl || null,
                    fullExplanation: taskData.fullExplanation || null,
                    productId: taskData.productId || null,
                    modalTitle: taskData.modalTitle || null,
                    modalButtonText: taskData.modalButtonText || null,
                    modalButtonUrl: taskData.modalButtonUrl || null,
                    protocolSessionId: defaultSession.id
                  }
                });
              }
            }
          }
        }

        console.log('✅ Protocolo atualizado com abordagem alternativa');
        return NextResponse.json(protocol);
        
      } catch (fallbackError) {
        console.error('❌ Erro na abordagem alternativa:', fallbackError);
        return NextResponse.json({ error: 'Erro ao atualizar protocolo' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Erro ao atualizar protocolo' }, { status: 500 });
  }
}

// DELETE /api/protocols/[id] - Excluir protocolo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const protocolId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem excluir protocolos.' }, { status: 403 });
    }

    // Verificar se o protocolo pertence ao médico
    const existingProtocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      },
      include: {
        assignments: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!existingProtocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Verificar se há atribuições ativas
    if (existingProtocol.assignments.length > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir protocolo com atribuições ativas. Desative as atribuições primeiro.' 
      }, { status: 400 });
    }

    // Excluir protocolo (cascade irá remover dias e tarefas)
    await prisma.protocol.delete({
      where: { id: protocolId }
    });

    return NextResponse.json({ message: 'Protocolo excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting protocol:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Erro ao excluir protocolo' }, { status: 500 });
  }
} 