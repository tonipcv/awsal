import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/doctor/ai-conversations - Listar todas as conversas de IA dos pacientes do médico
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied. Only doctors can view conversations.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const needsReview = searchParams.get('needsReview');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      doctorId: session.user.id,
      isActive: true
    };

    if (patientId) {
      where.patientId = patientId;
    }

    // Buscar conversas
    const conversations = await prisma.patientAIConversation.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            faq: {
              select: {
                question: true,
                category: true
              }
            }
          }
        },
        _count: {
          select: { 
            messages: true,
            ...(needsReview === 'true' && {
              messages: {
                where: { needsReview: true }
              }
            })
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit
    });

    // Se filtrar por mensagens que precisam de revisão
    let filteredConversations = conversations;
    if (needsReview === 'true') {
      const conversationsWithReview = await Promise.all(
        conversations.map(async (conv) => {
          const reviewCount = await prisma.patientAIMessage.count({
            where: {
              conversationId: conv.id,
              needsReview: true
            }
          });
          return reviewCount > 0 ? conv : null;
        })
      );
      filteredConversations = conversationsWithReview.filter(Boolean) as any[];
    }

    // Contar total para paginação
    const totalCount = await prisma.patientAIConversation.count({
      where
    });

    const formattedConversations = filteredConversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      patient: {
        id: conv.patient.id,
        name: conv.patient.name,
        email: conv.patient.email,
        image: conv.patient.image
      },
      lastMessage: conv.messages[0]?.content || '',
      lastMessageAt: conv.messages[0]?.createdAt || conv.createdAt,
      lastMessageRole: conv.messages[0]?.role || 'assistant',
      messageCount: conv._count.messages,
      needsReviewCount: needsReview === 'true' ? conv._count.messages : 0,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 