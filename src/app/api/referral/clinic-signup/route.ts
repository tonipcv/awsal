import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: NextRequest) {
  try {
    const {
      clinicName,
      contactName,
      contactEmail,
      contactPhone,
      clinicAddress,
      specialties,
      message,
      referralId
    } = await request.json();

    // Validate required fields
    if (!clinicName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: 'Clinic name, contact name, and email are required' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Verify the referring doctor exists if referralId is provided
      let referringDoctor = null;
      if (referralId) {
        const doctorResult = await client.query(`
          SELECT id, name, email
          FROM "User"
          WHERE id = $1 AND role = 'DOCTOR'
        `, [referralId]);

        if (doctorResult.rows.length > 0) {
          referringDoctor = doctorResult.rows[0];
        }
      }

      // Insert the clinic referral request
      const insertResult = await client.query(`
        INSERT INTO clinic_referrals (
          clinic_name,
          contact_name,
          contact_email,
          contact_phone,
          clinic_address,
          specialties,
          notes,
          referred_by_id,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (referred_by_id, contact_email) 
        DO UPDATE SET 
          clinic_name = EXCLUDED.clinic_name,
          contact_name = EXCLUDED.contact_name,
          contact_phone = EXCLUDED.contact_phone,
          clinic_address = EXCLUDED.clinic_address,
          specialties = EXCLUDED.specialties,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING id, clinic_name, status, created_at
      `, [
        clinicName,
        contactName,
        contactEmail,
        contactPhone || null,
        clinicAddress || null,
        specialties || null,
        message || 'Demo request submitted via referral link',
        referralId || null,
        'PENDING'
      ]);

      const referral = insertResult.rows[0];

      // TODO: Send notification email to admin team about new demo request
      // TODO: Send confirmation email to the clinic contact
      // TODO: If there's a referring doctor, send them a notification

      return NextResponse.json({
        success: true,
        message: 'Demo request submitted successfully',
        referral: {
          id: referral.id,
          clinicName: referral.clinic_name,
          status: referral.status,
          createdAt: referral.created_at
        },
        referringDoctor: referringDoctor ? {
          name: referringDoctor.name,
          email: referringDoctor.email
        } : null
      });

    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('Error processing clinic signup:', error);
    
    // Handle unique constraint violation (duplicate referral)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A demo request from this email already exists for this referrer' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 