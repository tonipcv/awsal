import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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
        { error: 'Você não tem acesso a este curso' },
        { status: 403 }
      );
    }

    // Buscar módulos e aulas
    const course = await prisma.course.findUnique({
      where: {
        id: params.courseId
      },
      select: {
        id: true,
        title: true,
        modules: {
          orderBy: {
            orderIndex: 'asc'
          },
          select: {
            id: true,
            title: true,
            description: true,
            orderIndex: true,
            lessons: {
              orderBy: {
                orderIndex: 'asc'
              },
              select: {
                id: true,
                title: true,
                duration: true,
                videoUrl: true,
                orderIndex: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Curso não encontrado' },
        { status: 404 }
      );
    }

    // Buscar progresso das aulas
    const lessonProgress = await prisma.userLesson.findMany({
      where: {
        userId: user.id,
        lesson: {
          module: {
            courseId: params.courseId
          }
        }
      },
      select: {
        lessonId: true,
        completedAt: true,
        watchTime: true
      }
    });

    // Mapear progresso para os módulos
    const modulesWithProgress = course.modules.map(module => ({
      ...module,
      lessons: module.lessons.map(lesson => {
        const progress = lessonProgress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          completed: !!progress?.completedAt,
          watchTime: progress?.watchTime || 0
        };
      })
    }));

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        modules: modulesWithProgress
      },
      message: 'Módulos carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/courses/[courseId]/modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 