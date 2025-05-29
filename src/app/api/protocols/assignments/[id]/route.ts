import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/protocols/assignments/[id] - Atualizar status da atribuição de protocolo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem atualizar atribuições de protocolos.' }, { status: 403 });
    }

    const { status } = await request.json();

    // Validar status
    if (!status || !['ACTIVE', 'INACTIVE', 'UNAVAILABLE'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido. Use: ACTIVE, INACTIVE ou UNAVAILABLE' }, { status: 400 });
    }

    // Verificar se a atribuição existe e pertence a um paciente do médico
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        id: id,
        protocol: {
          doctorId: session.user.id
        }
      },
      include: {
        protocol: true,
        user: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Atribuição de protocolo não encontrada' }, { status: 404 });
    }

    // Atualizar o status da atribuição
    const updatedAssignment = await prisma.userProtocol.update({
      where: { id: id },
      data: { status: status },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating protocol assignment status:', String(error));
    return NextResponse.json({ error: 'Erro ao atualizar status da atribuição de protocolo' }, { status: 500 });
  }
} 