const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addOnboardingLinkColumn() {
  try {
    // Check if column already exists
    const checkColumnQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'UserProtocol' 
        AND column_name = 'onboardingLink'
      );
    `;
    
    const { rows: [{ exists }] } = await pool.query(checkColumnQuery);
    
    if (exists) {
      console.log('Column onboardingLink already exists');
      return;
    }

    // Add the column
    await pool.query(`
      ALTER TABLE "UserProtocol"
      ADD COLUMN "onboardingLink" TEXT,
      ADD CONSTRAINT "UserProtocol_onboardingLink_key" UNIQUE ("onboardingLink");
    `);

    console.log('Successfully added onboardingLink column to UserProtocol table');

  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addOnboardingLinkColumn(); 