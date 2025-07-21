import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    
    // Parâmetros de filtro
    const includeDays = searchParams.get('include_days') === 'true';
    const includeProgress = searchParams.get('include_progress') === 'true';
    const includeMetrics = searchParams.get('include_metrics') === 'true';
    const dayNumber = searchParams.get('day') ? parseInt(searchParams.get('day') || '1') : null;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Base query
    const prescriptionQuery = {
      where: {
        id: params.id,
        user_id: user.id
      },
      select: {
        id: true,
        protocol_id: true,
        user_id: true,
        prescribed_by: true,
        prescribed_at: true,
        planned_start_date: true,
        actual_start_date: true,
        planned_end_date: true,
        actual_end_date: true,
        status: true,
        current_day: true,
        adherence_rate: true,
        last_progress_date: true,
        paused_at: true,
        pause_reason: true,
        abandoned_at: true,
        abandon_reason: true,
        consultation_date: true,
        protocol: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            cover_image: true
          }
        }
      }
    };

    // Adicionar dias se solicitado
    if (includeDays) {
      const daysQuery = {
        days: {
          where: dayNumber ? { dayNumber } : undefined,
          select: {
            id: true,
            dayNumber: true,
            title: true,
            description: true,
            sessions: {
              orderBy: { sessionNumber: 'asc' },
              select: {
                id: true,
                sessionNumber: true,
                title: true,
                description: true,
                tasks: {
                  orderBy: { orderIndex: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    type: true,
                    duration: true,
                    orderIndex: true,
                    hasMoreInfo: true,
                    videoUrl: true
                  }
                }
              }
            }
          },
          orderBy: { dayNumber: 'asc' }
        }
      };
      prescriptionQuery.select.protocol.select = {
        ...prescriptionQuery.select.protocol.select,
        ...daysQuery
      };
    }

    // Adicionar progresso se solicitado
    if (includeProgress) {
      const progressQuery = {
        progress: {
          where: {
            ...(startDate && {
              scheduledDate: {
                gte: new Date(startDate)
              }
            }),
            ...(endDate && {
              scheduledDate: {
                lte: new Date(endDate)
              }
            })
          },
          select: {
            id: true,
            dayNumber: true,
            scheduledDate: true,
            completedAt: true,
            status: true,
            notes: true,
            protocolTask: {
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          },
          orderBy: {
            scheduledDate: 'desc'
          }
        }
      };
      prescriptionQuery.select = {
        ...prescriptionQuery.select,
        ...progressQuery
      };
    }

    // Buscar prescrição com os filtros aplicados
    const prescription = await prisma.protocolPrescription.findUnique(prescriptionQuery);

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada' },
        { status: 404 }
      );
    }

    // Calcular métricas se solicitado
    let metrics;
    if (includeMetrics) {
      const totalTasks = await prisma.protocolTask.count({
        where: {
          protocolSession: {
            protocolDay: {
              protocol: {
                id: prescription.protocol_id
              }
            }
          }
        }
      });

      const completedTasks = await prisma.protocolTaskProgress.count({
        where: {
          prescriptionId: prescription.id,
          completedAt: { not: null }
        }
      });

      metrics = {
        totalTasks,
        completedTasks,
        adherenceRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    }

    return NextResponse.json({
      success: true,
      prescription: {
        ...prescription,
        ...(includeMetrics && { metrics })
      }
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/prescriptions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 