import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/doctor/ai-conversations/[id] - Buscar conversa específica com todas as mensagens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const conversationId = resolvedParams.id;

    // Verificar se a conversa pertence ao médico
    const conversation = await prisma.patientAIConversation.findFirst({
      where: {
        id: conversationId,
        doctorId: session.user.id
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Buscar todas as mensagens da conversa
    const messages = await prisma.patientAIMessage.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        faq: {
          select: {
            id: true,
            question: true,
            category: true,
            answer: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      isFromFAQ: msg.isFromFAQ,
      faq: msg.faq ? {
        id: msg.faq.id,
        question: msg.faq.question,
        category: msg.faq.category,
        answer: msg.faq.answer
      } : null,
      confidence: msg.confidence,
      needsReview: msg.needsReview,
      reviewedAt: msg.reviewedAt,
      reviewedBy: msg.reviewedBy,
      createdAt: msg.createdAt
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        patient: conversation.patient,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      messages: formattedMessages,
      stats: {
        totalMessages: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        assistantMessages: messages.filter(m => m.role === 'assistant').length,
        needsReviewCount: messages.filter(m => m.needsReview).length,
        faqUsedCount: messages.filter(m => m.isFromFAQ).length,
        averageConfidence: messages
          .filter(m => m.confidence !== null)
          .reduce((sum, m) => sum + (m.confidence || 0), 0) / 
          messages.filter(m => m.confidence !== null).length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/doctor/ai-conversations/[id] - Marcar mensagens como revisadas
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ error: 'Access denied. Only doctors can review conversations.' }, { status: 403 });
    }

    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const body = await request.json();
    const { messageIds, markAllAsReviewed } = body;

    // Verificar se a conversa pertence ao médico
    const conversation = await prisma.patientAIConversation.findFirst({
      where: {
        id: conversationId,
        doctorId: session.user.id
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    let updatedMessages;

    if (markAllAsReviewed) {
      // Marcar todas as mensagens que precisam de revisão como revisadas
      updatedMessages = await prisma.patientAIMessage.updateMany({
        where: {
          conversationId: conversationId,
          needsReview: true,
          reviewedAt: null
        },
        data: {
          reviewedAt: new Date(),
          reviewedBy: session.user.id
        }
      });
    } else if (messageIds && Array.isArray(messageIds)) {
      // Marcar mensagens específicas como revisadas
      updatedMessages = await prisma.patientAIMessage.updateMany({
        where: {
          id: { in: messageIds },
          conversationId: conversationId,
          needsReview: true
        },
        data: {
          reviewedAt: new Date(),
          reviewedBy: session.user.id
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either messageIds or markAllAsReviewed must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedMessages.count
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 