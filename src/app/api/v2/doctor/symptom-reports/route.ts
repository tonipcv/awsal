import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { Prisma, SymptomReportStatus } from '@prisma/client';

// GET /doctor/symptom-reports
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    // 1. Encontrar os IDs dos pacientes do médico a partir das prescrições
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: { prescribed_by: user.id },
      select: {
        user_id: true,
      },
      distinct: ['user_id'],
    });
    const patientIds = prescriptions.map(p => p.user_id);

    if (patientIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: [], 
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        message: 'Nenhum relatório de sintoma encontrado.'
      });
    }

    // 2. Parâmetros de query
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') as SymptomReportStatus | null;

    // 3. Montar a cláusula 'where'
    const whereClause: Prisma.SymptomReportWhereInput = {
      userId: { in: patientIds },
    };

    if (status && Object.values(SymptomReportStatus).includes(status)) {
      whereClause.status = status;
    }

    // 4. Buscar os relatórios
    const reports = await prisma.symptomReport.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { reportTime: 'desc' },
    });

    const total = await prisma.symptomReport.count({ where: whereClause });

    // 5. Formatar e retornar a resposta
    return NextResponse.json({
      success: true,
      data: reports.map(report => ({
        id: report.id,
        userId: report.userId,
        protocolId: report.protocolId,
        dayNumber: report.dayNumber,
        title: report.title,
        description: report.description,
        symptoms: report.symptoms, // O campo já é uma string
        severity: report.severity,
        reportTime: report.reportTime.toISOString(),
        status: report.status,
        doctorNotes: report.doctorNotes,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      message: 'Relatórios de sintomas carregados com sucesso',
    });

  } catch (error) {
    console.error('Error in GET /api/v2/doctor/symptom-reports:', error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
