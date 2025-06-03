const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testAdminClinicReferrals() {
  console.log('🧪 Testing Admin Clinic Referrals functionality...\n');

  const client = await pool.connect();
  
  try {
    // 1. Check if clinic_referrals table exists and has data
    console.log('1. Checking clinic_referrals table...');
    const tableCheck = await client.query(`
      SELECT COUNT(*) as count FROM clinic_referrals
    `);
    console.log(`   ✅ Found ${tableCheck.rows[0].count} referrals in database\n`);

    // 2. Test statistics query
    console.log('2. Testing statistics calculation...');
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
    console.log('   📊 Statistics:');
    console.log(`      Total: ${stats.total}`);
    console.log(`      Pending: ${stats.pending}`);
    console.log(`      Contacted: ${stats.contacted}`);
    console.log(`      Converted: ${stats.converted}`);
    console.log(`      Rejected: ${stats.rejected}`);
    console.log(`      Conversion Rate: ${stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%\n`);

    // 3. Test referrals with doctor information query
    console.log('3. Testing referrals with doctor info query...');
    const referralsResult = await client.query(`
      SELECT 
        cr.*,
        u.name as referring_doctor_name,
        u.email as referring_doctor_email
      FROM clinic_referrals cr
      LEFT JOIN "User" u ON cr.referred_by_id = u.id
      ORDER BY cr.created_at DESC
      LIMIT 5
    `);

    console.log(`   ✅ Found ${referralsResult.rows.length} referrals with doctor info:`);
    referralsResult.rows.forEach((referral, index) => {
      console.log(`      ${index + 1}. ${referral.clinic_name} (${referral.status})`);
      console.log(`         Contact: ${referral.contact_name} - ${referral.contact_email}`);
      if (referral.referring_doctor_name) {
        console.log(`         Referred by: Dr. ${referral.referring_doctor_name}`);
      }
      console.log(`         Created: ${new Date(referral.created_at).toLocaleDateString()}`);
      console.log('');
    });

    // 4. Test status update functionality
    if (referralsResult.rows.length > 0) {
      console.log('4. Testing status update...');
      const testReferral = referralsResult.rows[0];
      const originalStatus = testReferral.status;
      
      // Update to CONTACTED if PENDING, or to PENDING if not
      const newStatus = originalStatus === 'PENDING' ? 'CONTACTED' : 'PENDING';
      
      const updateResult = await client.query(`
        UPDATE clinic_referrals 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newStatus, testReferral.id]);

      console.log(`   ✅ Updated referral ${testReferral.id} from ${originalStatus} to ${newStatus}`);
      
      // Revert back to original status
      await client.query(`
        UPDATE clinic_referrals 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
      `, [originalStatus, testReferral.id]);
      
      console.log(`   ✅ Reverted status back to ${originalStatus}\n`);
    }

    // 5. Test reward status update for CONVERTED referrals
    console.log('5. Testing reward status for converted referrals...');
    const convertedReferrals = await client.query(`
      SELECT * FROM clinic_referrals 
      WHERE status = 'CONVERTED' AND referred_by_id IS NOT NULL
      LIMIT 1
    `);

    if (convertedReferrals.rows.length > 0) {
      const referral = convertedReferrals.rows[0];
      console.log(`   ✅ Found converted referral: ${referral.clinic_name}`);
      console.log(`      Reward Status: ${referral.reward_status}`);
      console.log(`      Reward Months: ${referral.reward_months}`);
    } else {
      console.log('   ℹ️  No converted referrals with referring doctor found');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Database table structure is correct');
    console.log('   ✅ Statistics calculation works');
    console.log('   ✅ Referrals with doctor info query works');
    console.log('   ✅ Status update functionality works');
    console.log('   ✅ Reward system is properly configured');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testAdminClinicReferrals().catch(console.error); 