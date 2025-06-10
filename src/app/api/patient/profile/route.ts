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