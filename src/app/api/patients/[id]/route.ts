import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: params.id,
        isActive: true
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            birth_date: true,
            gender: true,
            address: true,
            emergency_contact: true,
            emergency_phone: true,
            medical_history: true,
            allergies: true,
            medications: true,
            notes: true,
            is_active: true
          }
        }
      }
    });

    if (!relationship || !relationship.patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Transform to legacy format
    const patient = {
      id: relationship.patient.id,
      name: relationship.patient.name,
      email: relationship.patient.email,
      phone: relationship.patient.phone,
      birthDate: relationship.patient.birth_date,
      gender: relationship.patient.gender,
      address: relationship.patient.address,
      emergencyContact: relationship.patient.emergency_contact,
      emergencyPhone: relationship.patient.emergency_phone,
      medicalHistory: relationship.patient.medical_history,
      allergies: relationship.patient.allergies,
      medications: relationship.patient.medications,
      notes: relationship.patient.notes
    };

    return NextResponse.json(patient);

  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: params.id,
        isActive: true
      }
    });

    if (!relationship) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 403 });
    }

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

    // Update patient
    const updatedPatient = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(birthDate && { birth_date: new Date(birthDate) }),
        ...(gender && { gender }),
        ...(address && { address }),
        ...(emergencyContact && { emergency_contact: emergencyContact }),
        ...(emergencyPhone && { emergency_phone: emergencyPhone }),
        ...(medicalHistory && { medical_history: medicalHistory }),
        ...(allergies && { allergies }),
        ...(medications && { medications }),
        ...(notes && { notes })
      }
    });

    return NextResponse.json({
      id: updatedPatient.id,
      name: updatedPatient.name,
      email: updatedPatient.email,
      phone: updatedPatient.phone
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: params.id,
        isActive: true
      }
    });

    if (!relationship) {
      return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    await prisma.user.update({
      where: { id: params.id },
      data: { is_active: false }
    });

    return NextResponse.json({ message: 'Patient deleted successfully' });

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 