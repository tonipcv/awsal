import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// GET /api/protocols/[id]/courses/patient - Buscar cursos associados ao protocolo (visão do paciente)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const protocolId = resolvedParams.id;

    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true
      }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem acessar esta funcionalidade.' }, { status: 403 });
    }

    // Verificar se o paciente tem o protocolo atribuído e ativo
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        userId: userId,
        protocolId: protocolId,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou não está ativo para este paciente' }, { status: 404 });
    }

    // Buscar cursos do protocolo
    const protocolCourses = await prisma.protocolCourse.findMany({
      where: {
        protocolId: protocolId
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: {
                    orderIndex: 'asc'
                  }
                }
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    // Buscar progresso do paciente nos cursos
    const userLessons = await prisma.userLesson.findMany({
      where: {
        userId: userId,
        lesson: {
          module: {
            courseId: {
              in: protocolCourses.map(pc => pc.courseId)
            }
          }
        }
      }
    });

    // Criar mapa de progresso dos cursos
    const courseProgress = new Map();
    for (const lesson of userLessons) {
      const module = await prisma.module.findUnique({
        where: { id: lesson.moduleId },
        select: { courseId: true }
      });
      if (module) {
        const courseId = module.courseId;
        if (!courseProgress.has(courseId)) {
          courseProgress.set(courseId, {
            isEnrolled: true,
            completedLessons: 0
          });
        }
        if (lesson.completedAt) {
          const progress = courseProgress.get(courseId);
          progress.completedLessons++;
          courseProgress.set(courseId, progress);
        }
      }
    }

    // Transformar dados para o formato esperado pelo frontend
    const transformedCourses = protocolCourses.map(pc => {
      const progress = courseProgress.get(pc.courseId) || { isEnrolled: false, completedLessons: 0 };
      const totalLessons = pc.course.modules.reduce(
        (total, module) => total + module.lessons.length,
        0
      );

      return {
        id: pc.id,
        courseId: pc.courseId,
        protocolId: pc.protocolId,
        orderIndex: pc.orderIndex,
        isRequired: pc.isRequired,
        course: {
          ...pc.course,
          name: pc.course.title,
          modules: pc.course.modules.map(module => ({
            ...module,
            name: module.title
          })),
          progress: {
            isEnrolled: progress.isEnrolled,
            completedLessons: progress.completedLessons,
            totalLessons: totalLessons,
            percentage: totalLessons > 0 ? Math.round((progress.completedLessons / totalLessons) * 100) : 0
          }
        }
      };
    });

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching protocol courses for patient:', error);
    return NextResponse.json({ error: 'Erro ao buscar cursos do protocolo' }, { status: 500 });
  }
} 