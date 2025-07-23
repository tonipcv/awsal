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
            doctor_id: session.user.id
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
          doctor_id: session.user.id
        };
      }
    } else if (user.role === 'PATIENT') {
      // Patient can only see their own reports
      whereClause.userId = session.user.id;
      
      if (protocolId) {
        whereClause.protocolId = protocolId;
      }
    } else {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

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

    const body = await request.json();
    const { 
      protocolId, 
      symptoms, 
      description, 
      dayNumber, 
      reportTime = new Date(),
      attachments = []
    } = body;

    if (!protocolId || !symptoms) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Verify user has access to protocol
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        OR: [
          { doctor_id: session.user.id },
          { prescriptions: { some: { user_id: session.user.id } } }
        ]
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou sem permissão' }, { status: 404 });
    }

    // Create report
    const report = await prisma.symptomReport.create({
      data: {
        id: `symrep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId: session.user.id,
        protocolId,
        symptoms,
        description,
        dayNumber: dayNumber ? parseInt(dayNumber.toString()) : null,
        reportTime: new Date(reportTime),
        status: 'PENDING',
        attachments: {
          create: attachments.map((attachment: any) => ({
            id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            url: attachment.url,
            type: attachment.type,
            name: attachment.name
          }))
        }
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
            name: true
          }
        },
        attachments: true
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating symptom report:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar relatório de sintomas',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
