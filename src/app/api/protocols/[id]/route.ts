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
          name: session.title, // Map title to name for frontend compatibility
          order: session.sessionNumber - 1, // Convert to 0-based index for frontend compatibility
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

interface ProtocolTask {
  title: string;
  order: number;
  hasMoreInfo?: boolean;
  videoUrl?: string;
  fullExplanation?: string;
  productId?: string | null;
  modalTitle?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
}

interface ProtocolSession {
  id?: string;
  title: string;
  sessionNumber: number;
  name?: string; // For frontend compatibility
  order?: number; // For frontend compatibility
  tasks: ProtocolTask[];
}

interface ProtocolDay {
  dayNumber: number;
  title: string;
  sessions: ProtocolSession[];
}

interface UpdateProtocolBody {
  name: string;
  description?: string;
  isTemplate: boolean;
  showDoctorInfo: boolean;
  modalTitle?: string;
  modalVideoUrl?: string;
  modalDescription?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
  coverImage?: string;
  isRecurring: boolean;
  recurringInterval?: string;
  recurringDays: number[];
  availableFrom?: string;
  availableUntil?: string;
  onboardingTemplateId?: string;
  days: ProtocolDay[];
}

// PUT /api/protocols/[id] - Atualizar protocolo
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json() as UpdateProtocolBody;

    const protocol = await prisma.protocol.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        isTemplate: body.isTemplate,
        showDoctorInfo: body.showDoctorInfo,
        modalTitle: body.modalTitle,
        modalVideoUrl: body.modalVideoUrl,
        modalDescription: body.modalDescription,
        modalButtonText: body.modalButtonText,
        modalButtonUrl: body.modalButtonUrl,
        coverImage: body.coverImage,
        duration: body.days.length,
        isRecurring: body.isRecurring,
        recurringInterval: body.recurringInterval,
        recurringDays: body.recurringDays,
        availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
        availableUntil: body.availableUntil ? new Date(body.availableUntil) : null,
        onboardingTemplateId: body.onboardingTemplateId,
        days: {
          deleteMany: {},
          create: body.days.map((day: ProtocolDay) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            sessions: {
              create: day.sessions.map((session: ProtocolSession, index) => ({
                title: session.title || session.name || `Session ${index + 1}`,
                sessionNumber: session.sessionNumber || index + 1,
                tasks: {
                  create: session.tasks.map((task: ProtocolTask) => ({
                    title: task.title,
                    orderIndex: task.order,
                    hasMoreInfo: task.hasMoreInfo || false,
                    videoUrl: task.videoUrl || '',
                    fullExplanation: task.fullExplanation || '',
                    productId: task.productId || null,
                    modalTitle: task.modalTitle || '',
                    modalButtonText: task.modalButtonText || '',
                    modalButtonUrl: task.modalButtonUrl || ''
                  }))
                }
              }))
            }
          }))
        }
      },
      include: {
        days: {
          include: {
            sessions: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(protocol);
  } catch (error) {
    console.error('Error updating protocol:', error);
    return NextResponse.json(
      { error: 'Error updating protocol' },
      { status: 500 }
    );
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