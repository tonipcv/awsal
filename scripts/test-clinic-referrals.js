const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testClinicReferrals() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing clinic_referrals table...');
    
    // Test 1: Check if table exists
    const tableExists = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clinic_referrals'
    `);
    
    if (tableExists.rows.length === 0) {
      console.log('❌ Table clinic_referrals does not exist!');
      return;
    }
    
    console.log('✅ Table clinic_referrals exists');
    
    // Test 2: Check table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clinic_referrals'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Test 3: Check if we can insert and select data
    console.log('\n🔍 Testing basic operations...');
    
    // Get a doctor user for testing
    const doctorResult = await client.query(`
      SELECT id, name, email 
      FROM "User" 
      WHERE role = 'DOCTOR' 
      LIMIT 1
    `);
    
    if (doctorResult.rows.length === 0) {
      console.log('⚠️  No doctor found for testing. Creating a test doctor...');
      
      // Create a test doctor
      const testDoctor = await client.query(`
        INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, 'test-doctor@example.com', 'Test Doctor', 'DOCTOR', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name, email
      `);
      
      console.log('✅ Test doctor created:', testDoctor.rows[0]);
      var testDoctorId = testDoctor.rows[0].id;
    } else {
      console.log('✅ Found doctor for testing:', doctorResult.rows[0]);
      var testDoctorId = doctorResult.rows[0].id;
    }
    
    // Test insert
    const testReferral = await client.query(`
      INSERT INTO clinic_referrals (
        clinic_name,
        contact_name,
        contact_email,
        contact_phone,
        clinic_address,
        specialties,
        notes,
        referred_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (referred_by_id, contact_email) 
      DO UPDATE SET clinic_name = EXCLUDED.clinic_name
      RETURNING id, clinic_name, status, created_at
    `, [
      'Test Clinic',
      'Dr. Test Contact',
      'test-contact@clinic.com',
      '+1 (555) 123-4567',
      '123 Test Street, Test City',
      'General Medicine, Cardiology',
      'This is a test referral',
      testDoctorId
    ]);
    
    console.log('✅ Test referral created/updated:', testReferral.rows[0]);
    
    // Test select
    const selectResult = await client.query(`
      SELECT 
        cr.*,
        u.name as doctor_name,
        u.email as doctor_email
      FROM clinic_referrals cr
      JOIN "User" u ON cr.referred_by_id = u.id
      WHERE cr.referred_by_id = $1
      ORDER BY cr.created_at DESC
      LIMIT 5
    `, [testDoctorId]);
    
    console.log('\n📊 Recent referrals for test doctor:');
    selectResult.rows.forEach(ref => {
      console.log(`  - ${ref.clinic_name} (${ref.contact_email}) - Status: ${ref.status} - Created: ${ref.created_at}`);
    });
    
    // Test stats calculation
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_referrals,
        COUNT(*) FILTER (WHERE status = 'CONVERTED') as converted_referrals,
        COALESCE(SUM(reward_months) FILTER (WHERE reward_status = 'CREDITED'), 0) as total_rewards_earned,
        COALESCE(SUM(reward_months) FILTER (WHERE reward_status IN ('PENDING', 'APPROVED')), 0) as pending_rewards
      FROM clinic_referrals
      WHERE referred_by_id = $1
    `, [testDoctorId]);
    
    console.log('\n📈 Stats for test doctor:');
    const stats = statsResult.rows[0];
    console.log(`  - Total referrals: ${stats.total_referrals}`);
    console.log(`  - Pending referrals: ${stats.pending_referrals}`);
    console.log(`  - Converted referrals: ${stats.converted_referrals}`);
    console.log(`  - Total rewards earned: ${stats.total_rewards_earned}`);
    console.log(`  - Pending rewards: ${stats.pending_rewards}`);
    
    // Clean up test data
    await client.query(`
      DELETE FROM clinic_referrals 
      WHERE referred_by_id = $1 
      AND contact_email = 'test-contact@clinic.com'
    `, [testDoctorId]);
    
    console.log('\n🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testClinicReferrals()
  .then(() => {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  }); 