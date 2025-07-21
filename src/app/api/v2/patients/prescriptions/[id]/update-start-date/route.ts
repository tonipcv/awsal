import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const updateStartDateSchema = z.object({
  actual_start_date: z.string().min(1, 'Data de início é obrigatória')
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Buscar prescrição
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        id: params.id,
        user_id: user.id,
        abandoned_at: null
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { actual_start_date } = updateStartDateSchema.parse(body);

    // Validar data de início
    const newStartDate = new Date(actual_start_date);
    if (newStartDate < prescription.planned_start_date) {
      return NextResponse.json(
        { error: 'A data de início não pode ser anterior à data planejada' },
        { status: 400 }
      );
    }

    // Atualizar prescrição
    const updatedPrescription = await prisma.protocolPrescription.update({
      where: { id: params.id },
      data: {
        actual_start_date: newStartDate
      },
      select: {
        id: true,
        status: true,
        actual_start_date: true,
        current_day: true,
        protocol: {
          select: {
            name: true,
            duration: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      prescription: {
        id: updatedPrescription.id,
        status: updatedPrescription.status,
        actual_start_date: updatedPrescription.actual_start_date,
        currentDay: updatedPrescription.current_day,
        protocolName: updatedPrescription.protocol.name,
        duration: updatedPrescription.protocol.duration
      },
      message: 'Data de início atualizada com sucesso'
    });
  } catch (error) {
    console.error('Error in PUT /api/v2/patients/prescriptions/[id]/update-start-date:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 