import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// DELETE /api/protocols/[id]/courses/[courseId] - Remover curso do protocolo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem remover cursos de protocolos.' }, { status: 403 });
    }

    const { id: protocolId, courseId } = params;

    // Verificar se o protocolo pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Verificar se o curso está associado ao protocolo
    const protocolCourse = await prisma.protocolCourse.findFirst({
      where: {
        protocolId,
        courseId
      }
    });

    if (!protocolCourse) {
      return NextResponse.json({ error: 'Curso não está associado a este protocolo' }, { status: 404 });
    }

    // Remover associação
    await prisma.protocolCourse.delete({
      where: {
        id: protocolCourse.id
      }
    });

    return NextResponse.json({ message: 'Curso removido do protocolo com sucesso' });
  } catch (error) {
    console.error('Error removing course from protocol:', error);
    return NextResponse.json({ error: 'Erro ao remover curso do protocolo' }, { status: 500 });
  }
} 