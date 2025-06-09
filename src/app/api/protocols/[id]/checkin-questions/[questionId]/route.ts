import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateQuestionSchema = z.object({
  question: z.string().min(1, 'Pergunta é obrigatória').optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'SCALE', 'TEXT', 'YES_NO']).optional(),
  options: z.string().optional(),
  isRequired: z.boolean().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

// PUT - Atualizar pergunta
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId, questionId } = await params;

    // Verificar se é o médico dono do protocolo
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou sem permissão' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateQuestionSchema.parse(body);

    const question = await prisma.dailyCheckinQuestion.update({
      where: {
        id: questionId,
        protocolId
      },
      data: validatedData
    });

    return NextResponse.json({ question });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }
    console.error('Erro ao atualizar pergunta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// DELETE - Deletar pergunta (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId, questionId } = await params;

    // Verificar se é o médico dono do protocolo
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou sem permissão' }, { status: 404 });
    }

    // Soft delete - marcar como inativo
    await prisma.dailyCheckinQuestion.update({
      where: {
        id: questionId,
        protocolId
      },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }
    console.error('Erro ao deletar pergunta:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 