import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { Prisma } from '@prisma/client';

// GET /doctor/courses
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const isPublishedParam = searchParams.get('isPublished');

    const whereClause: Prisma.CourseWhereInput = {
      doctorId: user.id,
    };

    if (isPublishedParam) {
      whereClause.isPublished = isPublishedParam === 'true';
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.course.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        isPublished: course.isPublished,
        price: course.price,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      message: 'Cursos carregados com sucesso',
    });

  } catch (error) {
    console.error('Error in GET /api/v2/doctor/courses:', error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST /doctor/courses
interface LessonData {
  title: string;
  content?: string;
  videoUrl?: string;
  duration?: number;
  orderIndex?: number;
  isPublished?: boolean;
}

interface ModuleData {
  title: string;
  description?: string;
  orderIndex?: number;
  lessons: LessonData[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { 
      title, description, price, isPublished, coverImage, 
      modalTitle, modalVideoUrl, modalDescription, modalButtonText, modalButtonUrl, 
      modules 
    } = body;

    if (!title || !modules || !Array.isArray(modules)) {
        return NextResponse.json({ success: false, message: 'Título e módulos são obrigatórios.' }, { status: 400 });
    }

    const newCourse = await prisma.course.create({
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
        doctorId: user.id,
        modules: {
          create: modules.map((module: ModuleData) => ({
            title: module.title,
            description: module.description,
            orderIndex: module.orderIndex ?? 0,
            lessons: {
              create: module.lessons.map((lesson: LessonData) => ({
                title: lesson.title,
                content: lesson.content,
                videoUrl: lesson.videoUrl,
                duration: lesson.duration,
                orderIndex: lesson.orderIndex ?? 0,
                isPublished: lesson.isPublished,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newCourse.id,
        title: newCourse.title,
        description: newCourse.description,
        isPublished: newCourse.isPublished,
        price: newCourse.price,
      },
      message: 'Curso criado com sucesso',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v2/doctor/courses:', error);
    if (error instanceof Prisma.PrismaClientValidationError) {
        return NextResponse.json({ success: false, message: 'Dados inválidos. Verifique os campos fornecidos.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
