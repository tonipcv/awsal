import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { protocolId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar acesso ao protocolo
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        user_id: user.id,
        protocol_id: params.protocolId,
        status: 'ACTIVE'
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Você não tem acesso a este protocolo' },
        { status: 403 }
      );
    }

    // Buscar cursos do protocolo
    const protocolCourses = await prisma.protocolCourse.findMany({
      where: {
        protocolId: params.protocolId
      },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            coverImage: true,
            modules: {
              select: {
                _count: {
                  select: {
                    lessons: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Buscar progresso dos cursos
    const courseIds = protocolCourses.map(pc => pc.course.id);
    const progress = await prisma.userCourse.findMany({
      where: {
        userId: user.id,
        courseId: { in: courseIds }
      },
      select: {
        courseId: true,
        progress: true,
        completedAt: true,
        enrolledAt: true
      }
    });

    // Buscar lições completadas
    const completedLessons = await prisma.userLesson.findMany({
      where: {
        userId: user.id,
        completedAt: { not: null },
        lesson: {
          module: {
            courseId: {
              in: courseIds
            }
          }
        }
      },
      select: {
        lesson: {
          select: {
            module: {
              select: {
                courseId: true
              }
            }
          }
        }
      }
    });

    // Agrupar lições completadas por curso
    const completedByCourse = completedLessons.reduce((acc, lesson) => {
      const courseId = lesson.lesson.module.courseId;
      acc[courseId] = (acc[courseId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Formatar resposta
    const courses = protocolCourses.map(pc => {
      const courseProgress = progress.find(p => p.courseId === pc.course.id);
      const totalLessons = pc.course.modules.reduce((acc, m) => acc + m._count.lessons, 0);

      return {
        id: pc.course.id,
        title: pc.course.title,
        description: pc.course.description,
        thumbnail: pc.course.thumbnail,
        coverImage: pc.course.coverImage,
        totalLessons,
        progress: courseProgress ? {
          progress: courseProgress.progress,
          completedAt: courseProgress.completedAt,
          startedAt: courseProgress.enrolledAt,
          lessonsCompleted: completedByCourse[pc.course.id] || 0
        } : {
          progress: 0,
          completedAt: null,
          startedAt: null,
          lessonsCompleted: 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      courses,
      message: 'Cursos do protocolo carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/protocols/[protocolId]/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 