import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/patients/[id] - Buscar dados de um paciente específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar dados de pacientes.' }, { status: 403 });
    }

    const { id } = await params;

    // Buscar o paciente específico
    const patient = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'PATIENT',
        doctorId: session.user.id // Garantir que o paciente pertence ao médico
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        referralCode: true,
        assignedProtocols: {
          select: {
            id: true,
            protocolId: true,
            startDate: true,
            endDate: true,
            isActive: true,
            status: true,
            protocol: {
              select: {
                id: true,
                name: true,
                duration: true,
                description: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não pertence a este médico' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', String(error));
    return NextResponse.json({ error: 'Erro ao buscar paciente' }, { status: 500 });
  }
} 