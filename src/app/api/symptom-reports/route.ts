import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/symptom-reports - List symptom reports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get('protocolId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const dayNumber = searchParams.get('dayNumber');

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let whereClause: any = {};

    if (user.role === 'DOCTOR') {
      // Doctor can see reports from their patients
      if (userId && protocolId) {
        // Verify patient belongs to doctor
        const patient = await prisma.user.findFirst({
          where: {
            id: userId,
            doctorId: session.user.id
          }
        });

        if (!patient) {
          return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
        }

        whereClause.userId = userId;
        whereClause.protocolId = protocolId;
      } else {
        // Get reports from all doctor's patients
        whereClause.protocol = {
          doctorId: session.user.id
        };
      }
    } else {
      // Patient sees only their own reports
      whereClause.userId = session.user.id;
      
      if (protocolId) {
        whereClause.protocolId = protocolId;
      }
    }

    // Add additional filters
    if (status) {
      whereClause.status = status;
    }

    if (dayNumber) {
      whereClause.dayNumber = parseInt(dayNumber);
    }

    const reports = await prisma.symptomReport.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attachments: true
      },
      orderBy: [
        { reportTime: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching symptom reports:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar relatórios de sintomas',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST /api/symptom-reports - Create new symptom report
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      protocolId, 
      dayNumber, 
      symptoms, 
      severity, 
      reportTime, 
      isNow,
      title,
      description 
    } = await request.json();

    if (!protocolId || !dayNumber || !symptoms) {
      return NextResponse.json({ 
        error: 'Protocolo, dia e sintomas são obrigatórios' 
      }, { status: 400 });
    }

    // Verify user has access to this protocol
    const protocolPrescription = await prisma.protocolPrescription.findFirst({
      where: {
        user_id: session.user.id,
        protocol_id: protocolId,
        status: { not: 'ABANDONED' }
      },
      include: {
        protocol: true
      }
    });

    if (!protocolPrescription) {
      return NextResponse.json({ 
        error: 'Acesso negado a este protocolo' 
      }, { status: 403 });
    }

    // Validate day number - handle null duration
    const protocolDuration = protocolPrescription.protocol.duration || 30;
    if (dayNumber < 1 || dayNumber > protocolDuration) {
      return NextResponse.json({ 
        error: 'Número do dia inválido' 
      }, { status: 400 });
    }

    // Parse report time
    let finalReportTime: Date;
    if (isNow) {
      finalReportTime = new Date();
    } else {
      finalReportTime = new Date(reportTime);
      if (isNaN(finalReportTime.getTime())) {
        return NextResponse.json({ 
          error: 'Horário inválido' 
        }, { status: 400 });
      }
    }

    // Create symptom report
    const symptomReport = await prisma.symptomReport.create({
      data: {
        userId: session.user.id,
        protocolId: protocolId,
        dayNumber: dayNumber,
        title: title || 'Relatório de Sintomas',
        description: description,
        symptoms: symptoms,
        severity: severity || 1,
        reportTime: finalReportTime,
        isNow: isNow || true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        protocol: {
          select: {
            id: true,
            name: true,
            duration: true
          }
        },
        attachments: true
      }
    });

    return NextResponse.json({
      success: true,
      report: symptomReport
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating symptom report:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar relatório de sintomas',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 