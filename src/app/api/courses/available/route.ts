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

    // Transform courses to match frontend interface
    const activeCourses = userCourses.map(uc => ({
      ...uc.course,
      name: uc.course.title, // Map title to name for frontend compatibility
      status: 'active',
      modalTitle: null,
      modalVideoUrl: null,
      modalDescription: null,
      modalButtonText: 'Saber mais',
      modalButtonUrl: null,
      modules: uc.course.modules.map(module => ({
        ...module,
        name: module.title // Map module title to name as well
      }))
    }));

    return NextResponse.json({
      active: activeCourses,
      unavailable: []
    });
  } catch (error) {
    console.error('Error fetching available courses:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 