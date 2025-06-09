import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/patient/clinic-slug - Detectar slug da clínica do paciente
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Buscar o usuário para verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        doctor: {
          include: {
            ownedClinics: {
              where: { isActive: true },
              select: { slug: true, name: true },
              take: 1
            },
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: { slug: true, name: true }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Se o paciente tem um médico associado, usar a clínica desse médico
    if (user.doctorId && user.doctor) {
      // Primeiro verificar se o médico possui uma clínica própria
      if (user.doctor.ownedClinics.length > 0) {
        const clinic = user.doctor.ownedClinics[0];
        return NextResponse.json({ 
          clinicSlug: clinic.slug,
          clinicName: clinic.name 
        });
      }
      
      // Senão, verificar se é membro de alguma clínica
      if (user.doctor.clinicMemberships.length > 0) {
        const membership = user.doctor.clinicMemberships[0];
        return NextResponse.json({ 
          clinicSlug: membership.clinic.slug,
          clinicName: membership.clinic.name 
        });
      }
    }

    // Se não tem médico direto, buscar pela primeira clínica onde tem protocolos atribuídos
    const firstProtocol = await prisma.userProtocol.findFirst({
      where: {
        userId: user.id
      },
      include: {
        protocol: {
          include: {
            doctor: {
              include: {
                ownedClinics: {
                  where: { isActive: true },
                  select: { slug: true, name: true },
                  take: 1
                },
                clinicMemberships: {
                  where: { isActive: true },
                  include: {
                    clinic: {
                      select: { slug: true, name: true }
                    }
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (firstProtocol?.protocol?.doctor) {
      const doctor = firstProtocol.protocol.doctor;
      
      // Verificar se o médico possui uma clínica própria
      if (doctor.ownedClinics.length > 0) {
        const clinic = doctor.ownedClinics[0];
        return NextResponse.json({ 
          clinicSlug: clinic.slug,
          clinicName: clinic.name 
        });
      }
      
      // Senão, verificar se é membro de alguma clínica
      if (doctor.clinicMemberships.length > 0) {
        const membership = doctor.clinicMemberships[0];
        return NextResponse.json({ 
          clinicSlug: membership.clinic.slug,
          clinicName: membership.clinic.name 
        });
      }
    }

    // Se não encontrou nenhuma clínica, retornar null
    return NextResponse.json({ 
      clinicSlug: null,
      clinicName: null 
    });

  } catch (error) {
    console.error('Error detecting clinic slug:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 