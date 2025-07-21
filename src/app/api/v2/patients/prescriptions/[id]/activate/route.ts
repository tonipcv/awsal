import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const activateSchema = z.object({
  actual_start_date: z.string().optional() // Se não fornecido, usa a data atual
});

export async function POST(
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
        abandoned_at: null,
        paused_at: null,
        OR: [
          { status: 'PRESCRIBED' },
          { status: 'ACTIVE' }
        ]
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada ou não pode ser ativada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { actual_start_date } = activateSchema.parse(body);

    // Atualizar prescrição
    const updatedPrescription = await prisma.protocolPrescription.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        actual_start_date: actual_start_date ? new Date(actual_start_date) : new Date(),
        ...(prescription.status !== 'ACTIVE' && {
          current_day: 1,
          adherence_rate: 0,
          last_progress_date: null
        })
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

    const message = prescription.status === 'ACTIVE' 
      ? 'Data de início atualizada com sucesso'
      : 'Prescrição ativada com sucesso';

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
      message
    });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/prescriptions/[id]/activate:', error);

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