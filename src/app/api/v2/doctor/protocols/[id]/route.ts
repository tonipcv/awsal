import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { Prisma } from '@prisma/client';

// GET /doctor/protocols/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }
    const id = params.id;
    const protocol = await prisma.protocol.findUnique({
      where: { id, doctor_id: user.id },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            sessions: {
              orderBy: { sessionNumber: 'asc' },
              include: {
                tasks: { orderBy: { orderIndex: 'asc' } }
              }
            }
          }
        }
      }
    });
    if (!protocol) {
      return NextResponse.json({ success: false, message: 'Protocolo não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        id: protocol.id,
        name: protocol.name,
        description: protocol.description,
        is_active: protocol.is_active,
        duration: protocol.duration,
        days: protocol.days.map(day => ({
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          sessions: day.sessions.map(session => ({
            id: session.id,
            sessionNumber: session.sessionNumber,
            title: session.title,
            description: session.description,
            tasks: session.tasks.map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              type: task.type,
              duration: task.duration,
              orderIndex: task.orderIndex
            }))
          }))
        }))
      },
      message: 'Detalhes do protocolo carregados com sucesso'
    });
  } catch (error) {
    console.error(`Error in GET /api/v2/doctor/protocols/${params.id}:`, error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// PATCH /doctor/protocols/:id
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }
    const id = params.id;
    const data = await request.json();
    const updated = await prisma.protocol.update({
      where: { id, doctor_id: user.id },
      data: {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        duration: data.duration,
        modal_title: data.modal_title,
        modal_video_url: data.modal_video_url,
        modal_description: data.modal_description,
        modal_button_text: data.modal_button_text,
        modal_button_url: data.modal_button_url,
        show_doctor_info: data.show_doctor_info,
        is_template: data.is_template,
        cover_image: data.cover_image,
        consultation_date: data.consultation_date
      }
    });
    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        is_active: updated.is_active,
        duration: updated.duration
      },
      message: 'Protocolo atualizado com sucesso'
    });
  } catch (error) {
    console.error(`Error in PATCH /api/v2/doctor/protocols/${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Protocolo não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Dados inválidos ou erro interno.' }, { status: 400 });
  }
}

// DELETE /doctor/protocols/:id
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }
    const id = params.id;
    await prisma.protocol.update({
      where: { id, doctor_id: user.id },
      data: { is_active: false } // Soft delete
    });
    return NextResponse.json({ success: true, message: 'Protocolo removido com sucesso' });
  } catch (error) {
    console.error(`Error in DELETE /api/v2/doctor/protocols/${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Protocolo não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
