import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        doctorId: true,
        doctor: {
          select: {
            name: true,
            googleReviewLink: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.name,
      doctorName: user.doctor?.name,
      googleReviewLink: user.doctor?.googleReviewLink
    });

  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 