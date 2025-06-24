import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: assignmentId } = await params;
    const { startDate, endDate } = await request.json();

    // Verificar se o usuário tem acesso à atribuição
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        id: assignmentId,
        protocol: {
          doctorId: session.user.id
        }
      },
      include: {
        protocol: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Atribuição não encontrada' }, { status: 404 });
    }

    // Validar as datas
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);

    if (newEndDate < newStartDate) {
      return NextResponse.json(
        { error: 'A data de término deve ser posterior à data de início' },
        { status: 400 }
      );
    }

    // Calcular a duração em dias
    const durationInDays = Math.ceil(
      (newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Atualizar as datas da atribuição
    const updatedAssignment = await prisma.userProtocol.update({
      where: { id: assignmentId },
      data: {
        startDate: newStartDate,
        endDate: newEndDate
      }
    });

    return NextResponse.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment dates:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar datas do tratamento' },
      { status: 500 }
    );
  }
} 