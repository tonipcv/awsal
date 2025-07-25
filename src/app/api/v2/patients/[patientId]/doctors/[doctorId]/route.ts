import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

// GET /api/v2/patients/[patientId]/doctors/[doctorId] - Obter informações do médico e suas prescrições para um paciente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string; doctorId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar se o ID do paciente na rota corresponde ao usuário autenticado
    if (user.id !== params.patientId) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Você não tem permissão para acessar informações de outro paciente' 
        },
        { status: 403 }
      );
    }

    // Buscar o médico pelo ID
    const doctor = await prisma.user.findUnique({
      where: {
        id: params.doctorId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Médico não encontrado' 
        },
        { status: 404 }
      );
    }

    // Buscar prescrições que o médico fez para esse paciente
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: {
        user_id: params.patientId,
        protocol: {
          doctor_id: params.doctorId,
        }
      },
      select: {
        id: true,
        protocol_id: true,
        status: true,
        planned_start_date: true,
        planned_end_date: true,
        protocol: {
          select: {
            id: true,
            name: true,
            description: true,
          }
        }
      },
      orderBy: {
        prescribed_at: 'desc'
      }
    });

    // Formatar a resposta de acordo com o padrão JSON especificado
    const response = {
      success: true,
      data: {
        doctor: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          role: doctor.role,
          prescriptions: prescriptions.map(prescription => ({
            id: prescription.id,
            protocolId: prescription.protocol_id,
            status: prescription.status,
            plannedStartDate: prescription.planned_start_date,
            plannedEndDate: prescription.planned_end_date,
            protocol: {
              id: prescription.protocol.id,
              name: prescription.protocol.name,
              description: prescription.protocol.description,
            }
          }))
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/v2/patients/[patientId]/doctors/[doctorId]:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}
