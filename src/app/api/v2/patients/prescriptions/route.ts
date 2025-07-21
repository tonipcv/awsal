import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

// GET /api/v2/patients/prescriptions - Listar protocolos prescritos
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const where: any = {
      user_id: user.id,
    };

    if (status) {
      where.status = status;
    }

    // Buscar prescrições
    const prescriptions = await prisma.protocolPrescription.findMany({
      where,
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            cover_image: true,
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                clinic_memberships: {
                  where: { isActive: true },
                  include: {
                    clinic: {
                      select: {
                        name: true,
                        logo: true
                      }
                    }
                  },
                  take: 1
                }
              }
            }
          }
        },
        progress: {
          select: {
            id: true,
            dayNumber: true,
            scheduledDate: true,
            completedAt: true,
            status: true,
          },
          orderBy: {
            scheduledDate: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        prescribed_at: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Contar total para paginação
    const total = await prisma.protocolPrescription.count({ where });

    return NextResponse.json({
      success: true,
      prescriptions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      message: 'Prescrições carregadas com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/prescriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
