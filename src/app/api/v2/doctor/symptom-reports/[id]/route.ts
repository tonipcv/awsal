import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { Prisma, SymptomReportStatus } from '@prisma/client';

// PATCH /doctor/symptom-reports/:id
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const reportId = params.id;
    const body = await request.json();
    const { status, doctorNotes } = body;

    if (!status && !doctorNotes) {
      return NextResponse.json({ success: false, message: 'Pelo menos um campo (status ou doctorNotes) deve ser fornecido.' }, { status: 400 });
    }

    // 1. Encontrar os IDs dos pacientes do médico a partir das prescrições
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: { prescribed_by: user.id },
      select: { user_id: true },
      distinct: ['user_id'],
    });
    const patientIds = prescriptions.map(p => p.user_id);

    // 2. Tentar atualizar o relatório somente se ele pertencer a um paciente do médico
    const updatedReport = await prisma.symptomReport.updateMany({
      where: {
        id: reportId,
        userId: { in: patientIds },
      },
      data: {
        status: status as SymptomReportStatus,
        doctorNotes,
      },
    });

    // Se nenhum registro foi atualizado, o relatório não foi encontrado ou não pertence ao médico
    if (updatedReport.count === 0) {
      return NextResponse.json({ success: false, message: 'Relatório não encontrado ou não autorizado.' }, { status: 404 });
    }

    // 3. Retornar a resposta
    return NextResponse.json({
      success: true,
      data: {
        id: reportId,
        status,
        doctorNotes,
      },
      message: 'Relatório de sintomas atualizado com sucesso',
    });

  } catch (error) {
    console.error(`Error in PATCH /api/v2/doctor/symptom-reports/${params.id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Relatório não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Dados inválidos ou erro interno.' }, { status: 400 });
  }
}
