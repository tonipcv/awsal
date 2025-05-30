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

    // Get patient user
    const patient = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!patient) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get statistics
    const [activeProtocols, completedProtocols] = await Promise.all([
      // Count active protocols
      prisma.userProtocol.count({
        where: { 
          userId: patient.id,
          status: 'ACTIVE'
        }
      }),
      
      // Count completed protocols
      prisma.userProtocol.count({
        where: { 
          userId: patient.id,
          status: 'COMPLETED'
        }
      })
    ]);

    return NextResponse.json({
      activeProtocols,
      completedProtocols,
      joinedDate: new Date().toISOString(), // Placeholder
      lastLogin: new Date().toISOString() // For now, use current date
    });

  } catch (error) {
    console.error('Error fetching patient stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 