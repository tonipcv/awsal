import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

// POST /api/v2/patients/courses/[courseId]/lessons/[lessonId]/progress
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { courseId, lessonId } = params;

    // Verificar se o usuário tem acesso ao curso via protocolo
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: {
        user_id: user.id,
        status: 'ACTIVE',
        protocol: {
          courses: {
            some: {
              courseId
            }
          }
        }
      }
    });

    if (!prescriptions.length) {
      return NextResponse.json(
        { error: 'Course not found or not assigned' },
        { status: 404 }
      );
    }

    // Verificar se a lição existe e pertence ao curso
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          courseId
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Buscar ou criar progresso do curso
    let userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: user.id,
        courseId
      }
    });

    if (!userCourse) {
      userCourse = await prisma.userCourse.create({
        data: {
          userId: user.id,
          courseId,
          enrolledAt: new Date(),
          progress: 0
        }
      });
    }

    // Verificar se já existe progresso para esta lição
    const existingProgress = await prisma.userLesson.findFirst({
      where: {
        userId: user.id,
        lessonId
      }
    });

    let progress;
    if (existingProgress) {
      // Atualizar progresso existente
      progress = await prisma.userLesson.update({
        where: { id: existingProgress.id },
        data: {
          completedAt: new Date()
        }
      });
    } else {
      // Criar novo progresso
      progress = await prisma.userLesson.create({
        data: {
          userId: user.id,
          lessonId,
          completedAt: new Date()
        }
      });
    }

    // Calcular progresso geral do curso
    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          courseId
        }
      }
    });

    const completedLessons = await prisma.userLesson.count({
      where: {
        userId: user.id,
        lesson: {
          module: {
            courseId
          }
        },
        completedAt: { not: null }
      }
    });

    const courseProgress = Math.round((completedLessons / totalLessons) * 100);

    // Atualizar progresso do curso
    await prisma.userCourse.update({
      where: { id: userCourse.id },
      data: {
        progress: courseProgress,
        completedAt: courseProgress === 100 ? new Date() : null
      }
    });

    return NextResponse.json({
      success: true,
      progress: {
        lessonId,
        courseId,
        completedAt: progress.completedAt,
        courseProgress
      },
      message: 'Progresso registrado com sucesso'
    });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/courses/[courseId]/lessons/[lessonId]/progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 