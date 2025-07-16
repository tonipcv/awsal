import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { isPublished } = body;

    if (typeof isPublished !== 'boolean') {
      return NextResponse.json({ error: 'isPublished must be a boolean' }, { status: 400 });
    }

    // Check if course exists and belongs to doctor
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        doctorId: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update course publication status
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        isPublished
      }
    });

    return NextResponse.json({
      success: true,
      isPublished: updatedCourse.isPublished
    });
  } catch (error) {
    console.error('Error updating course publication status:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 