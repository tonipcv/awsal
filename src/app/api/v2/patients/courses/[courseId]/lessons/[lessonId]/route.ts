import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar acesso ao curso via prescrição
    const hasAccess = await prisma.protocolPrescription.findFirst({
      where: {
        user_id: user.id,
        status: 'ACTIVE',
        protocol: {
          courses: {
            some: {
              courseId: params.courseId
            }
          }
        }
      }
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Você não tem acesso a esta aula' },
        { status: 403 }
      );
    }

    // Buscar detalhes da aula
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: params.lessonId,
        module: {
          courseId: params.courseId
        }
      },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        duration: true,
        orderIndex: true,
        module: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      );
    }

    // Buscar progresso da aula
    const progress = await prisma.userLesson.findFirst({
      where: {
        userId: user.id,
        lessonId: params.lessonId
      },
      select: {
        completedAt: true,
        watchTime: true
      }
    });

    // Buscar próxima aula no módulo
    const nextLesson = await prisma.lesson.findFirst({
      where: {
        moduleId: lesson.module.id,
        orderIndex: {
          gt: lesson.orderIndex
        }
      },
      orderBy: {
        orderIndex: 'asc'
      },
      select: {
        id: true,
        title: true
      }
    });

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        module: {
          id: lesson.module.id,
          title: lesson.module.title,
          course: {
            id: lesson.module.course.id,
            title: lesson.module.course.title
          }
        },
        progress: {
          completed: !!progress?.completedAt,
          watchTime: progress?.watchTime || 0,
          completedAt: progress?.completedAt
        },
        nextLesson: nextLesson || null
      },
      message: 'Detalhes da aula carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/courses/[courseId]/lessons/[lessonId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 