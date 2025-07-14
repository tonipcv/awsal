import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';

// GET /api/patient/profile - Get patient profile information
export async function GET(request: NextRequest) {
  try {
    // Tentar autenticação web primeiro, depois mobile
    let userId: string | null = null;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Tentar autenticação mobile
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser?.id) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        image: true,
        role: true,
        doctorId: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se é paciente
    if (user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Access denied. Only patients can access this endpoint.' }, { status: 403 });
    }

    return NextResponse.json({ user });

  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/patient/profile - Update patient profile information
export async function PUT(request: NextRequest) {
  try {
    // Tentar autenticação web primeiro, depois mobile
    let userId: string | null = null;
    
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      // Tentar autenticação mobile
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser?.id) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se o usuário existe e é paciente
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingUser.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Access denied. Only patients can update their profile.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      birthDate,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
      notes,
      image
    } = body;

    // Atualizar perfil
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(gender !== undefined && { gender: gender?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(emergencyContact !== undefined && { emergencyContact: emergencyContact?.trim() || null }),
        ...(emergencyPhone !== undefined && { emergencyPhone: emergencyPhone?.trim() || null }),
        ...(medicalHistory !== undefined && { medicalHistory: medicalHistory?.trim() || null }),
        ...(allergies !== undefined && { allergies: allergies?.trim() || null }),
        ...(medications !== undefined && { medications: medications?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(image !== undefined && { image: image?.trim() || null })
      },
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
        image: true,
        role: true,
        doctorId: true,
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Error updating patient profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 