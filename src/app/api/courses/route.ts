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

    // Get user role from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    // Build where clause
    const where: any = {};
    
    // If user is a doctor, show only their courses
    if (user?.role === 'DOCTOR') {
      where.doctorId = session.user.id;
    }

    const courses = await prisma.course.findMany({
      where,
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
        },
        _count: {
          select: {
            modules: true,
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to expected format
    const transformedCourses = courses.map(course => ({
      ...course,
      name: course.title, // Map title to name for frontend compatibility
      modalTitle: null,
      modalVideoUrl: null,
      modalDescription: null,
      modalButtonText: 'Saber mais',
      modalButtonUrl: null,
      lessons: [], // Remove direct lessons since they don't exist in this structure
      _count: {
        ...course._count,
        lessons: course.modules.reduce((total, module) => total + module.lessons.length, 0)
      }
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      thumbnail,
      price,
      modules = []
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title: name.trim(), // Use title instead of name
        description: description?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        price: price ? parseFloat(price) : null,
        doctorId: session.user.id,
        modules: {
          create: modules.map((module: any, index: number) => ({
            title: module.name || module.title,
            description: module.description || null,
            orderIndex: index,
            lessons: {
              create: (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
                title: lesson.title,
                content: lesson.content || null,
                videoUrl: lesson.videoUrl || null,
                duration: lesson.duration && lesson.duration > 0 ? lesson.duration : null,
                orderIndex: lessonIndex
              }))
            }
          }))
        }
      },
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: {
            orderIndex: 'asc'
          }
        }
      }
    });

    // Transform response to expected format
    const transformedCourse = {
      ...course,
      name: course.title,
      modalTitle: null,
      modalVideoUrl: null,
      modalDescription: null,
      modalButtonText: 'Saber mais',
      modalButtonUrl: null
    };

    return NextResponse.json(transformedCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 