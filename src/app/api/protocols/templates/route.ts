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
            sessions: {
              include: {
                tasks: {
                  include: {
                    ProtocolContent: true
                  }
                }
              }
            }
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

    // Transformar para formato esperado pelo frontend
    const transformedCustomTemplates = customTemplates.map(template => ({
      ...template,
      days: template.days.map(day => ({
        ...day,
        tasks: day.sessions.flatMap(session => 
          session.tasks.map(task => ({
            ...task,
            contents: task.ProtocolContent || []
          }))
        ),
        contents: day.sessions.flatMap(session => 
          session.tasks.flatMap(task => task.ProtocolContent || [])
        )
      }))
    }));

    return NextResponse.json({
      predefined: PROTOCOL_TEMPLATES,
      custom: transformedCustomTemplates
    });
  } catch (error) {
    console.error('Error fetching templates:', error instanceof Error ? error.message : 'Erro desconhecido');
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
          title: `Dia ${templateDay.dayNumber}`,
          description: null,
          protocolId: protocol.id
        }
      });

      // Criar uma sessão padrão para o dia
      const protocolSession = await prisma.protocolSession.create({
        data: {
          sessionNumber: 1,
          title: 'Sessão Principal',
          description: 'Sessão principal do dia',
          protocolDayId: protocolDay.id
        }
      });

      // Criar tarefas da sessão
      for (let i = 0; i < templateDay.tasks.length; i++) {
        const task = templateDay.tasks[i];
        const protocolTask = await prisma.protocolTask.create({
          data: {
            title: task.title,
            description: task.description,
            type: 'task',
            duration: null,
            orderIndex: i,
            protocolSessionId: protocolSession.id
          }
        });
      }

      // Criar conteúdos do dia se existirem (como conteúdos de uma tarefa geral)
      if (templateDay.contents && Array.isArray(templateDay.contents)) {
        // Criar uma tarefa geral para os conteúdos do dia
        const generalTask = await prisma.protocolTask.create({
          data: {
            title: 'Conteúdos do Dia',
            description: 'Conteúdos gerais do dia',
            type: 'content',
            orderIndex: 999,
            protocolSessionId: protocolSession.id
          }
        });

        for (let i = 0; i < templateDay.contents.length; i++) {
          const content = templateDay.contents[i];
          await prisma.protocolContent.create({
            data: {
              type: content.type,
              content: content.content,
              orderIndex: i,
              protocolTaskId: generalTask.id
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
            },
            include: {
              sessions: true
            }
          });

          if (day && day.sessions.length > 0) {
            await prisma.protocolTask.create({
              data: {
                title: customization.title,
                description: customization.description,
                type: 'task',
                orderIndex: customization.order || 999,
                protocolSessionId: day.sessions[0].id
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
            sessions: {
              include: {
                tasks: {
                  include: {
                    ProtocolContent: true
                  }
                }
              }
            }
          },
          orderBy: {
            dayNumber: 'asc'
          }
        }
      }
    });

    // Transformar para formato esperado
    const transformedProtocol = {
      ...completeProtocol,
      days: completeProtocol?.days.map(day => ({
        ...day,
        tasks: day.sessions.flatMap(session => 
          session.tasks.map(task => ({
            ...task,
            contents: task.ProtocolContent || []
          }))
        ),
        contents: day.sessions.flatMap(session => 
          session.tasks.flatMap(task => task.ProtocolContent || [])
        )
      })) || []
    };

    return NextResponse.json(transformedProtocol, { status: 201 });
  } catch (error) {
    console.error('Error creating protocol from template:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro ao criar protocolo a partir do template' }, { status: 500 });
  }
} 