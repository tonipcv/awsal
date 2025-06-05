import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      },
      include: {
        doctor: {
          select: {
            name: true,
            googleReviewLink: true,
            // Get clinic information for the doctor
            ownedClinics: {
              where: { isActive: true },
              select: { slug: true, name: true },
              take: 1
            },
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: { slug: true, name: true }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        emailVerified: new Date() // Mark email as verified when password is set
      }
    });

    console.log(`✅ Password updated successfully for user: ${user.email}`);

    // Get clinic information for response
    let clinicName = 'Your Healthcare Provider';
    let clinicSlug = null;
    
    if (user.doctor) {
      // Check if doctor owns a clinic
      if (user.doctor.ownedClinics.length > 0) {
        clinicName = user.doctor.ownedClinics[0].name;
        clinicSlug = user.doctor.ownedClinics[0].slug;
      }
      // Otherwise check if doctor is a member of a clinic
      else if (user.doctor.clinicMemberships.length > 0) {
        clinicName = user.doctor.clinicMemberships[0].clinic.name;
        clinicSlug = user.doctor.clinicMemberships[0].clinic.slug;
      }
    }

    return NextResponse.json({
      message: 'Password updated successfully',
      clinicName,
      clinicSlug,
      doctorName: user.doctor?.name || '',
      googleReviewLink: user.doctor?.googleReviewLink || ''
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 