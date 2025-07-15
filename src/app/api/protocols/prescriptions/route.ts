import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if user is a doctor
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied. Only doctors can prescribe protocols.' }, { status: 403 });
    }

    const data = await request.json();
    const { protocolId, userId, plannedStartDate, plannedEndDate, status } = data;

    // Verify if protocol exists and belongs to the doctor
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found or access denied' }, { status: 404 });
    }

    // Verify if patient exists and has a relationship with the doctor
    const patient = await prisma.user.findFirst({
      where: {
        id: userId,
        role: 'PATIENT',
        patientRelationships: {
          some: {
            doctorId: session.user.id
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
    }

    // Create prescription
    const prescription = await prisma.protocolPrescription.create({
      data: {
        protocolId,
        userId,
        prescribedBy: session.user.id,
        plannedStartDate: new Date(plannedStartDate),
        plannedEndDate: new Date(plannedEndDate),
        status,
        currentDay: 1
      },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true,
            description: true
          }
        }
      }
    });

    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error prescribing protocol:', error);
    return NextResponse.json({ error: 'Error prescribing protocol' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const where: any = {
      prescribedBy: session.user.id
    };

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const prescriptions = await prisma.protocolPrescription.findMany({
      where,
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true,
            description: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Error fetching prescriptions' }, { status: 500 });
  }
} 