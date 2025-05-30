import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, lessonId } = await params;

    // Verify that the user has access to this course
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId
      }
    });

    if (!userCourse) {
      return NextResponse.json({ error: 'Course not assigned to you' }, { status: 403 });
    }

    // Verify that the lesson belongs to this course (through module)
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          courseId: courseId
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found in this course' }, { status: 404 });
    }

    // Create or update the user lesson progress
    const userLesson = await prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId
        }
      },
      update: {
        completedAt: new Date()
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        completedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      completed: true,
      completedAt: userLesson.completedAt 
    });

  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId, lessonId } = await params;

    // Verify that the user has access to this course
    const userCourse = await prisma.userCourse.findFirst({
      where: {
        userId: session.user.id,
        courseId: courseId
      }
    });

    if (!userCourse) {
      return NextResponse.json({ error: 'Course not assigned to you' }, { status: 403 });
    }

    // Mark lesson as not completed
    await prisma.userLesson.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId
        }
      },
      update: {
        completedAt: null
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        completedAt: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      completed: false 
    });

  } catch (error) {
    console.error('Error unmarking lesson completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 