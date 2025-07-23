import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { Prisma } from '@prisma/client';

// GET /doctor/courses/:id
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id, doctorId: user.id },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, message: 'Curso não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: course, message: 'Curso carregado com sucesso.' });

  } catch (error) {
    console.error(`Error in GET /api/v2/doctor/courses/${params.id}:`, error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// PATCH /doctor/courses/:id
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { 
      title, description, price, isPublished, coverImage, 
      modalTitle, modalVideoUrl, modalDescription, modalButtonText, modalButtonUrl 
    } = body;

    const updatedCourse = await prisma.course.update({
      where: { id: params.id, doctorId: user.id },
      data: {
        title,
        description,
        price,
        isPublished,
        thumbnail: coverImage,
        modalTitle,
        modalVideoUrl,
        modalDescription,
        modalButtonText,
        modalButtonUrl,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        isPublished: updatedCourse.isPublished,
        price: updatedCourse.price,
      },
      message: 'Curso atualizado com sucesso',
    });

  } catch (error) {
    console.error(`Error in PATCH /api/v2/doctor/courses/${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Curso não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Dados inválidos ou erro interno.' }, { status: 400 });
  }
}

// DELETE /doctor/courses/:id
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    await prisma.course.delete({
      where: { id: params.id, doctorId: user.id },
    });

    return NextResponse.json({ success: true, message: 'Curso removido com sucesso.' });

  } catch (error) {
    console.error(`Error in DELETE /api/v2/doctor/courses/${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Curso não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
