import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateUserId } from '@/lib/utils/generate-id';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Try web authentication first, then mobile
    let userId: string | null = null;
    let userRole: string | null = null;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      userRole = dbUser?.role || null;
    } else {
      // Try mobile authentication
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser?.id) {
        userId = mobileUser.id;
        userRole = mobileUser.role;
      }
    }
    
    if (!userId || userRole !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search')?.toLowerCase();
    const isActive = searchParams.get('is_active') === 'true';

    if (limit < 0 || offset < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get doctor's patients through relationships
    const relationships = await prisma.doctorPatientRelationship.findMany({
      where: {
        doctorId: userId,
        isActive: true,
        ...(isActive !== undefined && {
          patient: {
            is_active: isActive
          }
        }),
        ...(search && {
          patient: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        })
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            birth_date: true,
            is_active: true,
            patient_prescriptions: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                protocol: {
                  select: {
                    id: true,
                    name: true,
                    duration: true
                  }
                },
                planned_start_date: true,
                planned_end_date: true,
                status: true
              }
            }
          }
        }
      },
      skip: offset,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.doctorPatientRelationship.count({
      where: {
        doctorId: userId,
        isActive: true,
        ...(isActive !== undefined && {
          patient: {
            is_active: isActive
          }
        }),
        ...(search && {
          patient: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        })
      }
    });

    // Format response
    const patients = relationships.map((relationship) => ({
      id: relationship.patientId,
      name: relationship.patient.name,
      email: relationship.patient.email,
      phone: relationship.patient.phone,
      birth_date: relationship.patient.birth_date,
      is_active: relationship.patient.is_active,
      assigned_protocols: relationship.patient.patient_prescriptions?.map(p => ({
        id: p.id,
        protocol: p.protocol,
        start_date: p.planned_start_date,
        end_date: p.planned_end_date,
        is_active: p.status === 'ACTIVE'
      })) || []
    }));

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      message: 'Pacientes carregados com sucesso'
    });

  } catch (error) {
    console.error('Error in GET /api/v2/doctor/patients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null;
    let userRole: string | null = null;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      userRole = dbUser?.role || null;
    } else {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser?.id) {
        userId = mobileUser.id;
        userRole = mobileUser.role;
      }
    }
    
    if (!userId || userRole !== 'DOCTOR') {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      birth_date,
      gender,
      address,
      emergency_contact,
      emergency_phone,
      medical_history,
      allergies,
      medications,
      is_primary,
      protocolIds
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!email) missingFields.push('email');
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          details: { missingFields }
        },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format',
          details: { email }
        },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already registered',
          details: { email }
        },
        { status: 409 }
      );
    }

    // Create patient user and relationship in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create patient user
      const patient = await tx.user.create({
        data: {
          id: await generateUserId(),
          name,
          email,
          phone,
          birth_date: birth_date ? new Date(birth_date) : null,
          gender,
          address,
          emergency_contact,
          emergency_phone,
          medical_history,
          allergies,
          medications,
          role: 'PATIENT',
          is_active: true
        }
      });

      // Create doctor-patient relationship
      await tx.doctorPatientRelationship.create({
        data: {
          doctorId: userId!,
          patientId: patient.id,
          isActive: true,
          isPrimary: is_primary ?? false
        }
      });

      // Create protocol prescriptions if any protocols were selected
      if (protocolIds?.length > 0) {
        const generateId = async () => generateUserId();
        await Promise.all(protocolIds.map(async (protocolId: string) =>
          tx.protocolPrescription.create({
            data: {
              id: await generateId(),
              protocol_id: protocolId,
              user_id: patient.id,
              prescribed_by: userId!,
              planned_start_date: new Date(),
              planned_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
              status: 'ACTIVE'
            }
          })
        ));
      }

      return patient;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        birth_date: result.birth_date?.toISOString(),
        gender: result.gender
      },
      message: 'Paciente criado com sucesso'
    });

  } catch (error) {
    console.error('Error in POST /api/v2/doctor/patients:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
    
    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database operation failed',
          details: {
            code: error.code,
            message: error.message
          }
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}