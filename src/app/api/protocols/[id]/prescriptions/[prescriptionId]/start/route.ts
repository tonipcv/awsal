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

    // Find the protocol assignment
    const userProtocol = await prisma.userProtocol.findUnique({
      where: {
        id: params.prescriptionId,
      },
      include: {
        protocol: true,
      },
    });

    if (!userProtocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Find or create prescription
    let prescription = await prisma.protocolPrescription.findUnique({
      where: {
        userId_protocolId: {
          userId: userId,
          protocolId: userProtocol.protocolId,
        },
      },
    });

    if (!prescription) {
      // Create new prescription
      prescription = await prisma.protocolPrescription.create({
        data: {
          protocolId: userProtocol.protocolId,
          userId: userId,
          prescribedBy: userProtocol.protocol.doctorId,
          plannedStartDate: new Date(),
          plannedEndDate: new Date(Date.now() + (userProtocol.protocol.duration || 30) * 24 * 60 * 60 * 1000),
          status: 'PRESCRIBED',
        },
      });
    }

    // Check if protocol has already started
    if (prescription.actualStartDate) {
      return NextResponse.json({
        error: 'Protocolo já foi iniciado',
        startDate: prescription.actualStartDate,
        status: prescription.status,
      }, { status: 400 });
    }

    // Start the protocol
    const updatedPrescription = await prisma.protocolPrescription.update({
      where: {
        id: prescription.id,
      },
      data: {
        status: 'ACTIVE',
        actualStartDate: new Date(),
        currentDay: 1,
      },
    });

    return NextResponse.json(updatedPrescription);
  } catch (error) {
    console.error('Error starting protocol:', error);
    return NextResponse.json({ error: 'Erro ao iniciar protocolo' }, { status: 500 });
  }
} 