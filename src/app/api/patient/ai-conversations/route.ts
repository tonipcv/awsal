import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/patient/ai-conversations - Listar conversas do paciente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'doctorId is required' },
        { status: 400 }
      );
    }

    // Verificar se é paciente do médico
    const patient = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        doctorId: doctorId
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'You are not a patient of this doctor' },
        { status: 403 }
      );
    }

    const conversations = await prisma.patientAIConversation.findMany({
      where: {
        patientId: session.user.id,
        doctorId: doctorId,
        isActive: true
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages[0]?.content || '',
      lastMessageAt: conv.messages[0]?.createdAt || conv.createdAt,
      messageCount: conv._count.messages,
      createdAt: conv.createdAt
    }));

    return NextResponse.json({ conversations: formattedConversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 