import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for query parameters
const querySchema = z.object({
  limit: z.string().nullish().transform(val => parseInt(val || '20')),
  offset: z.string().nullish().transform(val => parseInt(val || '0')),
  search: z.string().nullish().transform(val => val || '')
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the doctor's ID from the session user's email
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const { limit, offset, search } = querySchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      search: searchParams.get('search')
    });

    // First find matching patients if search is provided
    let patientIds: string[] = [];
    if (search) {
      const matchingPatients = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        },
        select: { id: true }
      });
      patientIds = matchingPatients.map(p => p.id);
    }

    // Build where clause
    const where = {
      doctorId: doctor.id,
      isActive: true,
      ...(search && patientIds.length > 0 && {
        patientId: { in: patientIds }
      })
    };

    // Get total count for pagination
    const total = await prisma.doctorPatientRelationship.count({ where });

    // Get relationships with pagination
    const relationships = await prisma.doctorPatientRelationship.findMany({
      where,
      include: {
        patient: true
      },
      orderBy: {
        patient: {
          name: 'asc'
        }
      },
      skip: offset,
      take: limit
    });

    // Transform data for response
    const patients = relationships.map(rel => ({
      id: rel.patient.id,
      name: rel.patient.name,
      email: rel.patient.email,
      phone: rel.patient.phone,
      birth_date: rel.patient.birth_date,
      gender: rel.patient.gender
    }));

    return NextResponse.json({
      success: true,
      data: patients,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      message: 'Pacientes carregados com sucesso'
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 