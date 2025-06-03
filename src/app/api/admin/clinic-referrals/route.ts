import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is super admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin by querying the database
    const client = await pool.connect();
    
    try {
      // Verify user role
      const userResult = await client.query(`
        SELECT role FROM "User" WHERE id = $1
      `, [session.user.id]);

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get all referrals with referring doctor information
      const referralsResult = await client.query(`
        SELECT 
          cr.*,
          u.name as referring_doctor_name,
          u.email as referring_doctor_email
        FROM clinic_referrals cr
        LEFT JOIN "User" u ON cr.referred_by_id = u.id
        ORDER BY cr.created_at DESC
      `);

      // Get statistics
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'CONTACTED' THEN 1 END) as contacted,
          COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) as converted,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected
        FROM clinic_referrals
      `);

      const stats = statsResult.rows[0];
      
      // Format referrals data
      const referrals = referralsResult.rows.map(row => ({
        id: row.id,
        clinic_name: row.clinic_name,
        contact_name: row.contact_name,
        contact_email: row.contact_email,
        contact_phone: row.contact_phone,
        clinic_address: row.clinic_address,
        specialties: row.specialties,
        notes: row.notes,
        status: row.status,
        reward_status: row.reward_status,
        reward_months: row.reward_months,
        referred_by_id: row.referred_by_id,
        referring_doctor: row.referring_doctor_name ? {
          name: row.referring_doctor_name,
          email: row.referring_doctor_email
        } : null,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      return NextResponse.json({
        success: true,
        referrals,
        stats: {
          total: parseInt(stats.total),
          pending: parseInt(stats.pending),
          contacted: parseInt(stats.contacted),
          converted: parseInt(stats.converted),
          rejected: parseInt(stats.rejected)
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching clinic referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 