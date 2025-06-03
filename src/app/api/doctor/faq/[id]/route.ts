import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/doctor/faq/[id] - Buscar FAQ específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const faq = await prisma.doctorFAQ.findFirst({
      where: {
        id: id,
        doctorId: session.user.id
      }
    });

    if (!faq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/doctor/faq/[id] - Atualizar FAQ
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { question, answer, category, priority, tags, isActive } = body;

    // Verificar se o FAQ pertence ao médico
    const existingFaq = await prisma.doctorFAQ.findFirst({
      where: {
        id: id,
        doctorId: session.user.id
      }
    });

    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    const faq = await prisma.doctorFAQ.update({
      where: { id: id },
      data: {
        ...(question && { question: question.trim() }),
        ...(answer && { answer: answer.trim() }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
        ...(tags !== undefined && { tags: tags ? JSON.stringify(tags) : null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ faq });

  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/doctor/faq/[id] - Deletar FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se o FAQ pertence ao médico
    const existingFaq = await prisma.doctorFAQ.findFirst({
      where: {
        id: id,
        doctorId: session.user.id
      }
    });

    if (!existingFaq) {
      return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
    }

    await prisma.doctorFAQ.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'FAQ deleted successfully' });

  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 