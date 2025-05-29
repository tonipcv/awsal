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

    // Get user's assigned courses with their status
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
                order: 'asc'
              }
            },
            lessons: {
              where: {
                moduleId: null
              },
              select: {
                id: true,
                title: true,
                duration: true
              },
              orderBy: {
                order: 'asc'
              }
            },
            _count: {
              select: {
                modules: true,
                lessons: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Separate courses by their assignment status
    const activeCourses = userCourses
      .filter(uc => uc.status === 'active')
      .map(uc => uc.course);

    const unavailableCourses = userCourses
      .filter(uc => uc.status === 'unavailable')
      .map(uc => uc.course);

    return NextResponse.json({
      active: activeCourses,
      unavailable: unavailableCourses
    });
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 