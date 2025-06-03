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

    // Get doctor information with clinic details
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
        // Get clinic membership to access clinic info
        clinicMemberships: {
          where: { isActive: true },
          select: {
            clinic: {
              select: {
                id: true,
                name: true,
                description: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
                website: true
              }
            }
          },
          take: 1
        },
        // Get patients count
        patients: {
          where: { isActive: true },
          select: { id: true }
        },
        // Get protocols created by this doctor
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

    // Get protocols statistics
    const protocolStats = await prisma.protocol.aggregate({
      where: {
        // Assuming protocols have a doctorId or createdBy field
        // You might need to adjust this based on your actual schema
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

    // Get active protocols count
    const activeProtocolsCount = await prisma.userProtocol.count({
      where: {
        isActive: true,
        user: {
          doctorId: doctor.id
        }
      }
    });

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
      clinic: doctor.clinicMemberships[0]?.clinic || null
    };

    return NextResponse.json(doctorInfo);

  } catch (error) {
    console.error('Error fetching doctor info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 