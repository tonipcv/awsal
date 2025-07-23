import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
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

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: userId,
        patientId: id,
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
            is_active: true
          }
        }
      }
    });

    if (!relationship || !relationship.patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...relationship.patient,
        birth_date: relationship.patient.birth_date?.toISOString()
      },
      message: 'Detalhes do paciente carregados com sucesso'
    });

  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
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

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: userId,
        patientId: id,
        isActive: true
      }
    });

    if (!relationship) {
      return NextResponse.json(
        { success: false, error: 'Patient not found or access denied' },
        { status: 403 }
      );
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
      is_active,
      is_primary
    } = body;

    // Check if email exists and belongs to a different user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { success: false, error: 'Email already registered to another user' },
          { status: 400 }
        );
      }
    }

    // Update patient
    const updatedPatient = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(birth_date && { birth_date: new Date(birth_date) }),
        ...(gender && { gender }),
        ...(address && { address }),
        ...(emergency_contact && { emergency_contact }),
        ...(emergency_phone && { emergency_phone }),
        ...(medical_history && { medical_history }),
        ...(allergies && { allergies }),
        ...(medications && { medications }),
        ...(typeof is_active === 'boolean' && { is_active })
      }
    });

    // Update relationship if is_primary is provided
    if (typeof is_primary === 'boolean') {
      await prisma.doctorPatientRelationship.updateMany({
        where: {
          doctorId: userId,
          patientId: id
        },
        data: { isPrimary: is_primary }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPatient.id,
        name: updatedPatient.name,
        email: updatedPatient.email,
        phone: updatedPatient.phone
      },
      message: 'Paciente atualizado com sucesso'
    });

  } catch (error) {
    console.error('Error updating patient:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
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

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: userId,
        patientId: id,
        isActive: true
      }
    });

    if (!relationship) {
      return NextResponse.json(
        { success: false, error: 'Patient not found or access denied' },
        { status: 403 }
      );
    }

    // Soft delete by setting is_active to false
    await prisma.user.update({
      where: { id },
      data: { is_active: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Paciente removido com sucesso'
    });

  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
