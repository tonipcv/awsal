import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('id');

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Get doctor information
      const doctorResult = await client.query(`
        SELECT id, name, email, image
        FROM "User"
        WHERE id = $1 AND role = 'DOCTOR'
      `, [doctorId]);

      if (doctorResult.rows.length === 0) {
        return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
      }

      const doctor = doctorResult.rows[0];

      return NextResponse.json({
        success: true,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          image: doctor.image
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error fetching doctor info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 