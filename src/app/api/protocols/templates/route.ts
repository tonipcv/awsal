import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PROTOCOL_TEMPLATES } from '@/types/protocol';

// GET /api/protocols/templates - Listar templates disponíveis
export async function GET() {
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar templates.' }, { status: 403 });
    }

    // Retornar templates pré-definidos + templates criados pelo médico
    const customTemplates = await prisma.protocol.findMany({
      where: {
        doctorId: session.user.id,
        isTemplate: true
      },
      include: {
        days: {
          include: {
            tasks: true,
            contents: true
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      predefined: PROTOCOL_TEMPLATES,
      custom: customTemplates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
  }
}

// POST /api/protocols/templates - Criar protocolo a partir de template
export async function POST(request: Request) {
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem criar protocolos.' }, { status: 403 });
    }

    const { templateName, protocolName, customizations } = await request.json();

    if (!templateName || !protocolName) {
      return NextResponse.json({ error: 'Nome do template e nome do protocolo são obrigatórios' }, { status: 400 });
    }

    // Buscar template
    const template = PROTOCOL_TEMPLATES.find(t => t.name === templateName);
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Criar protocolo baseado no template
    const protocol = await prisma.protocol.create({
      data: {
        name: protocolName,
        duration: template.duration,
        description: template.description,
        isTemplate: false,
        doctorId: session.user.id
      }
    });

    // Criar dias do protocolo
    for (const templateDay of template.days) {
      const protocolDay = await prisma.protocolDay.create({
        data: {
          dayNumber: templateDay.dayNumber,
          protocolId: protocol.id
        }
      });

      // Criar tarefas do dia
      for (let i = 0; i < templateDay.tasks.length; i++) {
        const task = templateDay.tasks[i];
        await prisma.protocolTask.create({
          data: {
            title: task.title,
            description: task.description,
            protocolDayId: protocolDay.id,
            order: i
          }
        });
      }

      // Criar conteúdos do dia se existirem
      if (templateDay.contents) {
        for (let i = 0; i < templateDay.contents.length; i++) {
          const content = templateDay.contents[i];
          await prisma.protocolContent.create({
            data: {
              type: content.type,
              title: content.title,
              content: content.content,
              description: content.description,
              protocolDayId: protocolDay.id,
              order: i
            }
          });
        }
      }
    }

    // Aplicar customizações se fornecidas
    if (customizations && Array.isArray(customizations)) {
      for (const customization of customizations) {
        if (customization.type === 'add_task') {
          const day = await prisma.protocolDay.findFirst({
            where: {
              protocolId: protocol.id,
              dayNumber: customization.dayNumber
            }
          });

          if (day) {
            await prisma.protocolTask.create({
              data: {
                title: customization.title,
                description: customization.description,
                protocolDayId: day.id,
                order: customization.order || 999
              }
            });
          }
        }
      }
    }

    // Buscar protocolo completo para retornar
    const completeProtocol = await prisma.protocol.findUnique({
      where: { id: protocol.id },
      include: {
        days: {
          include: {
            tasks: true,
            contents: true
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    });

    return NextResponse.json(completeProtocol, { status: 201 });
  } catch (error) {
    console.error('Error creating protocol from template:', error);
    return NextResponse.json({ error: 'Erro ao criar protocolo a partir do template' }, { status: 500 });
  }
} 