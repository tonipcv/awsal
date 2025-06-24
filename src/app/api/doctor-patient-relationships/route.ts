import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar relacionamentos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    const relationships = await prisma.doctorPatientRelationship.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST - Criar novo relacionamento
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { patientId, clinicId, isPrimary, speciality, notes } = await request.json();

    // Verificar se é médico
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Verificar se o paciente existe
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, role: true }
    });

    if (!patient || patient.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    // Criar relacionamento em uma transação
    const relationship = await prisma.$transaction(async (tx) => {
      // Se for primário, remover flag de outros relacionamentos
      if (isPrimary) {
        await tx.doctorPatientRelationship.updateMany({
          where: { patientId, isPrimary: true },
          data: { isPrimary: false }
        });
      }

      // Verificar se já existe relacionamento
      const existing = await tx.doctorPatientRelationship.findUnique({
        where: {
          patientId_doctorId: {
            patientId,
            doctorId: session.user.id
          }
        }
      });

      if (existing) {
        return tx.doctorPatientRelationship.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            isPrimary,
            speciality,
            notes,
            clinicId
          },
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            doctor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            clinic: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
      }

      // Criar novo relacionamento
      return tx.doctorPatientRelationship.create({
        data: {
          patientId,
          doctorId: session.user.id,
          clinicId,
          isPrimary,
          speciality,
          notes
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          clinic: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    });

    return NextResponse.json(relationship);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// PATCH - Atualizar relacionamento
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id, isPrimary, isActive, speciality, notes, endDate } = await request.json();

    // Verificar se o relacionamento existe e pertence ao médico
    const existing = await prisma.doctorPatientRelationship.findFirst({
      where: {
        id,
        doctorId: session.user.id
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Relacionamento não encontrado' }, { status: 404 });
    }

    // Atualizar em uma transação
    const relationship = await prisma.$transaction(async (tx) => {
      // Se estiver definindo como primário, remover flag de outros
      if (isPrimary) {
        await tx.doctorPatientRelationship.updateMany({
          where: {
            patientId: existing.patientId,
            isPrimary: true,
            NOT: { id }
          },
          data: { isPrimary: false }
        });
      }

      return tx.doctorPatientRelationship.update({
        where: { id },
        data: {
          isPrimary,
          isActive,
          speciality,
          notes,
          endDate: endDate ? new Date(endDate) : undefined
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          clinic: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
    });

    return NextResponse.json(relationship);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
} 