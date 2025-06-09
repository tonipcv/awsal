import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitResponseSchema = z.object({
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  }))
});

// GET - Buscar respostas do paciente para uma data específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

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

    // Se for médico, pode ver respostas de todos os pacientes
    // Se for paciente, só pode ver suas próprias respostas
    const whereClause: any = {
      protocolId,
      date: new Date(date)
    };

    // Verificar se é médico através do protocolo
    const isDoctor = protocol.doctorId === session.user.id;
    if (!isDoctor) {
      whereClause.userId = session.user.id;
    }

    const responses = await prisma.dailyCheckinResponse.findMany({
      where: whereClause,
      include: {
        question: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { question: { order: 'asc' } }
      ]
    });

    return NextResponse.json({ responses });

  } catch (error: any) {
    console.error('Erro ao buscar respostas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Submeter respostas do check-in diário
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId } = await params;

    // Verificar se o paciente tem acesso ao protocolo
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        protocolId,
        userId: session.user.id,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou não atribuído' }, { status: 404 });
    }

    const body = await request.json();
    const { responses } = submitResponseSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verificar se já respondeu hoje
    const existingResponses = await prisma.dailyCheckinResponse.findMany({
      where: {
        userId: session.user.id,
        protocolId,
        date: today
      }
    });

    let createdResponses;

    if (existingResponses.length > 0) {
      // Atualizar respostas existentes
      createdResponses = await prisma.$transaction(
        responses.map(response => {
          const existingResponse = existingResponses.find(er => er.questionId === response.questionId);
          
          if (existingResponse) {
            // Atualizar resposta existente
            return prisma.dailyCheckinResponse.update({
              where: { id: existingResponse.id },
              data: { answer: response.answer },
              include: { question: true }
            });
          } else {
            // Criar nova resposta (caso tenha sido adicionada uma nova pergunta)
            return prisma.dailyCheckinResponse.create({
              data: {
                id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: session.user.id,
                questionId: response.questionId,
                protocolId,
                date: today,
                answer: response.answer
              },
              include: { question: true }
            });
          }
        })
      );
    } else {
      // Criar todas as respostas em uma transação (primeira vez)
      createdResponses = await prisma.$transaction(
        responses.map(response => 
          prisma.dailyCheckinResponse.create({
            data: {
              id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: session.user.id,
              questionId: response.questionId,
              protocolId,
              date: today,
              answer: response.answer
            },
            include: {
              question: true
            }
          })
        )
      );
    }

    return NextResponse.json({ 
      success: true, 
      responses: createdResponses,
      message: existingResponses.length > 0 ? 'Check-in atualizado com sucesso!' : 'Check-in realizado com sucesso!'
    }, { status: existingResponses.length > 0 ? 200 : 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Erro ao submeter respostas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 