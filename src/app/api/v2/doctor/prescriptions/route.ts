import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth } from '@/lib/mobile-auth';
import { PrescriptionStatus, ProtocolPrescription, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: 'Não autorizado' },
    { status: 401 }
  );
}

async function getAuthenticatedUser(request: NextRequest) {
  // Tentar autenticação NextAuth primeiro
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    // Get the doctor's full data from database
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    
    if (doctor) {
      return doctor;
    }
  }

  // Se não houver sessão NextAuth, tentar autenticação mobile
  try {
    const mobileUser = await requireMobileAuth(request);
    return mobileUser;
  } catch (error) {
    return null;
  }
}

// GET /doctor/prescriptions
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') as PrescriptionStatus | null;

    const whereClause: Prisma.ProtocolPrescriptionWhereInput = {
      prescribed_by: user.id,
    };

    if (status) {
      whereClause.status = status;
    }

    const email = searchParams.get('email');
    const patientId = searchParams.get('patientId');
    
    if (email || patientId) {
      whereClause.patient = {};
      
      if (email) {
        whereClause.patient.email = {
          contains: email,
          mode: 'insensitive'
        };
      }
      
      if (patientId) {
        whereClause.patient.id = patientId;
      }
    }

    const prescriptions = await prisma.protocolPrescription.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: {
        prescribed_at: 'desc',
      },
      include: {
        protocol: true,
        patient: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.protocolPrescription.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: prescriptions.map((p) => ({
        id: p.id,
        protocol_id: p.protocol_id,
        protocol_name: p.protocol.name,
        protocol_description: p.protocol.description,
        user_id: p.user_id,
        user_name: p.patient.name,
        user_email: p.patient.email,
        prescribed_by: p.prescribed_by,
        prescribed_at: p.prescribed_at.toISOString(),
        planned_start_date: p.planned_start_date?.toISOString(),
        actual_start_date: p.actual_start_date?.toISOString(),
        planned_end_date: p.planned_end_date?.toISOString(),
        actual_end_date: p.actual_end_date?.toISOString(),
        status: p.status,
        current_day: p.current_day,
        adherence_rate: p.adherence_rate,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      message: 'Prescrições carregadas com sucesso',
    });
  } catch (error) {
    // Handle unauthorized errors specifically
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    console.error('Error in GET /api/v2/doctor/prescriptions:', error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor.' }, { status: 500 });
  }
}

// POST /doctor/prescriptions
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      protocol_id,
      user_id,
      email,
      planned_start_date,
      planned_end_date,
      consultation_date
    } = body;

    if (!protocol_id || !planned_start_date) {
      return NextResponse.json({ success: false, message: 'Dados inválidos: protocol_id e planned_start_date são obrigatórios.' }, { status: 400 });
    }

    // Verificar se o protocolo existe e pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: { id: protocol_id, doctor_id: user.id },
    });

    if (!protocol) {
        return NextResponse.json({ success: false, message: 'Protocolo não encontrado ou não associado a este médico.' }, { status: 404 });
    }
    
    // Buscar o paciente pelo ID ou email e verificar relacionamento com o médico
    let patient;
    let relationship;
    
    if (email) {
      // Buscar paciente pelo email
      patient = await prisma.user.findFirst({
        where: { 
          email: email.toLowerCase(),
          role: 'PATIENT'
        }
      });
      
      if (!patient) {
        return NextResponse.json({ success: false, message: 'Paciente com este email não encontrado.' }, { status: 404 });
      }
      
      // Verificar se existe relacionamento entre médico e paciente
      relationship = await prisma.doctorPatientRelationship.findFirst({
        where: {
          doctorId: user.id,
          patientId: patient.id,
          isActive: true
        }
      });
      
      if (!relationship) {
        // Se não existe relacionamento, criar um
        relationship = await prisma.doctorPatientRelationship.create({
          data: {
            doctorId: user.id,
            patientId: patient.id,
            isActive: true
          }
        });
      }
    } else if (user_id) {
      // Buscar paciente pelo ID
      patient = await prisma.user.findFirst({
        where: { 
          id: user_id,
          role: 'PATIENT'
        }
      });
      
      if (!patient) {
        return NextResponse.json({ success: false, message: 'Paciente com este ID não encontrado.' }, { status: 404 });
      }
      
      // Verificar se existe relacionamento entre médico e paciente
      relationship = await prisma.doctorPatientRelationship.findFirst({
        where: {
          doctorId: user.id,
          patientId: patient.id,
          isActive: true
        }
      });
      
      if (!relationship) {
        // Se não existe relacionamento, criar um
        relationship = await prisma.doctorPatientRelationship.create({
          data: {
            doctorId: user.id,
            patientId: patient.id,
            isActive: true
          }
        });
      }
    } else {
      // Se nem email nem user_id foram fornecidos, buscar o primeiro paciente associado ao médico
      relationship = await prisma.doctorPatientRelationship.findFirst({
        where: { 
          doctorId: user.id,
          isActive: true 
        },
        include: {
          patient: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (!relationship || !relationship.patient) {
        return NextResponse.json({ success: false, message: 'Nenhum paciente encontrado associado a este médico.' }, { status: 404 });
      }
      
      patient = relationship.patient;
    }
    
    const patientId = patient.id;

    // Verificar se já existe uma prescrição para este paciente e protocolo
    const existingPrescription = await prisma.protocolPrescription.findFirst({
      where: {
        protocol_id,
        user_id: patientId,
        status: {
          in: ['PRESCRIBED', 'ACTIVE']
        }
      }
    });

    let prescription;
    
    if (existingPrescription) {
      // Se já existe uma prescrição, atualizar os dados
      prescription = await prisma.protocolPrescription.update({
        where: { id: existingPrescription.id },
        data: {
          planned_start_date: new Date(planned_start_date).toISOString(),
          planned_end_date: planned_end_date ? new Date(planned_end_date).toISOString() : undefined,
          consultation_date: consultation_date && consultation_date !== '' ? new Date(consultation_date).toISOString() : undefined,
          status: 'PRESCRIBED',
          updated_at: new Date()
        }
      });
    } else {
      // Se não existe, criar uma nova prescrição
      const newPrescription = await prisma.protocolPrescription.create({
        data: {
          protocol_id,
          user_id: patientId,
          prescribed_by: user.id,
          planned_start_date: new Date(planned_start_date).toISOString(),
          planned_end_date: planned_end_date ? new Date(planned_end_date).toISOString() : undefined,
          consultation_date: consultation_date && consultation_date !== '' ? new Date(consultation_date).toISOString() : undefined,
          status: 'PRESCRIBED',
        },
      });
      prescription = newPrescription;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: prescription.id,
        protocol_id: prescription.protocol_id,
        user_id: prescription.user_id,
        patient_email: patient.email,
        patient_name: patient.name,
        prescribed_by: prescription.prescribed_by,
        prescribed_at: prescription.prescribed_at.toISOString(),
        planned_start_date: prescription.planned_start_date?.toISOString(),
        status: prescription.status,
        updated: !!existingPrescription
      },
      message: existingPrescription ? 'Prescrição atualizada com sucesso' : 'Prescrição criada com sucesso',
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v2/doctor/prescriptions:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Erros conhecidos do Prisma, como violação de chave única
      if (error.code === 'P2002') {
        return NextResponse.json({ success: false, message: 'Já existe uma prescrição para este paciente com este protocolo.' }, { status: 409 });
      }
    }
    // Handle unauthorized errors specifically
    if (error instanceof Error && error.message === "Unauthorized") {
      return unauthorizedResponse();
    }
    return NextResponse.json({ success: false, message: 'Dados inválidos ou erro interno.' }, { status: 400 });
  }
}
