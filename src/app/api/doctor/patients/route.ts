import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the doctor's ID from the session user's email
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    console.log('🔍 Doctor:', {
      email: session.user.email,
      doctorId: doctor?.id,
      role: doctor?.role
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      console.log('❌ Not a doctor');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Buscar pacientes usando apenas o novo modelo de relacionamentos
    const relationships = await prisma.doctorPatientRelationship.findMany({
      where: {
        doctorId: doctor.id,
        isActive: true
      },
      include: {
        patient: {
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
            emailVerified: true,
            image: true,
            assignedProtocols: {
              where: {
                isActive: true
              },
              include: {
                protocol: {
                  select: {
                    id: true,
                    name: true,
                    duration: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('🔍 Found relationships:', {
      count: relationships.length,
      relationships: relationships.map(rel => ({
        relationshipId: rel.id,
        patientId: rel.patient.id,
        patientName: rel.patient.name,
        patientEmail: rel.patient.email,
        isPrimary: rel.isPrimary
      }))
    });

    // Transformar os relacionamentos em uma lista de pacientes
    const patients = relationships.map(rel => ({
      ...rel.patient,
      isPrimary: rel.isPrimary,
      speciality: rel.speciality,
      relationshipId: rel.id
    })).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );

    console.log('✅ Returning patients:', {
      count: patients.length,
      patients: patients.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email
      }))
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error('❌ Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 