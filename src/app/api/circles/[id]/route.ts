import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extrair o "id" a partir da URL
    const { pathname } = new URL(request.url);
    const segments = pathname.split('/');
    // O ID será o último segmento da rota "/api/circles/[id]"
    const id = segments[segments.length - 1];

    if (!id || id === 'undefined') {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Verificar se o círculo pertence ao usuário
    const circle = await prisma.circle.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!circle) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    if (circle.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Ler o body da requisição
    const body = await request.json();
    const { clicks } = body;

    if (typeof clicks !== 'number') {
      return NextResponse.json(
        { error: 'Clicks must be a number' },
        { status: 400 }
      );
    }

    // Atualizar registro no Prisma
    const updatedCircle = await prisma.circle.update({
      where: { id },
      data: { clicks },
    });

    return NextResponse.json({ data: updatedCircle });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to update circle' },
      { status: 500 }
    );
  }
}
