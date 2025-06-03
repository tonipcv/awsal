const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createTableSQL = `
-- Create clinic_referrals table
CREATE TABLE IF NOT EXISTS clinic_referrals (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    clinic_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(255),
    clinic_address TEXT,
    specialties TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONTACTED', 'CONVERTED', 'REJECTED')),
    reward_status VARCHAR(50) DEFAULT 'PENDING' CHECK (reward_status IN ('PENDING', 'APPROVED', 'CREDITED')),
    reward_months INTEGER DEFAULT 1,
    referred_by_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_clinic_referrals_referred_by 
        FOREIGN KEY (referred_by_id) 
        REFERENCES "User"(id) 
        ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate referrals
    CONSTRAINT unique_referral_per_doctor_email 
        UNIQUE (referred_by_id, contact_email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clinic_referrals_referred_by_id ON clinic_referrals(referred_by_id);
CREATE INDEX IF NOT EXISTS idx_clinic_referrals_status ON clinic_referrals(status);
CREATE INDEX IF NOT EXISTS idx_clinic_referrals_reward_status ON clinic_referrals(reward_status);
CREATE INDEX IF NOT EXISTS idx_clinic_referrals_created_at ON clinic_referrals(created_at);
`;

const createTriggerSQL = `
-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_clinic_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_clinic_referrals_updated_at
    BEFORE UPDATE ON clinic_referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_referrals_updated_at();
`;

async function createClinicReferralsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating clinic_referrals table...');
    
    // Execute table creation
    await client.query(createTableSQL);
    console.log('✅ Table clinic_referrals created successfully!');
    
    // Execute trigger creation
    await client.query(createTriggerSQL);
    console.log('✅ Trigger for updated_at created successfully!');
    
    // Test the table by checking if it exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'clinic_referrals'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Table verification successful!');
      
      // Show table structure
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'clinic_referrals'
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
    } else {
      console.log('❌ Table verification failed!');
    }
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createClinicReferralsTable()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  }); 