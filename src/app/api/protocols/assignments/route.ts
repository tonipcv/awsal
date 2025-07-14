import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { NextRequest } from 'next/server';

// GET /api/protocols/assignments - Listar protocolos atribuídos ao paciente
export async function GET(request: NextRequest) {
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

    // Buscar o usuário para verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem acessar esta funcionalidade.' }, { status: 403 });
    }

    // Buscar protocolos atribuídos ao paciente
    const assignments = await prisma.userProtocol.findMany({
      where: {
        userId: userId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Assignments:', assignments.map(a => ({
      id: a.protocol.id,
      name: a.protocol.name,
      description: a.protocol.description,
      duration: a.protocol.duration,
      showDoctorInfo: a.protocol.showDoctorInfo,
      modalTitle: a.protocol.modalTitle,
      modalVideoUrl: a.protocol.modalVideoUrl,
      modalDescription: a.protocol.modalDescription,
      modalButtonText: a.protocol.modalButtonText,
      modalButtonUrl: a.protocol.modalButtonUrl,
      coverImage: a.protocol.coverImage,
      onboardingTemplateId: a.protocol.onboardingTemplateId,
      days: a.protocol.days,
      doctor: a.protocol.doctor
    })));

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching patient protocol assignments:', error);
    return NextResponse.json({ error: 'Erro ao buscar protocolos do paciente' }, { status: 500 });
  }
} 