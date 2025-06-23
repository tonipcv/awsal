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
        },
        onboardingTemplate: {
          select: {
            id: true,
            name: true
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
            order: task.orderIndex,
            contents: task.ProtocolContent || [],
            // Use actual database values for direct tasks too
            hasMoreInfo: task.hasMoreInfo || false,
            videoUrl: task.videoUrl || '',
            fullExplanation: task.fullExplanation || '',
            productId: task.productId || '',
            modalTitle: task.modalTitle || '',
            modalButtonText: task.modalButtonText || '',
            modalButtonUrl: task.modalButtonUrl || ''
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
            // Use actual database values instead of defaults
            hasMoreInfo: task.hasMoreInfo || false,
            videoUrl: task.videoUrl || '',
            fullExplanation: task.fullExplanation || '',
            productId: task.productId || '',
            modalTitle: task.modalTitle || '',
            modalButtonText: task.modalButtonText || '',
            modalButtonUrl: task.modalButtonUrl || ''
          }))
        }))
      })),
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
  let protocolDays: any;
  
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
      modalButtonUrl,
      coverImage,
      consultation_date,
      onboardingTemplateId,
      days
    } = body;
    
    // Atribuir days para estar disponível no catch
    protocolDays = days;

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
      modalButtonUrl !== undefined ||
      consultation_date !== undefined ||
      onboardingTemplateId !== undefined
    );

    // Validar campos obrigatórios
    if (!isAvailabilityUpdate) {
      if (!name?.trim()) {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
      }
    }

    // Preparar dados para atualização
    updateData = {
      name,
      description,
      isTemplate,
      showDoctorInfo,
      isAvailable,
      modalTitle,
      modalVideoUrl,
      modalDescription,
      modalButtonText,
      modalButtonUrl,
      coverImage,
      consultation_date,
      onboardingTemplateId
    };

    // Se é apenas atualização de disponibilidade/modal, fazer update simples
    if (isAvailabilityUpdate) {
      const updatedProtocol = await prisma.protocol.update({
        where: { id: protocolId },
        data: updateData,
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
          onboardingTemplate: {
            select: {
              id: true,
              name: true
            }
          }
        }
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

      // Se há dias para atualizar, fazer update incremental
      if (protocolDays && Array.isArray(protocolDays)) {
        console.log('🔄 Processing days data incrementally:', {
          daysCount: protocolDays.length,
          days: protocolDays.map(d => ({
            dayNumber: d.dayNumber,
            sessionsCount: d.sessions?.length || 0,
            tasksCount: d.tasks?.length || 0
          }))
        });

        // Buscar dados existentes
        const existingDays = await tx.protocolDay.findMany({
          where: { protocolId: protocolId },
          include: {
            sessions: {
              include: {
                tasks: true
              }
            }
          }
        });

        // Mapear dias existentes por dayNumber
        const existingDaysMap = new Map(existingDays.map(day => [day.dayNumber, day]));

        // Processar cada dia
        for (const dayData of protocolDays) {
          const existingDay = existingDaysMap.get(dayData.dayNumber);
          
          if (existingDay) {
            // Dia existe - verificar se precisa atualizar
            const needsUpdate = 
              existingDay.title !== (dayData.title || `Dia ${dayData.dayNumber}`) ||
              existingDay.description !== (dayData.description || null);

            if (needsUpdate) {
              console.log(`📅 Updating existing day ${dayData.dayNumber}`);
              await tx.protocolDay.update({
                where: { id: existingDay.id },
                data: {
                  title: dayData.title || `Dia ${dayData.dayNumber}`,
                  description: dayData.description || null
                }
              });
            } else {
              console.log(`📅 Day ${dayData.dayNumber} unchanged, skipping update`);
            }

            // Processar sessões do dia
            if (dayData.sessions && Array.isArray(dayData.sessions)) {
              const existingSessionsMap = new Map(existingDay.sessions.map(session => [session.sessionNumber, session]));

              for (const sessionData of dayData.sessions) {
                const sessionNumber = sessionData.sessionNumber || sessionData.order || 1;
                const existingSession = existingSessionsMap.get(sessionNumber);

                if (existingSession) {
                  // Sessão existe - verificar se precisa atualizar
                  const sessionNeedsUpdate = 
                    existingSession.title !== (sessionData.title || sessionData.name || 'Sessão sem nome') ||
                    existingSession.description !== (sessionData.description || null);

                  if (sessionNeedsUpdate) {
                    console.log(`📝 Updating existing session ${sessionNumber} for day ${dayData.dayNumber}`);
                    await tx.protocolSession.update({
                      where: { id: existingSession.id },
                      data: {
                        title: sessionData.title || sessionData.name || 'Sessão sem nome',
                        description: sessionData.description || null
                      }
                    });
                  } else {
                    console.log(`📝 Session ${sessionNumber} for day ${dayData.dayNumber} unchanged, skipping update`);
                  }

                  // Processar tarefas da sessão (sempre recriar se houver mudanças)
                  if (sessionData.tasks && Array.isArray(sessionData.tasks)) {
                    // Comparar tarefas existentes com novas
                    const existingTasks = existingSession.tasks;
                    const newTasks = sessionData.tasks.filter((task: any) => task.title.trim());

                    // Se o número de tarefas ou conteúdo mudou, recriar
                    const tasksChanged = 
                      existingTasks.length !== newTasks.length ||
                      existingTasks.some((existingTask, index) => {
                        const newTask = newTasks[index];
                        return !newTask || 
                          existingTask.title !== newTask.title ||
                          existingTask.description !== (newTask.description || null) ||
                          existingTask.hasMoreInfo !== (newTask.hasMoreInfo || false) ||
                          existingTask.videoUrl !== (newTask.videoUrl || null) ||
                          existingTask.fullExplanation !== (newTask.fullExplanation || null) ||
                          existingTask.productId !== (newTask.productId || null) ||
                          existingTask.modalTitle !== (newTask.modalTitle || null) ||
                          existingTask.modalButtonText !== (newTask.modalButtonText || null) ||
                          existingTask.modalButtonUrl !== (newTask.modalButtonUrl || null);
                      });

                    if (tasksChanged) {
                      console.log(`📋 Tasks changed for session ${sessionNumber}, updating...`);
                      // Deletar tarefas existentes
                      await tx.protocolTask.deleteMany({
                        where: { protocolSessionId: existingSession.id }
                      });

                      // Criar novas tarefas
                      for (const taskData of newTasks) {
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
                            protocolSessionId: existingSession.id
                          }
                        });
                      }
                    } else {
                      console.log(`📋 Tasks for session ${sessionNumber} unchanged, skipping update`);
                    }
                  }
                } else {
                  // Sessão nova - criar
                  console.log(`📝 Creating new session ${sessionNumber} for day ${dayData.dayNumber}`);
                  const protocolSession = await tx.protocolSession.create({
                    data: {
                      title: sessionData.title || sessionData.name || 'Sessão sem nome',
                      description: sessionData.description || null,
                      sessionNumber: sessionNumber,
                      protocolDayId: existingDay.id
                    }
                  });

                  // Criar tarefas da nova sessão
                  if (sessionData.tasks && Array.isArray(sessionData.tasks)) {
                    const validTasks = sessionData.tasks.filter((task: any) => task.title.trim());
                    for (const taskData of validTasks) {
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

              // Remover sessões que não existem mais
              const newSessionNumbers = new Set(dayData.sessions.map((s: any) => s.sessionNumber || s.order || 1));
              for (const existingSession of existingDay.sessions) {
                if (!newSessionNumbers.has(existingSession.sessionNumber)) {
                  console.log(`🗑️ Removing session ${existingSession.sessionNumber} from day ${dayData.dayNumber}`);
                  await tx.protocolSession.delete({
                    where: { id: existingSession.id }
                  });
                }
              }
            }
          } else {
            // Dia novo - criar
            console.log(`📅 Creating new day ${dayData.dayNumber}`);
          const protocolDay = await tx.protocolDay.create({
            data: {
              dayNumber: dayData.dayNumber,
              title: dayData.title || `Dia ${dayData.dayNumber}`,
              description: dayData.description || null,
              protocolId: protocol.id
            }
          });

            // Criar sessões do novo dia
          if (dayData.sessions && Array.isArray(dayData.sessions)) {
            for (const sessionData of dayData.sessions) {
              const protocolSession = await tx.protocolSession.create({
                data: {
                  title: sessionData.title || sessionData.name || 'Sessão sem nome',
                  description: sessionData.description || null,
                  sessionNumber: sessionData.sessionNumber || sessionData.order || 1,
                  protocolDayId: protocolDay.id
                }
              });

                // Criar tarefas da sessão
                if (sessionData.tasks && Array.isArray(sessionData.tasks)) {
                  const validTasks = sessionData.tasks.filter((task: any) => task.title.trim());
                  for (const taskData of validTasks) {
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
          }
        }

        // Remover dias que não existem mais
        const newDayNumbers = new Set(protocolDays.map(d => d.dayNumber));
        for (const existingDay of existingDays) {
          if (!newDayNumbers.has(existingDay.dayNumber)) {
            console.log(`🗑️ Removing day ${existingDay.dayNumber}`);
            await tx.protocolDay.delete({
              where: { id: existingDay.id }
            });
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
        if (protocolDays && Array.isArray(protocolDays)) {
          // Remover dados existentes
          await prisma.protocolDay.deleteMany({
            where: { protocolId: protocolId }
          });

          // Criar novos dias
          for (const dayData of protocolDays) {
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
                    title: sessionData.title || sessionData.name || 'Sessão sem nome',
                    description: sessionData.description || null,
                    sessionNumber: sessionData.sessionNumber || sessionData.order || 1,
                    protocolDayId: protocolDay.id
                  }
                });

                // Criar tarefas da sessão (mesmo que não haja tarefas, a sessão deve ser criada)
                if (sessionData.tasks && Array.isArray(sessionData.tasks) && sessionData.tasks.length > 0) {
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

            // Note: Direct tasks are no longer automatically wrapped in sessions
            // Users have full control over protocol structure
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
      const activeAssignments = existingProtocol.assignments;
      const patientNames = await Promise.all(
        activeAssignments.map(async (assignment) => {
          const user = await prisma.user.findUnique({
            where: { id: assignment.userId },
            select: { name: true, email: true }
          });
          return user?.name || user?.email || 'Unknown patient';
        })
      );

      return NextResponse.json({ 
        error: `Cannot delete protocol with active assignments. This protocol is currently assigned to ${activeAssignments.length} patient(s): ${patientNames.join(', ')}. Please deactivate all assignments first by going to each patient's page and changing the protocol status to INACTIVE or removing the assignment.`,
        activeAssignments: activeAssignments.length,
        patients: patientNames
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