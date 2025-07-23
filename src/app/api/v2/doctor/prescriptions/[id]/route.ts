import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth } from '@/lib/mobile-auth';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getAuthenticatedUser(request: NextRequest) {
  // Tentar autenticação NextAuth primeiro
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      id: session.user.id,
      role: session.user.role
    };
  }

  // Se não houver sessão NextAuth, tentar autenticação mobile
  try {
    const mobileUser = await requireMobileAuth(request);
    return mobileUser;
  } catch (error) {
    return null;
  }
}

function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: 'Não autorizado' },
    { status: 401 }
  );
}

// PATCH /doctor/prescriptions/:id
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const { id } = params;
    const body = await request.json();
    const { status, planned_start_date, planned_end_date, pause_reason, abandon_reason } = body;

    // Verificar se a prescrição existe e pertence ao médico
    const prescription = await prisma.protocolPrescription.findFirst({
      where: { id, prescribed_by: user.id },
    });

    if (!prescription) {
      return NextResponse.json({ success: false, message: 'Prescrição não encontrada.' }, { status: 404 });
    }

    const updatedPrescription = await prisma.protocolPrescription.update({
      where: { id },
      data: {
        status,
        planned_start_date: planned_start_date ? new Date(planned_start_date) : undefined,
        planned_end_date: planned_end_date ? new Date(planned_end_date) : undefined,
        pause_reason,
        abandon_reason
      },
    });

    return NextResponse.json({ success: true, data: updatedPrescription });
  } catch (error) {
    console.error(`Error in PATCH /api/v2/doctor/prescriptions/${params?.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return NextResponse.json({ success: false, message: 'Prescrição não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// DELETE /doctor/prescriptions/:id
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const { id } = params;

    // Verificar se a prescrição existe e pertence ao médico antes de deletar
    const prescription = await prisma.protocolPrescription.findFirst({
      where: { id, prescribed_by: user.id },
    });

    if (!prescription) {
      return NextResponse.json({ success: false, message: 'Prescrição não encontrada ou não autorizada.' }, { status: 404 });
    }

    await prisma.protocolPrescription.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Prescrição removida com sucesso.' });
  } catch (error) {
    console.error(`Error in DELETE /api/v2/doctor/prescriptions/${params?.id}:`, error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
