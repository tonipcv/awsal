import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier: email,
          token: code
        }
      }
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { message: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Update user
    const user = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
        verificationCode: null,
        verificationCodeExpiry: null
      }
    });

    // Delete verification token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token: code
        }
      }
    });

    // For doctors, also ensure they have a clinic
    if (user.role === 'DOCTOR') {
      // Import clinic utils for auto-clinic creation
      const { ensureDoctorHasClinic } = await import('@/lib/clinic-utils');
      await ensureDoctorHasClinic(user.id);
    }

    // Return success with redirect URL
    return NextResponse.json({
      message: "Email verified successfully",
      redirectUrl: user.role === 'DOCTOR' ? '/doctor/onboarding' : '/dashboard'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { message: "Error verifying email" },
      { status: 500 }
    );
  }
} 