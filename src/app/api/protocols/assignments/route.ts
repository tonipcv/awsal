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
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: {
        user_id: userId
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transformar dados para o formato esperado pelo frontend
    const formattedAssignments = prescriptions.map(prescription => {
      const { protocol, ...prescriptionData } = prescription;
      
      return {
        id: prescription.id,
        userId: prescription.user_id,
        protocolId: prescription.protocol_id,
        status: prescription.status,
        startDate: prescription.planned_start_date,
        endDate: prescription.planned_end_date,
        createdAt: prescription.created_at,
        updatedAt: prescription.updated_at,
        currentDay: prescription.current_day,
        isActive: prescription.status === 'ACTIVE',
        protocol: {
          ...protocol,
          doctor: protocol.doctor
        }
      };
    });

    return NextResponse.json({ assignments: formattedAssignments });
  } catch (error) {
    console.error('Erro ao buscar protocolos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
