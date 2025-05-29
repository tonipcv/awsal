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
    const circleId = id;

    if (!circleId || circleId === 'undefined') {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        userId: session.user.id
      }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    return NextResponse.json(circle);
  } catch (error) {
    console.error('Error fetching circle:', error);
    return NextResponse.json(
      { error: 'Error fetching circle' },
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
    const circleId = id;

    if (!circleId || circleId === 'undefined') {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    const { title, maxClicks } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Verificar se o círculo pertence ao usuário
    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        userId: session.user.id
      }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const updatedCircle = await prisma.circle.update({
      where: { id: circleId },
      data: { 
        title: title.trim(),
        maxClicks: maxClicks || circle.maxClicks
      }
    });

    return NextResponse.json(updatedCircle);
  } catch (error) {
    console.error('Error updating circle:', error);
    return NextResponse.json(
      { error: 'Error updating circle' },
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
    const circleId = id;

    if (!circleId || circleId === 'undefined') {
      return NextResponse.json({ error: 'Invalid circle ID' }, { status: 400 });
    }

    // Verificar se o círculo pertence ao usuário
    const circle = await prisma.circle.findFirst({
      where: {
        id: circleId,
        userId: session.user.id
      }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    await prisma.circle.delete({
      where: { id: circleId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting circle:', error);
    return NextResponse.json(
      { error: 'Error deleting circle' },
      { status: 500 }
    );
  }
} 