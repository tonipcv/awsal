import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { Protocol, User } from '@prisma/client';

type PrescriptionWithDoctorId = {
  protocol: {
    doctor_id: string
  }
};

// GET /api/v2/patients/doctors - Listar todos os médicos relacionados ao paciente autenticado
export async function GET(
  request: NextRequest
) {
  try {
    // Verificar autenticação e obter usuário do token JWT
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Usar o ID do usuário diretamente do token JWT
    const patientId = user.id;
    
    // Buscar todos os médicos que têm prescrições para este paciente
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: {
        user_id: patientId,
      },
      select: {
        protocol: {
          select: {
            doctor_id: true,
          }
        }
      }
    });

    // Extrair IDs únicos dos médicos
    const doctorIds = prescriptions.map((p: PrescriptionWithDoctorId) => p.protocol.doctor_id)
      .filter((id, index, self) => self.indexOf(id) === index); // Filtrar IDs únicos

    // Buscar informações detalhadas dos médicos
    const doctors = await prisma.user.findMany({
      where: {
        id: { in: doctorIds },
        role: 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true
      }
    });

    // Formatar a resposta
    const response = {
      success: true,
      data: {
        doctors: doctors.map(doctor => ({
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          role: doctor.role,
          image: doctor.image
        }))
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar médicos do paciente:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao buscar médicos do paciente' 
      },
      { status: 500 }
    );
  }
}
