import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const resolvedParams = await params;
    const doctorId = resolvedParams.doctorId;

    // Buscar informações do médico
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: 'DOCTOR'
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Buscar estatísticas básicas (opcional)
    const stats = await prisma.user.aggregate({
      where: {
        doctorId: doctorId,
        role: 'PATIENT'
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      doctor: {
        id: doctor.id,
        name: doctor.name,
        image: doctor.image
      },
      stats: {
        totalPatients: stats._count.id
      }
    });

  } catch (error) {
    console.error('Erro ao buscar informações do médico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 