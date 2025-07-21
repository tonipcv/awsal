import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const completeSchema = z.object({
  watchTime: z.number().optional() // tempo assistido em segundos
});

export async function POST(
  request: NextRequest,
  { params }: { params: { protocolId: string; courseId: string; lessonId: string } }
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
        { error: 'Você não tem acesso a esta aula' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { watchTime } = completeSchema.parse(body);

    // Buscar ou criar progresso da aula
    let progress = await prisma.userLesson.findFirst({
      where: {
        userId: user.id,
        lessonId: params.lessonId
      }
    });

    if (progress) {
      // Alternar o status
      progress = await prisma.userLesson.update({
        where: { id: progress.id },
        data: {
          completedAt: progress.completedAt ? null : new Date(),
          watchTime: watchTime || progress.watchTime
        }
      });
    } else {
      // Criar novo progresso
      progress = await prisma.userLesson.create({
        data: {
          userId: user.id,
          lessonId: params.lessonId,
          completedAt: new Date(),
          watchTime: watchTime || 0
        }
      });
    }

    // Buscar total de lições e lições completadas
    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          courseId: params.courseId
        }
      }
    });

    const completedLessons = await prisma.userLesson.count({
      where: {
        userId: user.id,
        lesson: {
          module: {
            courseId: params.courseId
          }
        },
        completedAt: { not: null }
      }
    });

    // Atualizar progresso do curso
    const courseProgress = Math.round((completedLessons / totalLessons) * 100);
    let userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: user.id,
        courseId: params.courseId
      }
    });

    if (userCourse) {
      userCourse = await prisma.userCourse.update({
        where: { id: userCourse.id },
        data: {
          progress: courseProgress,
          completedAt: courseProgress === 100 ? new Date() : null
        }
      });
    } else {
      userCourse = await prisma.userCourse.create({
        data: {
          userId: user.id,
          courseId: params.courseId,
          progress: courseProgress,
          completedAt: courseProgress === 100 ? new Date() : null
        }
      });
    }

    return NextResponse.json({
      success: true,
      progress: {
        lessonId: progress.lessonId,
        completed: !!progress.completedAt,
        completedAt: progress.completedAt,
        watchTime: progress.watchTime
      },
      courseProgress: {
        progress: userCourse.progress,
        completedAt: userCourse.completedAt,
        totalLessons,
        completedLessons
      },
      message: `Aula ${progress.completedAt ? 'marcada' : 'desmarcada'} como concluída`
    });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/protocols/[protocolId]/courses/[courseId]/lessons/[lessonId]/complete:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 