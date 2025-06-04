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

    // Get current user (patient)
    const patient = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { doctorId: true }
    });

    if (!patient?.doctorId) {
      return NextResponse.json({ error: 'No doctor assigned' }, { status: 404 });
    }

    // Get doctor information with basic details only (avoiding clinic for now)
    const doctor = await prisma.user.findUnique({
      where: { id: patient.doctorId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        createdAt: true,
        role: true,
        // Get patients count
        patients: {
          where: { isActive: true },
          select: { id: true }
        },
        // Get protocols count
        _count: {
          select: {
            patients: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Get protocols statistics - simplified query
    let protocolStats = { _count: 0 };
    let activeProtocolsCount = 0;

    try {
      // Get active protocols count for this doctor's patients
      activeProtocolsCount = await prisma.userProtocol.count({
        where: {
          isActive: true,
          user: {
            doctorId: doctor.id
          }
        }
      });

      // Get total protocols count
      protocolStats = await prisma.protocol.aggregate({
        where: {
          assignments: {
            some: {
              user: {
                doctorId: doctor.id
              }
            }
          }
        },
        _count: true
      });
    } catch (protocolError) {
      console.error('Error fetching protocol stats:', protocolError);
      // Continue with default values
    }

    // Format response
    const doctorInfo = {
      id: doctor.id,
      name: doctor.name || '',
      email: doctor.email,
      image: doctor.image,
      phone: doctor.phone,
      createdAt: doctor.createdAt.toISOString(),
      role: doctor.role,
      totalPatients: doctor.patients.length,
      totalProtocols: protocolStats._count || 0,
      activeProtocols: activeProtocolsCount,
      clinic: null // Temporarily disabled until clinic table issues are resolved
    };

    return NextResponse.json(doctorInfo);

  } catch (error) {
    console.error('Error fetching doctor info:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 