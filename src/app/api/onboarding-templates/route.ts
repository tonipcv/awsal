import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/onboarding-templates - Listar templates de onboarding
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem visualizar templates.' }, { status: 403 });
    }

    const templates = await prisma.onboardingTemplate.findMany({
      where: {
        OR: [
          { doctorId: session.user.id },
          { isPublic: true }
        ],
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching onboarding templates:', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json({ error: 'Erro ao buscar templates' }, { status: 500 });
  }
} 