import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { addDays } from 'date-fns';

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

    // First, get the protocol assignment
    const assignment = await prisma.userProtocol.findUnique({
      where: {
        id: prescriptionId,
        userId: userId,
        protocolId: protocolId
      },
      include: {
        protocol: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Atribuição de protocolo não encontrada' }, { status: 404 });
    }

    // Check if there's already a prescription
    let prescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocolId,
        userId
      }
    });

    // If no prescription exists, create one
    if (!prescription) {
      const startDate = new Date();
      const endDate = addDays(startDate, assignment.protocol.duration || 30);

      prescription = await prisma.protocolPrescription.create({
        data: {
          protocolId,
          userId,
          prescribedBy: assignment.protocol.doctorId,
          plannedStartDate: startDate,
          plannedEndDate: endDate,
          status: 'PRESCRIBED'
        }
      });
    }

    // Check if prescription has already been started
    if (prescription.actualStartDate) {
      return NextResponse.json({ 
        error: 'Protocolo já foi iniciado',
        startDate: prescription.actualStartDate,
        status: prescription.status
      }, { status: 400 });
    }

    // Update prescription with start date
    const updatedPrescription = await prisma.protocolPrescription.update({
      where: { id: prescription.id },
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