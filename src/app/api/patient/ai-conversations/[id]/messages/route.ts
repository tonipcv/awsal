import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/patient/ai-conversations/[id]/messages - Buscar mensagens da conversa
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se a conversa pertence ao usuário
    const conversation = await prisma.patientAIConversation.findFirst({
      where: {
        id: id,
        patientId: session.user.id
      },
      include: {
        doctor: {
          select: { name: true }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const messages = await prisma.patientAIMessage.findMany({
      where: {
        conversationId: id
      },
      include: {
        faq: {
          select: {
            question: true,
            category: true
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
        question: msg.faq.question,
        category: msg.faq.category
      } : null,
      confidence: msg.confidence,
      needsReview: msg.needsReview,
      createdAt: msg.createdAt
    }));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        doctorName: conversation.doctor.name,
        createdAt: conversation.createdAt
      },
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 