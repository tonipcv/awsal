import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// GET /api/protocols/[id]/access - Verificar acesso ao protocolo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    if (!userId) {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: protocolId } = params;

    // Buscar prescrição ativa do protocolo para o usuário
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocolId,
        userId,
        status: {
          in: ['PRESCRIBED', 'ACTIVE', 'PAUSED']
        }
      },
      select: {
        id: true,
        status: true,
        actualStartDate: true,
        currentDay: true,
        plannedEndDate: true
      }
    });

    return NextResponse.json({
      hasAccess: !!prescription,
      prescription
    });

  } catch (error) {
    console.error('Error checking protocol access:', error);
    return NextResponse.json({ error: 'Erro ao verificar acesso ao protocolo' }, { status: 500 });
  }
} 