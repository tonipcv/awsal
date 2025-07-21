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

    const { courseId } = params;

    // Verificar se o usuário tem acesso ao curso através de alguma prescrição
    const hasAccess = await prisma.protocolPrescription.findFirst({
      where: {
        user_id: user.id,
        status: 'ACTIVE',
        protocol: {
          courses: {
            some: {
              courseId: courseId
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

    // Buscar o curso com seus módulos e lições
    const course = await prisma.course.findUnique({
      where: {
        id: courseId
      },
      include: {
        modules: {
          orderBy: {
            orderIndex: 'asc'
          },
          include: {
            lessons: {
              orderBy: {
                orderIndex: 'asc'
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

    // Buscar o progresso do usuário nas lições
    const userLessons = await prisma.userLesson.findMany({
      where: {
        userId: user.id,
        lesson: {
          module: {
            courseId: courseId
          }
        }
      }
    });

    // Mapear o progresso das lições
    const modules = course.modules.map(module => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.orderIndex,
      lessons: module.lessons.map(lesson => {
        const userLesson = userLessons.find(ul => ul.lessonId === lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          orderIndex: lesson.orderIndex,
          completed: userLesson?.completedAt ? true : false,
          watchTime: userLesson?.watchTime || 0
        };
      })
    }));

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        modules
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/courses/[courseId]/lessons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 