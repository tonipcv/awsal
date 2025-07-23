import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search')?.toLowerCase();
    // Verificar se os parâmetros existem e converter para boolean
    const hasIsTemplate = searchParams.has('is_template');
    const hasIsActive = searchParams.has('is_active');
    const isTemplate = searchParams.get('is_template') === 'true';
    const isActive = searchParams.get('is_active') === 'true';

    // Buscar protocolos
    const protocols = await prisma.protocol.findMany({
      where: {
        doctor_id: user.id,
        ...(hasIsTemplate && { is_template: isTemplate }),
        ...(hasIsActive && { is_active: isActive })
      },
      select: {
        id: true,
        name: true,
        description: true,
        is_active: true,
        is_template: true,
        cover_image: true,
        duration: true,
        created_at: true,
        updated_at: true,
        courses: {
          select: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true
              }
            }
          }
        },
        prescriptions: {
          where: {
            status: { in: ['ACTIVE', 'PRESCRIBED'] }
          },
          select: {
            id: true,
            status: true,
            patient: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Filtrar por busca se houver
    let filteredProtocols = protocols;
    if (search) {
      filteredProtocols = protocols.filter(protocol => 
        protocol.name.toLowerCase().includes(search) ||
        protocol.description?.toLowerCase().includes(search)
      );
    }

    // Aplicar paginação
    const paginatedProtocols = filteredProtocols.slice(offset, offset + limit);

    // Formatar resposta
    const formattedProtocols = paginatedProtocols.map(protocol => ({
      id: protocol.id,
      name: protocol.name,
      description: protocol.description,
      isActive: protocol.is_active,
      isTemplate: protocol.is_template,
      coverImage: protocol.cover_image,
      duration: protocol.duration,
      createdAt: protocol.created_at,
      updatedAt: protocol.updated_at,
      courses: protocol.courses.map(c => ({
        id: c.course.id,
        title: c.course.title,
        thumbnail: c.course.thumbnail
      })),
      activePatients: protocol.prescriptions.map(p => ({
        prescriptionId: p.id,
        status: p.status,
        patient: {
          id: p.patient.id,
          name: p.patient.name,
          email: p.patient.email
        }
      }))
    }));

    return NextResponse.json({
      success: true,
      protocols: formattedProtocols,
      pagination: {
        total: filteredProtocols.length,
        limit,
        offset,
        hasMore: offset + limit < filteredProtocols.length
      },
      message: 'Protocolos carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/doctor/protocols:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /doctor/protocols
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const body = await request.json();

    const {
      name,
      description,
      is_active,
      duration,
      modal_title,
      modal_video_url,
      modal_description,
      modal_button_text,
      modal_button_url,
      show_doctor_info,
      is_template,
      cover_image,
      consultation_date,
      days
    } = body;

    if (!name || !days || !Array.isArray(days)) {
      return NextResponse.json({ success: false, message: 'Dados inválidos: Nome e dias são obrigatórios.' }, { status: 400 });
    }

    const newProtocol = await prisma.protocol.create({
      data: {
        doctor_id: user.id,
        name,
        description,
        is_active,
        duration,
        modal_title,
        modal_video_url,
        modal_description,
        modal_button_text,
        modal_button_url,
        show_doctor_info,
        is_template,
        cover_image,
        consultation_date,
        days: {
          create: days.map((day: any) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            sessions: {
              create: day.sessions.map((session: any) => ({
                sessionNumber: session.sessionNumber,
                title: session.title,
                description: session.description,
                tasks: {
                  create: session.tasks.map((task: any) => ({
                    title: task.title,
                    description: task.description,
                    type: task.type,
                    duration: task.duration,
                    orderIndex: task.orderIndex,
                    hasMoreInfo: task.hasMoreInfo,
                    videoUrl: task.videoUrl,
                    fullExplanation: task.fullExplanation,
                    modalTitle: task.modalTitle,
                    modalButtonText: task.modalButtonText,
                    modalButtonUrl: task.modalButtonUrl
                  }))
                }
              }))
            }
          }))
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newProtocol.id,
        name: newProtocol.name,
        description: newProtocol.description,
        is_active: newProtocol.is_active,
        duration: newProtocol.duration
      },
      message: 'Protocolo criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v2/doctor/protocols:', error);
    return NextResponse.json({ success: false, message: 'Dados inválidos ou erro interno do servidor.' }, { status: 400 });
  }
} 