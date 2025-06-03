import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

interface ClinicReferral {
  id: string;
  clinic_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  clinic_address?: string;
  specialties?: string;
  notes?: string;
  status: string;
  reward_status: string;
  reward_months?: number;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they are a doctor
    const userResult = await query(
      'SELECT id, role FROM "User" WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userId = userResult.rows[0].id;

    // Get clinic referrals for this doctor
    const referralsResult = await query(
      `SELECT 
        id,
        clinic_name,
        contact_name,
        contact_email,
        contact_phone,
        clinic_address,
        specialties,
        notes,
        status,
        reward_status,
        reward_months,
        created_at,
        updated_at
      FROM clinic_referrals 
      WHERE referred_by_id = $1 
      ORDER BY created_at DESC`,
      [userId]
    );

    const referrals: ClinicReferral[] = referralsResult.rows;

    // Calculate stats
    const stats = {
      totalReferrals: referrals.length,
      pendingReferrals: referrals.filter((r: ClinicReferral) => r.status === 'PENDING').length,
      convertedReferrals: referrals.filter((r: ClinicReferral) => r.status === 'CONVERTED').length,
      totalRewardsEarned: referrals
        .filter((r: ClinicReferral) => r.reward_status === 'CREDITED')
        .reduce((sum: number, r: ClinicReferral) => sum + (r.reward_months || 0), 0),
      pendingRewards: referrals
        .filter((r: ClinicReferral) => r.reward_status === 'PENDING' || r.reward_status === 'APPROVED')
        .reduce((sum: number, r: ClinicReferral) => sum + (r.reward_months || 1), 0)
    };

    // Convert snake_case to camelCase for frontend
    const formattedReferrals = referrals.map((r: ClinicReferral) => ({
      id: r.id,
      clinicName: r.clinic_name,
      contactName: r.contact_name,
      contactEmail: r.contact_email,
      contactPhone: r.contact_phone,
      clinicAddress: r.clinic_address,
      specialties: r.specialties,
      notes: r.notes,
      status: r.status,
      rewardStatus: r.reward_status,
      rewardMonths: r.reward_months,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    return NextResponse.json({
      referrals: formattedReferrals,
      stats
    });

  } catch (error) {
    console.error('Error fetching clinic referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify they are a doctor
    const userResult = await query(
      'SELECT id, role FROM "User" WHERE email = $1',
      [session.user.email]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const userId = userResult.rows[0].id;

    const body = await request.json();
    const {
      clinicName,
      contactName,
      contactEmail,
      contactPhone,
      clinicAddress,
      specialties,
      notes
    } = body;

    // Validate required fields
    if (!clinicName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Clinic name, contact name, and contact email are required' },
        { status: 400 }
      );
    }

    // Check if this clinic/email was already referred by this doctor
    const existingResult = await query(
      `SELECT id FROM clinic_referrals 
       WHERE referred_by_id = $1 
       AND (contact_email = $2 OR clinic_name = $3)`,
      [userId, contactEmail, clinicName]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already referred this clinic or contact' },
        { status: 400 }
      );
    }

    // Generate a unique ID (you can use uuid library or let PostgreSQL generate it)
    const referralResult = await query(
      `INSERT INTO clinic_referrals (
        clinic_name,
        contact_name,
        contact_email,
        contact_phone,
        clinic_address,
        specialties,
        notes,
        status,
        reward_status,
        reward_months,
        referred_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, clinic_name, status`,
      [
        clinicName,
        contactName,
        contactEmail,
        contactPhone || null,
        clinicAddress || null,
        specialties || null,
        notes || null,
        'PENDING',
        'PENDING',
        1,
        userId
      ]
    );

    const referral = referralResult.rows[0];

    // TODO: Send notification email to admin about new clinic referral
    // TODO: Send email to the referred clinic

    return NextResponse.json({
      message: 'Clinic referral submitted successfully',
      referral: {
        id: referral.id,
        clinicName: referral.clinic_name,
        status: referral.status
      }
    });

  } catch (error) {
    console.error('Error creating clinic referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 