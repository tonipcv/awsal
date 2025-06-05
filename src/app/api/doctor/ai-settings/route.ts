import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/doctor/ai-settings - Buscar configurações do assistente de IA
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let settings = await prisma.aIAssistantSettings.findUnique({
      where: { doctorId: session.user.id }
    });

    // Se não existir, criar configurações padrão
    if (!settings) {
      settings = await prisma.aIAssistantSettings.create({
        data: {
          doctorId: session.user.id,
          isEnabled: true,
          autoReplyEnabled: true,
          confidenceThreshold: 0.6,
          businessHoursOnly: false,
          businessHoursStart: '09:00',
          businessHoursEnd: '18:00',
          welcomeMessage: `Olá! Sou o assistente de IA do Dr. {doctorName}. Posso ajudá-lo com informações gerais sobre saúde e orientações específicas do seu médico. Como posso ajudá-lo hoje?`,
          fallbackMessage: 'Desculpe, não consegui encontrar uma resposta adequada. Sua pergunta foi encaminhada para o médico para uma resposta mais específica.',
          maxDailyMessages: 100
        }
      });
    }

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/doctor/ai-settings - Atualizar configurações do assistente de IA
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const {
      isEnabled,
      autoReplyEnabled,
      confidenceThreshold,
      businessHoursOnly,
      businessHoursStart,
      businessHoursEnd,
      welcomeMessage,
      fallbackMessage,
      maxDailyMessages
    } = body;

    const settings = await prisma.aIAssistantSettings.upsert({
      where: { doctorId: session.user.id },
      update: {
        ...(isEnabled !== undefined && { isEnabled }),
        ...(autoReplyEnabled !== undefined && { autoReplyEnabled }),
        ...(confidenceThreshold !== undefined && { confidenceThreshold }),
        ...(businessHoursOnly !== undefined && { businessHoursOnly }),
        ...(businessHoursStart && { businessHoursStart }),
        ...(businessHoursEnd && { businessHoursEnd }),
        ...(welcomeMessage && { welcomeMessage }),
        ...(fallbackMessage && { fallbackMessage }),
        ...(maxDailyMessages !== undefined && { maxDailyMessages }),
        updatedAt: new Date()
      },
      create: {
        doctorId: session.user.id,
        isEnabled: isEnabled ?? true,
        autoReplyEnabled: autoReplyEnabled ?? true,
        confidenceThreshold: confidenceThreshold ?? 0.6,
        businessHoursOnly: businessHoursOnly ?? false,
        businessHoursStart: businessHoursStart ?? '09:00',
        businessHoursEnd: businessHoursEnd ?? '18:00',
        welcomeMessage: welcomeMessage ?? `Olá! Sou o assistente de IA do Dr. {doctorName}. Posso ajudá-lo com informações gerais sobre saúde e orientações específicas do seu médico. Como posso ajudá-lo hoje?`,
        fallbackMessage: fallbackMessage ?? 'Desculpe, não consegui encontrar uma resposta adequada. Sua pergunta foi encaminhada para o médico para uma resposta mais específica.',
        maxDailyMessages: maxDailyMessages ?? 100
      }
    });

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 