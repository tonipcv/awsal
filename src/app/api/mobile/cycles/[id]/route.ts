import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cycleId = id;

    if (!cycleId || cycleId === 'undefined') {
      return NextResponse.json({ error: 'Invalid cycle ID' }, { status: 400 });
    }

    const cycle = await prisma.cycle.findFirst({
      where: {
        id: cycleId,
        userId: session.user.id
      },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                tasks: true
              }
            },
            goals: true,
            keyResults: true
          }
        }
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    return NextResponse.json(cycle);
  } catch (error) {
    console.error('Error fetching cycle:', error);
    return NextResponse.json(
      { error: 'Error fetching cycle' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cycleId = id;

    if (!cycleId || cycleId === 'undefined') {
      return NextResponse.json({ error: 'Invalid cycle ID' }, { status: 400 });
    }

    const { startDate, endDate, vision } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Verificar se o ciclo pertence ao usuário
    const cycle = await prisma.cycle.findFirst({
      where: {
        id: cycleId,
        userId: session.user.id
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    const updatedCycle = await prisma.cycle.update({
      where: { id: cycleId },
      data: { 
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        vision: vision || cycle.vision
      }
    });

    return NextResponse.json(updatedCycle);
  } catch (error) {
    console.error('Error updating cycle:', error);
    return NextResponse.json(
      { error: 'Error updating cycle' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const cycleId = id;

    if (!cycleId || cycleId === 'undefined') {
      return NextResponse.json({ error: 'Invalid cycle ID' }, { status: 400 });
    }

    // Verificar se o ciclo pertence ao usuário
    const cycle = await prisma.cycle.findFirst({
      where: {
        id: cycleId,
        userId: session.user.id
      }
    });

    if (!cycle) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    await prisma.cycle.delete({
      where: { id: cycleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cycle:', error);
    return NextResponse.json(
      { error: 'Error deleting cycle' },
      { status: 500 }
    );
  }
} 