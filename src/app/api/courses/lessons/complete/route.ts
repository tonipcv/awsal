import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// POST - Marcar lição como concluída/não concluída
export async function POST(request: NextRequest) {
  try {
    // Tentar autenticação web primeiro
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // Se não há sessão web, tentar autenticação mobile
    if (!userId) {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem marcar lições como concluídas.' }, { status: 403 });
    }

    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'ID da lição é obrigatório' }, { status: 400 });
    }

    // Verificar se a lição existe e se o usuário tem acesso a ela
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                assignments: {
                  where: { userId: userId }
                }
              }
            }
          }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
    }

    if (!lesson.module.course.assignments.length) {
      return NextResponse.json({ error: 'Você não tem acesso a esta lição' }, { status: 403 });
    }

    // Verificar se já existe um registro de progresso
    const existingProgress = await prisma.userLesson.findUnique({
      where: {
        userId_lessonId: {
          userId: userId,
          lessonId: lessonId
        }
      }
    });

    let userLesson;
    let action: 'created' | 'toggled';

    if (existingProgress) {
      // Toggle completion status
      const newCompletedAt = existingProgress.completedAt ? null : new Date();
      
      userLesson = await prisma.userLesson.update({
        where: {
          userId_lessonId: {
            userId: userId,
            lessonId: lessonId
          }
        },
        data: {
          completedAt: newCompletedAt
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      action = 'toggled';
    } else {
      // Create new completion record
      userLesson = await prisma.userLesson.create({
        data: {
          userId: userId,
          lessonId: lessonId,
          completedAt: new Date()
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      action = 'created';
    }

    return NextResponse.json({
      success: true,
      userLesson: {
        id: userLesson.id,
        userId: userLesson.userId,
        lessonId: userLesson.lessonId,
        completedAt: userLesson.completedAt,
        isCompleted: !!userLesson.completedAt,
        lesson: {
          id: userLesson.lesson.id,
          title: userLesson.lesson.title,
          duration: userLesson.lesson.duration,
          course: {
            id: userLesson.lesson.module.course.id,
            name: userLesson.lesson.module.course.title
          }
        }
      },
      action,
      isCompleted: !!userLesson.completedAt
    });

  } catch (error) {
    console.error('Erro ao atualizar progresso da lição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 