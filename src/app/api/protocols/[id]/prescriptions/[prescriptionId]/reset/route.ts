import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// POST /api/protocols/[id]/prescriptions/[prescriptionId]/reset
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; prescriptionId: string } }
) {
  try {
    // Authentication
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

    // Find the prescription
    const prescription = await prisma.protocolPrescription.findUnique({
      where: {
        userId_protocolId: {
          userId: userId,
          protocolId: params.id,
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescrição não encontrada' }, { status: 404 });
    }

    // Reset the prescription
    const updatedPrescription = await prisma.protocolPrescription.update({
      where: {
        id: prescription.id,
      },
      data: {
        status: 'PRESCRIBED',
        actualStartDate: null,
        currentDay: 1,
      },
    });

    return NextResponse.json(updatedPrescription);
  } catch (error) {
    console.error('Error resetting prescription:', error);
    return NextResponse.json({ error: 'Erro ao resetar prescrição' }, { status: 500 });
  }
} 