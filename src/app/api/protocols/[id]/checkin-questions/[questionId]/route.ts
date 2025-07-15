import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateQuestionSchema = z.object({
  question: z.string().min(1, 'A pergunta é obrigatória').optional(),
  type: z.enum(['MULTIPLE_CHOICE', 'SCALE', 'TEXT', 'YES_NO'], {
    errorMap: () => ({ message: 'Tipo de pergunta inválido. Use: MULTIPLE_CHOICE, SCALE, TEXT ou YES_NO' })
  }).optional(),
  options: z.string().optional(),
  order: z.number().optional(),
}).strict({
  message: 'Campos não reconhecidos foram enviados'
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

    // Buscar a questão atual para manter os campos não atualizados
    const currentQuestion = await prisma.dailyCheckinQuestion.findUnique({
      where: {
        id: questionId,
      }
    });

    if (!currentQuestion) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }

    if (currentQuestion.protocolId !== protocolId) {
      return NextResponse.json({ error: 'Pergunta não pertence a este protocolo' }, { status: 403 });
    }

    const question = await prisma.dailyCheckinQuestion.update({
      where: {
        id: questionId,
        protocolId
      },
      data: {
        ...validatedData,
      }
    });

    return NextResponse.json({ question });

  } catch (error) {
    console.error('Erro ao atualizar pergunta:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }
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

    // Verificar se a questão existe e pertence ao protocolo
    const question = await prisma.dailyCheckinQuestion.findFirst({
      where: {
        id: questionId,
        protocolId
      }
    });

    if (!question) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }

    // Soft delete - marcar como inativo
    await prisma.dailyCheckinQuestion.update({
      where: {
        id: questionId,
        protocolId
      },
      data: { isActive: false }
    });

    return NextResponse.json({ success: true, message: 'Pergunta removida com sucesso' });

  } catch (error: any) {
    console.error('Erro ao deletar pergunta:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 