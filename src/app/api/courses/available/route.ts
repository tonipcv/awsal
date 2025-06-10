import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with doctor relationship
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        doctorId: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For patients, only show courses from their doctor
    // For doctors, show their own courses
    const doctorId = user.role === 'PATIENT' ? user.doctorId : user.id;

    if (!doctorId) {
      return NextResponse.json({ 
        active: [], 
        unavailable: [] 
      });
    }

    // Get user's assigned courses
    const userCourses = await prisma.userCourse.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
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
                  select: {
                    id: true,
                    title: true,
                    duration: true
                  }
                }
              },
              orderBy: {
                orderIndex: 'asc'
              }
            },
            _count: {
              select: {
                modules: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Get all courses from the doctor (for unavailable courses)
    const allDoctorCourses = await prisma.course.findMany({
      where: { 
        doctorId: doctorId,
        isPublished: true
      },
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
              select: {
                id: true,
                title: true,
                duration: true
              }
            }
          },
          orderBy: {
            orderIndex: 'asc'
          }
        },
        _count: {
          select: {
            modules: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get assigned course IDs
    const assignedCourseIds = userCourses.map(uc => uc.course.id);

    // Transform active courses
    const activeCourses = userCourses.map(uc => ({
      ...uc.course,
      name: uc.course.title, // Map title to name for frontend compatibility
      coverImage: uc.course.coverImage, // Explicitly include coverImage
      modalTitle: uc.course.modalTitle,
      modalVideoUrl: uc.course.modalVideoUrl,
      modalDescription: uc.course.modalDescription,
      modalButtonText: uc.course.modalButtonText || 'Saber mais',
      modalButtonUrl: uc.course.modalButtonUrl,
      status: 'active',
      modules: uc.course.modules.map(module => ({
        ...module,
        name: module.title // Map module title to name as well
      }))
    }));

    // Transform unavailable courses (courses from doctor that are not assigned to patient)
    const unavailableCourses = allDoctorCourses
      .filter(course => !assignedCourseIds.includes(course.id))
      .map(course => ({
        ...course,
        name: course.title, // Map title to name for frontend compatibility
        coverImage: course.coverImage, // Explicitly include coverImage
        modalTitle: course.modalTitle,
        modalVideoUrl: course.modalVideoUrl,
        modalDescription: course.modalDescription,
        modalButtonText: course.modalButtonText || 'Saber mais',
        modalButtonUrl: course.modalButtonUrl,
        status: 'unavailable',
        modules: course.modules.map(module => ({
          ...module,
          name: module.title // Map module title to name as well
        }))
      }));

    return NextResponse.json({
      active: activeCourses,
      unavailable: unavailableCourses
    });
  } catch (error) {
    console.error('Error fetching available courses:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 