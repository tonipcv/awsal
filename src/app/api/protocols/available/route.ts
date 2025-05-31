import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/protocols/available - Buscar protocolos ativos e indisponíveis
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar protocolos do médico do paciente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        doctor: true
      }
    });

    if (!user?.doctorId) {
      return NextResponse.json({ error: 'Paciente não possui médico associado' }, { status: 400 });
    }

    // Buscar todos os protocolos do médico
    const protocols = await prisma.protocol.findMany({
      where: {
        doctorId: user.doctorId,
        isTemplate: false // Apenas protocolos reais, não templates
      },
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
        },
        assignments: {
          where: {
            userId: session.user.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Separar protocolos baseado em assignments ativos
    const activeProtocols = protocols.filter(p => 
      p.assignments.some(assignment => assignment.isActive && assignment.status === 'ACTIVE')
    );
    
    const unavailableProtocols = protocols.filter(p => 
      !p.assignments.some(assignment => assignment.isActive && assignment.status === 'ACTIVE')
    );

    return NextResponse.json({
      active: activeProtocols,
      unavailable: unavailableProtocols
    });
  } catch (error) {
    console.error('Error fetching protocols:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Erro ao buscar protocolos' }, { status: 500 });
  }
} 