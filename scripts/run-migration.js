const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const prisma = new PrismaClient();

  try {
    // Add each column separately
    const alterCommands = [
      'ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS welcome_video_url TEXT;',
      'ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS welcome_button_text TEXT;',
      'ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS success_video_url TEXT;',
      'ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS success_button_text TEXT;',
      'ALTER TABLE onboarding_templates ADD COLUMN IF NOT EXISTS success_button_url TEXT;'
    ];

    for (const command of alterCommands) {
      await prisma.$executeRawUnsafe(command);
      console.log('Executed:', command);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration(); 