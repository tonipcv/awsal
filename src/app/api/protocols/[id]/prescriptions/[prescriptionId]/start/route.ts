import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// POST /api/protocols/[id]/prescriptions/[prescriptionId]/start
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

    const { id: protocolId, prescriptionId } = params;

    // Find the prescription
    const prescription = await prisma.protocolPrescription.findUnique({
      where: {
        id: prescriptionId,
        protocolId: protocolId,
        userId: userId
      }
    });

    if (!prescription) {
      return NextResponse.json({ error: 'Prescrição não encontrada' }, { status: 404 });
    }

    // Check if protocol has already been started
    if (prescription.actualStartDate) {
      return NextResponse.json({ 
        error: 'Protocolo já foi iniciado',
        startDate: prescription.actualStartDate,
        status: prescription.status
      }, { status: 400 });
    }

    // Update prescription with start date
    const updatedPrescription = await prisma.protocolPrescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'ACTIVE',
        actualStartDate: new Date(),
        currentDay: 1
      }
    });

    return NextResponse.json(updatedPrescription);

  } catch (error) {
    console.error('Error starting prescription:', error);
    return NextResponse.json({ 
      error: 'Erro ao iniciar prescrição',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 