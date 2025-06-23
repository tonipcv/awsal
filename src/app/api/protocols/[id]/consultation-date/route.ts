import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/protocols/[id]/consultation-date - Atualizar data da consulta
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId } = await params;
    const { consultationDate } = await request.json();

    // Verificar se o usuário tem acesso ao protocolo
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        OR: [
          { doctorId: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        assignments: true
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Atualizar a data da consulta no protocolo
    const updatedProtocol = await prisma.protocol.update({
      where: { id: protocolId },
      data: {
        consultation_date: consultationDate ? new Date(consultationDate) : null
      }
    });

    // Atualizar a data da consulta em todas as atribuições ativas deste protocolo
    await prisma.userProtocol.updateMany({
      where: {
        protocolId: protocolId,
        status: 'ACTIVE'
      },
      data: {
        consultationDate: consultationDate ? new Date(consultationDate) : null
      }
    });

    return NextResponse.json(updatedProtocol);
  } catch (error) {
    console.error('Error updating consultation date:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar data da consulta' },
      { status: 500 }
    );
  }
} 