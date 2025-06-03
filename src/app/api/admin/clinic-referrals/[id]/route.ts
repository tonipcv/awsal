import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is authenticated and is super admin
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { id: referralId } = await params;

    // Validate status
    const validStatuses = ['PENDING', 'CONTACTED', 'CONVERTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Verify user role
      const userResult = await client.query(`
        SELECT role FROM "User" WHERE id = $1
      `, [session.user.id]);

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Update referral status
      const updateResult = await client.query(`
        UPDATE clinic_referrals 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [status, referralId]);

      if (updateResult.rows.length === 0) {
        return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
      }

      // If status is CONVERTED, update reward status
      if (status === 'CONVERTED') {
        await client.query(`
          UPDATE clinic_referrals 
          SET reward_status = 'APPROVED', reward_months = 1
          WHERE id = $1
        `, [referralId]);
      }

      return NextResponse.json({ 
        message: 'Referral status updated successfully',
        referral: updateResult.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating referral status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 