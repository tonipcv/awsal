import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'DOCTOR') {
      // Doctor view - full course data
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
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
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Check if doctor owns the course
      if (course.doctorId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Transform to expected format
      const transformedCourse = {
        ...course,
        name: course.title,
        modalTitle: course.modalTitle || null,
        modalVideoUrl: course.modalVideoUrl || null,
        modalDescription: course.modalDescription || null,
        modalButtonText: course.modalButtonText || 'Saber mais',
        modalButtonUrl: course.modalButtonUrl || null,
        lessons: [] // Remove direct lessons since they don't exist in this structure
      };

      return NextResponse.json(transformedCourse);
    } else {
      // Patient view - course data with assignment info and lesson completion
      const assignment = await prisma.userCourse.findFirst({
        where: {
          userId: session.user.id,
          courseId: id
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
        }
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Course not assigned to you' }, { status: 403 });
      }

      // Get user's lesson completion data
      const userLessons = await prisma.userLesson.findMany({
        where: {
          userId: session.user.id,
          lesson: {
            moduleId: {
              in: assignment.course.modules.map(m => m.id)
            }
          }
        },
        select: {
          lessonId: true,
          completedAt: true
        }
      });

      // Create a map for quick lookup
      const completionMap = new Map(
        userLessons.map(ul => [ul.lessonId, { completed: !!ul.completedAt, completedAt: ul.completedAt }])
      );

      // Add completion data to lessons
      const courseWithCompletion = {
        ...assignment.course,
        name: assignment.course.title,
        modules: assignment.course.modules.map(module => ({
          ...module,
          lessons: module.lessons.map(lesson => ({
            ...lesson,
            completed: completionMap.get(lesson.id)?.completed || false,
            completedAt: completionMap.get(lesson.id)?.completedAt || null
          }))
        })),
        lessons: [] // Remove direct lessons
      };

      // Calculate progress
      const allLessons = courseWithCompletion.modules.flatMap(m => m.lessons);
      const completedLessons = allLessons.filter(l => l.completed).length;
      const progress = allLessons.length > 0 ? Math.round((completedLessons / allLessons.length) * 100) : 0;

      // Return course data with assignment info and completion data
      const courseWithAssignment = {
        ...courseWithCompletion,
        assignment: {
          id: assignment.id,
          enrolledAt: assignment.enrolledAt,
          completedAt: assignment.completedAt,
          progress: progress
        }
      };

      return NextResponse.json(courseWithAssignment);
    }
  } catch (error) {
    console.error('Error fetching course:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      coverImage,
      thumbnail,
      price,
      modalTitle,
      modalDescription,
      modalVideoUrl,
      modalButtonText,
      modalButtonUrl,
      modules = []
    } = body;

    // Check if course exists and belongs to doctor
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: true
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (existingCourse.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }

    // Update course with transaction
    const updatedCourse = await prisma.$transaction(async (tx) => {
      // Delete existing modules and lessons
      await tx.lesson.deleteMany({
        where: { 
          moduleId: {
            in: existingCourse.modules.map(m => m.id)
          }
        }
      });
      await tx.module.deleteMany({
        where: { courseId: id }
      });

      // Update course basic info first
      const course = await tx.course.update({
        where: { id },
        data: {
          title: name.trim(),
          description: description?.trim() || null,
          coverImage: coverImage?.trim() || null,
          thumbnail: thumbnail?.trim() || null,
          price: price ? parseFloat(price) : null,
          modalTitle: modalTitle?.trim() || null,
          modalVideoUrl: modalVideoUrl?.trim() || null,
          modalDescription: modalDescription?.trim() || null,
          modalButtonText: modalButtonText?.trim() || null,
          modalButtonUrl: modalButtonUrl?.trim() || null,
        }
      });

      // Create modules and their lessons
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const createdModule = await tx.module.create({
          data: {
            title: module.name || module.title || '',
            description: module.description || null,
            orderIndex: i,
            courseId: id
          }
        });

        // Create lessons for this module
        for (let j = 0; j < (module.lessons || []).length; j++) {
          const lesson = module.lessons[j];
          await tx.lesson.create({
            data: {
              title: lesson.title,
              content: lesson.content || null,
              videoUrl: lesson.videoUrl || null,
              duration: lesson.duration && lesson.duration > 0 ? lesson.duration : null,
              orderIndex: j,
              moduleId: createdModule.id
            }
          });
        }
      }

      // Return the updated course with all relations
      return await tx.course.findUnique({
        where: { id },
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
      });
    });

    // Transform response
    const transformedCourse = {
      ...updatedCourse,
      name: updatedCourse?.title,
      modalTitle: modalTitle || null,
      modalVideoUrl: modalVideoUrl || null,
      modalDescription: modalDescription || null,
      modalButtonText: modalButtonText || 'Saber mais',
      modalButtonUrl: modalButtonUrl || null,
      lessons: []
    };

    return NextResponse.json(transformedCourse);
  } catch (error) {
    console.error('Error updating course:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if course exists and belongs to doctor
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        doctorId: true,
        _count: {
          select: {
            assignments: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if course has active assignments
    if (course._count.assignments > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete course with active assignments' 
      }, { status: 400 });
    }

    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 