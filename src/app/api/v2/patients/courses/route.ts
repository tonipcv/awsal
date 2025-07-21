import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { PrescriptionStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = (searchParams.get('status') || 'ACTIVE') as PrescriptionStatus;
    const search = searchParams.get('search')?.toLowerCase();

    // Buscar prescrições ativas do paciente
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: {
        user_id: user.id,
        status
      },
      select: {
        id: true,
        protocol_id: true,
        protocol: {
          select: {
            id: true,
            courses: {
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
                        lessons: {
                          select: {
                            id: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Extrair e formatar cursos
    type CourseInfo = {
      id: string;
      title: string;
      description: string | null;
      thumbnail: string | null;
      coverImage: string | null;
      protocolId: string;
      prescriptionId: string;
      totalLessons: number;
    };

    let courses: CourseInfo[] = prescriptions.flatMap(prescription => 
      prescription.protocol.courses.map(pc => ({
        id: pc.course.id,
        title: pc.course.title,
        description: pc.course.description,
        thumbnail: pc.course.thumbnail,
        coverImage: pc.course.coverImage,
        protocolId: prescription.protocol.id,
        prescriptionId: prescription.id,
        totalLessons: pc.course.modules.reduce((acc: number, m) => 
          acc + m.lessons.length, 0
        )
      }))
    );

    // Aplicar busca se houver
    if (search) {
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(search) ||
        (course.description?.toLowerCase() || '').includes(search)
      );
    }

    // Aplicar paginação
    const paginatedCourses = courses.slice(offset, offset + limit);

    // Buscar progresso apenas dos cursos paginados
    const courseIds = paginatedCourses.map(c => c.id);
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

    // Mapear progresso para os cursos
    const coursesWithProgress = paginatedCourses.map(course => {
      const courseProgress = progress.find(p => p.courseId === course.id);
      return {
        ...course,
        progress: courseProgress ? {
          progress: courseProgress.progress,
          completedAt: courseProgress.completedAt,
          startedAt: courseProgress.enrolledAt,
          lessonsCompleted: completedByCourse[course.id] || 0
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
      courses: coursesWithProgress,
      pagination: {
        total: courses.length,
        limit,
        offset,
        hasMore: offset + limit < courses.length
      },
      message: 'Cursos carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 