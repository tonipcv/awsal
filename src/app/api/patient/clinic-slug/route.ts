import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user (patient) with their doctor
    const patient = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        doctorId: true,
        doctor: {
          select: {
            id: true,
            // Check if doctor owns a clinic
            ownedClinics: {
              where: { isActive: true },
              select: { slug: true },
              take: 1
            },
            // Check if doctor is a member of a clinic
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: { slug: true }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    if (!patient?.doctorId || !patient.doctor) {
      return NextResponse.json({ error: 'No doctor assigned' }, { status: 404 });
    }

    let clinicSlug = null;

    // Check if doctor owns a clinic
    if (patient.doctor.ownedClinics.length > 0) {
      clinicSlug = patient.doctor.ownedClinics[0].slug;
    }
    // Otherwise check if doctor is a member of a clinic
    else if (patient.doctor.clinicMemberships.length > 0) {
      clinicSlug = patient.doctor.clinicMemberships[0].clinic.slug;
    }

    return NextResponse.json({ clinicSlug });

  } catch (error) {
    console.error('Error fetching clinic slug:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 