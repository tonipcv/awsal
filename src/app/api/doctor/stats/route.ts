import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get doctor user
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Not a doctor' }, { status: 403 });
    }

    // Get statistics
    const [totalPatients, totalProtocols] = await Promise.all([
      // Count patients linked to this doctor (via UserProtocol)
      prisma.userProtocol.groupBy({
        by: ['userId'],
        where: {
          protocol: {
            doctorId: doctor.id
          }
        }
      }).then(groups => groups.length),
      
      // Count protocols created by this doctor
      prisma.protocol.count({
        where: { doctorId: doctor.id }
      })
    ]);

    // For templates, we'll count protocols marked as templates
    const totalTemplates = await prisma.protocol.count({
      where: { 
        doctorId: doctor.id,
        isTemplate: true
      }
    });

    return NextResponse.json({
      totalPatients,
      totalProtocols,
      totalTemplates,
      joinedDate: new Date().toISOString(), // Placeholder since createdAt is not in select
      lastLogin: new Date().toISOString() // For now, use current date
    });

  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 