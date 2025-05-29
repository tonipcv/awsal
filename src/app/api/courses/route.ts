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
            order: 'asc'
          }
        },
        lessons: {
          where: {
            moduleId: null // Direct lessons without modules
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
            lessons: true,
            assignments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
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
      modalTitle,
      modalVideoUrl,
      modalDescription,
      modalButtonText,
      modalButtonUrl,
      modules = [],
      lessons = []
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        modalTitle: modalTitle?.trim() || null,
        modalVideoUrl: modalVideoUrl?.trim() || null,
        modalDescription: modalDescription?.trim() || null,
        modalButtonText: modalButtonText?.trim() || 'Saber mais',
        modalButtonUrl: modalButtonUrl?.trim() || null,
        doctorId: session.user.id,
        modules: {
          create: modules.map((module: any, index: number) => ({
            name: module.name,
            description: module.description || null,
            order: index,
            lessons: {
              create: (module.lessons || []).map((lesson: any, lessonIndex: number) => ({
                title: lesson.title,
                description: lesson.description || null,
                content: lesson.content || null,
                videoUrl: lesson.videoUrl || null,
                duration: lesson.duration && lesson.duration > 0 ? lesson.duration : null,
                order: lessonIndex
              }))
            }
          }))
        },
        lessons: {
          create: lessons.map((lesson: any, index: number) => ({
            title: lesson.title,
            description: lesson.description || null,
            content: lesson.content || null,
            videoUrl: lesson.videoUrl || null,
            duration: lesson.duration && lesson.duration > 0 ? lesson.duration : null,
            order: index,
            moduleId: null // Direct lesson without module
          }))
        }
      },
      include: {
        modules: {
          include: {
            lessons: true
          }
        },
        lessons: true
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 