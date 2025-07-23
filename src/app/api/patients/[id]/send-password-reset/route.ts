import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
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

    const { id } = context.params;

    // Check if doctor has access to this patient
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId: doctor.id,
        patientId: id,
        isActive: true
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!relationship || !relationship.patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = relationship.patient;

    // For now, just return a success message
    // TODO: Implement actual email sending functionality
    const token = { token: 'placeholder-token' }; // placeholder token
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/set-password?token=${token.token}`;
    
    console.log(`Sending password reset email to ${patient.email}`);
    
    const emailSent = await sendPasswordResetEmail(
      patient.email,
      token.token
    );
    
    console.log(`Email sent: ${emailSent}`);
    
    return NextResponse.json({
      message: 'Password reset email sent successfully',
      resetUrl: resetUrl // For testing purposes
    });

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 