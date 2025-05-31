import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/protocols/[id]/products/patient - Buscar produtos de protocolo para pacientes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const protocolId = resolvedParams.id;

    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem acessar esta funcionalidade.' }, { status: 403 });
    }

    // Verificar se o paciente tem o protocolo atribuído e ativo
    const assignment = await prisma.userProtocol.findFirst({
      where: {
        userId: session.user.id,
        protocolId: protocolId,
        isActive: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou não está ativo para este paciente' }, { status: 404 });
    }

    // Buscar produtos do protocolo
    const protocolProducts = await prisma.protocol_products.findMany({
      where: {
        protocolId: protocolId,
        products: {
          isActive: true
        }
      },
      include: {
        products: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transformar para o formato esperado pelo frontend
    const transformedProducts = protocolProducts.map(pp => ({
      ...pp,
      product: pp.products
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error('Error fetching protocol products for patient:', error?.toString() || 'Unknown error');
    return NextResponse.json({ error: 'Erro ao buscar produtos do protocolo' }, { status: 500 });
  }
} 