import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const subscriptionId = resolvedParams.id;

    // Find the subscription
    const subscription = await prisma.doctorSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            maxPatients: true,
            maxProtocols: true,
            maxCourses: true,
            maxProducts: true,
            trialDays: true
          }
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const subscriptionId = resolvedParams.id;
    const body = await request.json();
    const { planId, status, endDate, trialEndDate, autoRenew } = body;

    // Validations
    if (!planId || !status) {
      return NextResponse.json({ error: 'Plan and status are required' }, { status: 400 });
    }

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }

    // Check if subscription exists
    const existingSubscription = await prisma.doctorSubscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      planId,
      status,
      autoRenew: autoRenew ?? true,
      updatedAt: new Date()
    };

    // Configure dates based on status
    if (status === 'TRIAL') {
      if (trialEndDate) {
        updateData.trialEndDate = new Date(trialEndDate);
      }
      updateData.endDate = null;
    } else if (status === 'ACTIVE') {
      if (endDate) {
        updateData.endDate = new Date(endDate);
      }
      updateData.trialEndDate = null;
    } else {
      // For other statuses (SUSPENDED, CANCELLED, EXPIRED)
      updateData.endDate = null;
      updateData.trialEndDate = null;
    }

    // Update the subscription
    const updatedSubscription = await prisma.doctorSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 