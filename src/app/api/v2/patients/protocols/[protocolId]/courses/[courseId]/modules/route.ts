import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { protocolId: string; courseId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar acesso ao curso via protocolo
    const hasAccess = await prisma.protocolPrescription.findFirst({
      where: {
        user_id: user.id,
        protocol_id: params.protocolId,
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
        description: true,
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
                content: true,
                videoUrl: true,
                duration: true,
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
    const lessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const progress = await prisma.userLesson.findMany({
      where: {
        userId: user.id,
        lessonId: { in: lessonIds }
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
        const lessonProgress = progress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          completed: !!lessonProgress?.completedAt,
          watchTime: lessonProgress?.watchTime || 0
        };
      })
    }));

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        modules: modulesWithProgress
      },
      message: 'Módulos e aulas carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/protocols/[protocolId]/courses/[courseId]/modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 