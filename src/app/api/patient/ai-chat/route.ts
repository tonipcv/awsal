import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/patient/ai-chat - Enviar mensagem para o assistente de IA
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId, doctorId } = body;

    if (!message || !doctorId) {
      return NextResponse.json(
        { error: 'Message and doctorId are required' },
        { status: 400 }
      );
    }

    // Verificar se o usuário é paciente do médico
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

    // Buscar configurações do assistente de IA
    const aiSettings = await prisma.aIAssistantSettings.findUnique({
      where: { doctorId }
    });

    if (!aiSettings || !aiSettings.isEnabled) {
      return NextResponse.json(
        { error: 'AI assistant is not enabled for this doctor' },
        { status: 403 }
      );
    }

    // Verificar horário de funcionamento se configurado
    if (aiSettings.businessHoursOnly) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM
      
      if (currentTime < aiSettings.businessHoursStart! || currentTime > aiSettings.businessHoursEnd!) {
        return NextResponse.json({
          response: `I'm available only from ${aiSettings.businessHoursStart} to ${aiSettings.businessHoursEnd}. Your message has been forwarded to the doctor.`,
          needsReview: true
        });
      }
    }

    // Verificar limite diário de mensagens
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = await prisma.patientAIMessage.count({
      where: {
        conversation: {
          patientId: session.user.id,
          doctorId: doctorId
        },
        createdAt: {
          gte: today
        }
      }
    });

    if (todayMessages >= (aiSettings.maxDailyMessages || 50)) {
      return NextResponse.json({
        response: 'You have reached the daily message limit. Your question has been forwarded to the doctor.',
        needsReview: true
      });
    }

    // Buscar ou criar conversa
    let conversation;
    if (conversationId) {
      conversation = await prisma.patientAIConversation.findFirst({
        where: {
          id: conversationId,
          patientId: session.user.id,
          doctorId: doctorId
        }
      });
    }

    if (!conversation) {
      conversation = await prisma.patientAIConversation.create({
        data: {
          patientId: session.user.id,
          doctorId: doctorId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        }
      });
    }

    // Salvar mensagem do usuário
    await prisma.patientAIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message
      }
    });

    // Buscar FAQs relevantes do médico
    const faqs = await prisma.doctorFAQ.findMany({
      where: {
        doctorId: doctorId,
        isActive: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Buscar protocolos/procedimentos do médico
    const protocols = await prisma.protocol.findMany({
      where: {
        doctorId: doctorId,
        isActive: true
      },
      include: {
        days: {
          include: {
            sessions: {
              include: {
                tasks: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limitar para não sobrecarregar o contexto
    });

    // Buscar produtos do médico
    const products = await prisma.products.findMany({
      where: {
        doctorId: doctorId,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limitar para não sobrecarregar o contexto
    });

    // Buscar histórico da conversa atual (últimas 10 mensagens)
    const conversationHistory = await prisma.patientAIMessage.findMany({
      where: {
        conversationId: conversation.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Buscar conversas anteriores do paciente com este médico (últimas 3 conversas)
    const previousConversations = await prisma.patientAIConversation.findMany({
      where: {
        patientId: session.user.id,
        doctorId: doctorId,
        id: { not: conversation.id },
        isActive: true
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Últimas 5 mensagens de cada conversa anterior
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 3
    });

    // Preparar contexto para a IA
    const faqContext = faqs.map(faq => 
      `Q: ${faq.question}\nA: ${faq.answer}`
    ).join('\n\n');

    const protocolsContext = protocols.map(protocol => {
      const tasks = protocol.days.flatMap(day => 
        day.sessions.flatMap(session => 
          session.tasks.map(task => task.title)
        )
      ).slice(0, 5); // Primeiras 5 tarefas
      
      return `Protocol: ${protocol.name}\nDescription: ${protocol.description || 'No description'}\nMain tasks: ${tasks.join(', ')}`;
    }).join('\n\n');

    const productsContext = products.map(product => 
      `Product: ${product.name}\nDescription: ${product.description || 'No description'}\nCategory: ${product.category}\nPrice: $${product.price}`
    ).join('\n\n');

    const historyContext = conversationHistory
      .reverse()
      .slice(0, -1) // Remove a mensagem atual que acabamos de adicionar
      .map(msg => `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const previousConversationsContext = previousConversations.map(conv => {
      const messages = conv.messages.reverse().map(msg => 
        `${msg.role === 'user' ? 'Patient' : 'Assistant'}: ${msg.content}`
      ).join('\n');
      return `Previous conversation "${conv.title}":\n${messages}`;
    }).join('\n\n');

    // Buscar informações do médico
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { name: true }
    });

    const systemPrompt = `You are an AI assistant for Dr. ${doctor?.name || 'Doctor'}. 

IMPORTANT INSTRUCTIONS:
1. Use ONLY the information from FAQs, protocols, products, and conversation history provided below
2. If the question is not covered in the available information, say you don't have that information and will forward to the doctor
3. Be empathetic, professional, and clear
4. Never invent medical information
5. Always recommend consulting the doctor for specific cases
6. Use simple and accessible language
7. Reference specific protocols, products, or previous conversations when relevant

AVAILABLE FAQs:
${faqContext}

AVAILABLE PROTOCOLS/PROCEDURES:
${protocolsContext}

AVAILABLE PRODUCTS:
${productsContext}

${historyContext ? `CURRENT CONVERSATION HISTORY:\n${historyContext}\n` : ''}

${previousConversationsContext ? `PREVIOUS CONVERSATIONS:\n${previousConversationsContext}\n` : ''}

Answer the patient's question based on the information above. If you reference a protocol, product, or previous conversation, mention it specifically.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      const aiResponse = completion.choices[0]?.message?.content || aiSettings.fallbackMessage!;
      
      // Calcular confiança baseada na resposta
      const confidence = aiResponse.includes('don\'t have that information') || 
                       aiResponse.includes('forward to the doctor') ? 0.3 : 0.8;
      
      const needsReview = confidence < aiSettings.confidenceThreshold;

      // Tentar identificar qual FAQ foi usado
      let usedFaqId = null;
      for (const faq of faqs) {
        if (aiResponse.includes(faq.answer.slice(0, 50))) {
          usedFaqId = faq.id;
          break;
        }
      }

      // Salvar resposta da IA
      await prisma.patientAIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: aiResponse,
          isFromFAQ: !!usedFaqId,
          faqId: usedFaqId,
          confidence: confidence,
          needsReview: needsReview
        }
      });

      return NextResponse.json({
        response: aiResponse,
        conversationId: conversation.id,
        confidence: confidence,
        needsReview: needsReview
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Salvar resposta de fallback
      await prisma.patientAIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: aiSettings.fallbackMessage!,
          needsReview: true,
          confidence: 0.1
        }
      });

      return NextResponse.json({
        response: aiSettings.fallbackMessage!,
        conversationId: conversation.id,
        needsReview: true
      });
    }

  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 