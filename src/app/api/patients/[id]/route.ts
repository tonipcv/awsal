import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/patients/[id] - Buscar dados de um paciente específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar dados de pacientes.' }, { status: 403 });
    }

    const { id } = await params;

    // Buscar o paciente específico
    const patient = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'PATIENT',
        patientRelationships: {
          some: {
            doctorId: session.user.id,
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        referralCode: true,
        patientRelationships: {
          where: {
            doctorId: session.user.id
          },
          select: {
            id: true,
            isPrimary: true,
            speciality: true,
            isActive: true
          }
        },
        patientPrescriptions: {
          where: {
            prescribedBy: session.user.id
          },
          select: {
            id: true,
            protocolId: true,
            plannedStartDate: true,
            plannedEndDate: true,
            status: true,
            protocol: {
              select: {
                id: true,
                name: true,
                duration: true,
                description: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        onboardingResponses: {
          where: {
            template: {
              doctorId: session.user.id
            }
          },
          select: {
            id: true,
            status: true,
            completedAt: true,
            template: {
              select: {
                id: true,
                name: true,
                steps: {
                  select: {
                    id: true,
                    question: true,
                    type: true,
                    required: true,
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            },
            answers: {
              select: {
                id: true,
                stepId: true,
                answer: true,
              },
              orderBy: {
                step: {
                  order: 'asc'
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Client not found or you do not have permission to access it' }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error fetching patient:', String(error));
    return NextResponse.json({ error: 'Error fetching client data' }, { status: 500 });
  }
}

// DELETE /api/patients/[id] - Excluir um paciente
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem excluir pacientes.' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar se o paciente existe e pertence ao médico
    const patient = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'PATIENT',
        patientRelationships: {
          some: {
            doctorId: session.user.id,
            isActive: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não pertence a este médico' }, { status: 404 });
    }

    // Excluir o paciente usando transação para limpar todos os relacionamentos
    await prisma.$transaction(async (tx) => {
      // Primeiro, excluir todos os relacionamentos do paciente
      await tx.doctorPatientRelationship.deleteMany({
        where: { patientId: id }
      });

      // Depois, excluir o paciente
      await tx.user.delete({
        where: { id: id }
      });
    });

    return NextResponse.json({ 
      message: 'Paciente excluído com sucesso',
      deletedPatient: {
        id: patient.id,
        name: patient.name,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Error deleting patient:', String(error));
    return NextResponse.json({ error: 'Erro ao excluir paciente' }, { status: 500 });
  }
} 

// PUT /api/patients/[id] - Atualizar dados de um paciente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem atualizar dados de pacientes.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      phone,
      birthDate,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
      notes
    } = body;

    // Verificar se o paciente existe e pertence ao médico
    const patient = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'PATIENT',
        patientRelationships: {
          some: {
            doctorId: session.user.id,
            isActive: true
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado ou não pertence a este médico' }, { status: 404 });
    }

    // Validar campos obrigatórios
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    // Atualizar paciente
    const updatedPatient = await prisma.user.update({
      where: { id: id },
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender?.trim() || null,
        address: address?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        emergencyPhone: emergencyPhone?.trim() || null,
        medicalHistory: medicalHistory?.trim() || null,
        allergies: allergies?.trim() || null,
        medications: medications?.trim() || null,
        notes: notes?.trim() || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        medicalHistory: true,
        allergies: true,
        medications: true,
        notes: true,
        image: true,
        emailVerified: true,
        patientRelationships: {
          where: {
            doctorId: session.user.id
          },
          select: {
            id: true,
            isPrimary: true,
            speciality: true,
            isActive: true
          }
        }
      }
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Erro ao atualizar paciente' }, { status: 500 });
  }
} 