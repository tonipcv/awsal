import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const createReportSchema = z.object({
  protocolId: z.string(),
  dayNumber: z.number().int().min(1),
  symptoms: z.string().min(1, 'Symptoms description is required'),
  severity: z.number().int().min(1).max(10).default(1),
  reportTime: z.string().optional(),
  isNow: z.boolean().default(true),
  title: z.string().optional(),
  description: z.string().optional()
});

// GET /api/v2/patients/symptom-reports - Listar relatórios de sintomas
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const where: any = {
      userId: user.id
    };

    if (protocolId) {
      // Verificar se o paciente tem acesso ao protocolo
      const prescription = await prisma.protocolPrescription.findFirst({
        where: {
          protocol_id: protocolId,
          user_id: user.id
        }
      });

      if (!prescription) {
        return NextResponse.json(
          { error: 'Protocol not found or not assigned' },
          { status: 404 }
        );
      }

      where.protocolId = protocolId;
    }

    // Buscar relatórios
    const reports = await prisma.symptomReport.findMany({
      where,
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true
          }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            fileUrl: true,
            uploadedAt: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Contar total para paginação
    const total = await prisma.symptomReport.count({ where });

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      message: 'Relatórios carregados com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/symptom-reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v2/patients/symptom-reports - Criar relatório de sintomas
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    const {
      protocolId,
      dayNumber,
      symptoms,
      severity,
      reportTime,
      isNow,
      title,
      description
    } = validatedData;

    // Verificar se o paciente tem acesso ao protocolo
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocol_id: protocolId,
        user_id: user.id
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Protocol not found or not assigned' },
        { status: 404 }
      );
    }

    // Determinar o tempo do relatório
    let finalReportTime = new Date();
    if (!isNow && reportTime) {
      try {
        finalReportTime = new Date(reportTime);
      } catch (error) {
        console.error('Invalid reportTime format:', reportTime);
        // Usar tempo atual se formato inválido
      }
    }

    // Criar relatório de sintomas
    const symptomReport = await prisma.symptomReport.create({
      data: {
        userId: user.id,
        protocolId,
        dayNumber,
        title: title || 'Relatório de Sintomas',
        description,
        symptoms,
        severity,
        reportTime: finalReportTime,
        isNow
      },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true
          }
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            originalName: true,
            fileSize: true,
            mimeType: true,
            fileUrl: true,
            uploadedAt: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      report: symptomReport,
      message: 'Relatório de sintomas criado com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/symptom-reports:', error);

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
