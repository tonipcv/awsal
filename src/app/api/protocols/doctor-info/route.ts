import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar protocolos ativos do usuário que mostram informações do médico
    const activeProtocols = await prisma.userProtocol.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        protocol: {
          showDoctorInfo: true
        }
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
            }
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      },
      take: 1 // Pegar apenas o protocolo mais recente
    });

    // Se encontrou um protocolo ativo com médico
    if (activeProtocols.length > 0 && activeProtocols[0].protocol.doctor) {
      const doctor = activeProtocols[0].protocol.doctor;
      
      return NextResponse.json({
        success: true,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          image: doctor.image
        }
      });
    }

    // Se não encontrou nenhum protocolo ativo com médico
    return NextResponse.json({
      success: true,
      doctor: null
    });

  } catch (error) {
    console.error('Error fetching doctor info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 