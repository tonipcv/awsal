import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ 
        error: 'Acesso negado. Apenas médicos podem ativar pacientes.' 
      }, { status: 403 });
    }

    const { patientEmail } = await request.json();

    if (!patientEmail?.trim()) {
      return NextResponse.json({ 
        error: 'Email do paciente é obrigatório' 
      }, { status: 400 });
    }

    // Buscar paciente sem clínica
    const patient = await prisma.user.findUnique({
      where: { 
        email: patientEmail.toLowerCase().trim() 
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        doctorId: true,
        phone: true,
        createdAt: true
      }
    });

    if (!patient) {
      return NextResponse.json({ 
        error: 'Paciente não encontrado' 
      }, { status: 404 });
    }

    if (patient.role !== 'PATIENT_NOCLINIC') {
      return NextResponse.json({ 
        error: 'Este paciente já está vinculado a uma clínica ou não precisa de ativação' 
      }, { status: 400 });
    }

    if (patient.doctorId) {
      return NextResponse.json({ 
        error: 'Este paciente já está vinculado a outro médico' 
      }, { status: 400 });
    }

    // Ativar paciente - vincular ao médico e mudar role
    const activatedPatient = await prisma.user.update({
      where: { id: patient.id },
      data: {
        role: 'PATIENT', // Muda de PATIENT_NOCLINIC para PATIENT
        doctorId: session.user.id // Vincula ao médico
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        doctorId: true,
        createdAt: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Paciente ativado com sucesso!',
      patient: {
        id: activatedPatient.id,
        name: activatedPatient.name,
        email: activatedPatient.email,
        phone: activatedPatient.phone,
        role: activatedPatient.role,
        hasClinic: true,
        needsClinic: false,
        createdAt: activatedPatient.createdAt,
        doctor: activatedPatient.doctor
      }
    });

  } catch (error) {
    console.error('Erro ao ativar paciente:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 