import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user || user.role !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    // Buscar total de pacientes ativos
    const totalPatients = await prisma.doctorPatientRelationship.count({
      where: {
        doctorId: user.id,
        isActive: true
      }
    });

    // Buscar total de protocolos ativos
    const totalProtocols = await prisma.protocol.count({
      where: {
        doctor_id: user.id,
        is_active: true
      }
    });

    // Buscar prescrições ativas
    const prescriptions = await prisma.protocolPrescription.findMany({
      where: {
        prescribed_by: user.id,
        status: { in: ['ACTIVE', 'PRESCRIBED'] }
      },
      select: {
        id: true,
        status: true,
        adherence_rate: true,
        protocol: {
          select: {
            id: true,
            name: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calcular taxa média de aderência
    const activePrescriptions = prescriptions.filter(p => p.status === 'ACTIVE');
    const averageAdherence = activePrescriptions.length > 0
      ? activePrescriptions.reduce((acc, p) => acc + (p.adherence_rate || 0), 0) / activePrescriptions.length
      : 0;

    // Buscar total de cursos
    const totalCourses = await prisma.course.count({
      where: {
        doctorId: user.id,
        isPublished: true
      }
    });

    // Buscar total de referrals pendentes
    const pendingReferrals = await prisma.referralLead.count({
      where: {
        doctorId: user.id,
        status: { in: ['NEW', 'PENDING'] }
      }
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalPatients,
        totalProtocols,
        totalCourses,
        pendingReferrals,
        activePrescriptions: prescriptions.length,
        averageAdherence: Math.round(averageAdherence),
        recentPrescriptions: prescriptions.slice(0, 5).map(p => ({
          id: p.id,
          status: p.status,
          adherenceRate: p.adherence_rate,
          protocol: {
            id: p.protocol.id,
            name: p.protocol.name
          },
          patient: {
            id: p.patient.id,
            name: p.patient.name
          }
        }))
      },
      message: 'Estatísticas carregadas com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/doctor/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 