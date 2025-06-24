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
    const { consultationDate, userId } = await request.json();

    // Buscar o usuário para verificar o role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verificar se o usuário tem acesso ao protocolo
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        OR: [
          { doctorId: session.user.id },
          { assignments: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Se não foi fornecido um userId específico e o usuário é médico, atualizar apenas o protocolo (template)
    if (!userId && user.role === 'DOCTOR') {
      const updatedProtocol = await prisma.protocol.update({
        where: { id: protocolId },
        data: {
          consultation_date: consultationDate ? new Date(consultationDate) : null
        }
      });
      return NextResponse.json(updatedProtocol);
    }

    // Se foi fornecido um userId ou o usuário é paciente, atualizar apenas a atribuição específica
    const targetUserId = userId || session.user.id;
    
    const updatedAssignment = await prisma.userProtocol.updateMany({
      where: {
        protocolId: protocolId,
        userId: targetUserId,
        status: 'ACTIVE'
      },
      data: {
        consultationDate: consultationDate ? new Date(consultationDate) : null
      }
    });

    return NextResponse.json({ success: true, updated: updatedAssignment });
  } catch (error) {
    console.error('Error updating consultation date:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar data da consulta' },
      { status: 500 }
    );
  }
} 