import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

// POST /api/protocols/assign - Atribuir protocolo a um paciente
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem atribuir protocolos.' }, { status: 403 });
    }

    const { protocolId, patientId, startDate } = await request.json();

    if (!protocolId || !patientId || !startDate) {
      return NextResponse.json({ error: 'ID do protocolo, ID do paciente e data de início são obrigatórios' }, { status: 400 });
    }

    // Verificar se o protocolo existe e pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Verificar se o paciente existe e pertence ao médico
    const patient = await prisma.user.findFirst({
      where: {
        id: patientId,
        role: 'PATIENT',
        doctorId: session.user.id
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não pertence a este médico' }, { status: 404 });
    }

    // Verificar se já existe uma atribuição ativa
    const existingAssignment = await prisma.userProtocol.findFirst({
      where: {
        userId: patientId,
        protocolId: protocolId,
        isActive: true
      }
    });

    if (existingAssignment) {
      return NextResponse.json({ error: 'Este protocolo já está ativo para este paciente' }, { status: 400 });
    }

    // Calcular data de fim
    const start = new Date(startDate);
    const end = addDays(start, (protocol.duration || 30) - 1);

    // Criar atribuição
    const assignment = await prisma.userProtocol.create({
      data: {
        userId: patientId,
        protocolId: protocolId,
        startDate: start,
        endDate: end,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        protocol: {
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

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning protocol:', String(error));
    return NextResponse.json({ error: 'Erro ao atribuir protocolo' }, { status: 500 });
  }
}

// GET /api/protocols/assign - Listar atribuições de protocolos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const clinicSlug = searchParams.get('clinicSlug'); // Novo parâmetro para filtrar por clínica

    // Buscar o usuário para verificar o role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let assignments;

    if (user.role === 'DOCTOR') {
      // Médico vê todas as atribuições dos seus pacientes
      const whereClause: any = {
        protocol: {
          doctorId: session.user.id
        }
      };

      if (patientId) {
        whereClause.userId = patientId;
      }

      assignments = await prisma.userProtocol.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Paciente vê apenas seus próprios protocolos
      if (!user.doctorId) {
        return NextResponse.json({ error: 'Paciente não possui médico associado' }, { status: 400 });
      }

      let whereClause: any = {
        userId: session.user.id
      };

      // Se clinicSlug foi fornecido, filtrar apenas protocolos dessa clínica
      if (clinicSlug) {
        // Buscar a clínica pelo slug
        const clinic = await prisma.clinic.findUnique({
          where: { slug: clinicSlug, isActive: true },
          select: { id: true }
        });

        if (!clinic) {
          return NextResponse.json({ error: 'Clínica não encontrada' }, { status: 404 });
        }

        // Filtrar protocolos de médicos que pertencem a essa clínica
        whereClause.protocol = {
          doctor: {
            OR: [
              // Médico é dono da clínica
              { ownedClinics: { some: { id: clinic.id, isActive: true } } },
              // Médico é membro da clínica
              { clinicMemberships: { some: { clinicId: clinic.id, isActive: true } } }
            ]
          }
        };
      } else {
        // Filtro original: apenas protocolos do médico do paciente
        whereClause.protocol = {
          doctorId: user.doctorId
        };
      }

      assignments = await prisma.userProtocol.findMany({
        where: whereClause,
        include: {
          protocol: {
            include: {
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
              },
              doctor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // Transform the data to match the expected structure and load products
    const transformedAssignments = await Promise.all(assignments.map(async assignment => {
      // Get all unique product IDs from tasks
      const productIds = new Set<string>();
      assignment.protocol.days.forEach((day: any) => {
        day.sessions.forEach((session: any) => {
          session.tasks.forEach((task: any) => {
            if (task.productId) {
              productIds.add(task.productId);
            }
          });
        });
      });

      // Load products if there are any
      let productsMap = new Map();
      if (productIds.size > 0) {
        const products = await prisma.products.findMany({
          where: {
            id: { in: Array.from(productIds) }
          }
        });
        
        products.forEach(product => {
          productsMap.set(product.id, {
            id: product.id,
            name: product.name,
            description: product.description,
            brand: null, // Not in schema
            imageUrl: null, // Not in schema
            originalPrice: Number(product.price),
            discountPrice: null, // Not in schema
            purchaseUrl: null // Not in schema
          });
        });
      }

      return {
        ...assignment,
        protocol: {
          ...assignment.protocol,
          days: assignment.protocol.days.map((day: any) => ({
            ...day,
            sessions: day.sessions.map((session: any) => ({
              ...session,
              name: session.title, // Map title to name for compatibility
              order: session.sessionNumber - 1, // Convert to 0-based index
              tasks: session.tasks.map((task: any) => ({
                ...task,
                order: task.orderIndex,
                hasMoreInfo: task.hasMoreInfo || false,
                videoUrl: task.videoUrl || '',
                fullExplanation: task.fullExplanation || '',
                productId: task.productId || '',
                modalTitle: task.modalTitle || '',
                modalButtonText: task.modalButtonText || '',
                modalButtonUrl: task.modalButtonUrl || '',
                product: task.productId ? productsMap.get(task.productId) : undefined
              }))
            })),
            // Remove the flattened tasks array to avoid duplication
            tasks: []
          }))
        }
      };
    }));

    return NextResponse.json(transformedAssignments);
  } catch (error) {
    console.error('Error fetching protocol assignments:', String(error));
    return NextResponse.json({ error: 'Erro ao buscar atribuições de protocolos' }, { status: 500 });
  }
} 