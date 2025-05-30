import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json({ error: 'Only doctors can assign courses' }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, patientId } = body;

    if (!courseId || !patientId) {
      return NextResponse.json({ 
        error: 'Course ID and Patient ID are required' 
      }, { status: 400 });
    }

    // Verify course exists and belongs to doctor
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        doctorId: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Course does not belong to you' }, { status: 403 });
    }

    // Verify patient exists and belongs to doctor
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        doctorId: true
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    if (patient.role !== 'PATIENT' || patient.doctorId !== session.user.id) {
      return NextResponse.json({ error: 'Patient does not belong to you' }, { status: 403 });
    }

    // Check if course is already assigned to patient
    const existingAssignment = await prisma.userCourse.findUnique({
      where: {
        userId_courseId: {
          userId: patientId,
          courseId: courseId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json({ 
        error: 'Course is already assigned to this patient' 
      }, { status: 400 });
    }

    // Create course assignment
    const assignment = await prisma.userCourse.create({
      data: {
        userId: patientId,
        courseId: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning course:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Only doctors can view course assignments' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const courseId = searchParams.get('courseId');

    // Build where clause
    const where: any = {
      course: {
        doctorId: session.user.id
      }
    };

    if (patientId) {
      where.userId = patientId;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    const assignments = await prisma.userCourse.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching course assignments:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 