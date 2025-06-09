import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a doctor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Only doctors can update report status' }, { status: 403 });
    }

    const { status, doctorNotes } = await request.json();
    const params = await context.params;

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWED', 'REQUIRES_ATTENTION', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the symptom report
    const updatedReport = await prisma.symptomReport.update({
      where: { id: params.id },
      data: {
        status,
        doctorNotes: doctorNotes || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attachments: true
      }
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating symptom report status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 