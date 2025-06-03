import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch system metrics
    const [
      totalDoctors,
      totalPatients,
      totalProtocols,
      totalCourses,
      totalProducts,
      totalClinics,
      activeSubscriptions,
      trialSubscriptions,
      activeClinicSubscriptions,
      trialClinicSubscriptions,
      expiringSoon
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.protocol.count(),
      prisma.course.count(),
      prisma.products.count(),
      prisma.clinic.count(),
      prisma.doctorSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.doctorSubscription.count({ where: { status: 'TRIAL' } }),
      prisma.clinicSubscription.count({ where: { status: 'ACTIVE' } }),
      prisma.clinicSubscription.count({ where: { status: 'TRIAL' } }),
      prisma.doctorSubscription.count({
        where: {
          status: 'TRIAL',
          trialEndDate: {
            lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
          }
        }
      })
    ]);

    // Fetch recent doctors
    const recentDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Fetch subscriptions for recent doctors
    const doctorSubscriptions = await prisma.doctorSubscription.findMany({
      where: {
        doctorId: { in: recentDoctors.map(d => d.id) }
      },
      include: {
        plan: { select: { name: true } }
      }
    });

    // Combine doctor data with their subscriptions
    const recentDoctorsWithSubscriptions = recentDoctors.map(doctor => {
      const subscription = doctorSubscriptions.find(s => s.doctorId === doctor.id);
      return {
        ...doctor,
        subscription: subscription ? {
          status: subscription.status,
          plan: subscription.plan
        } : undefined
      };
    });

    const metrics = {
      totalDoctors,
      totalPatients,
      totalProtocols,
      totalCourses,
      totalProducts,
      totalClinics,
      activeSubscriptions,
      trialSubscriptions,
      activeClinicSubscriptions,
      trialClinicSubscriptions,
      expiringSoon
    };

    return NextResponse.json({
      metrics,
      recentDoctors: recentDoctorsWithSubscriptions
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 