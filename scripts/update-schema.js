const { PrismaClient } = require('@prisma/client');

async function updateSchema() {
  const prisma = new PrismaClient();

  try {
    // Get all templates with only existing columns
    const templates = await prisma.$queryRaw`SELECT id, name FROM "OnboardingTemplate"`;
    console.log(`Found ${templates.length} templates`);

    // Update schema with all columns including arrays
    await prisma.$executeRaw`
      ALTER TABLE "OnboardingTemplate" 
      ADD COLUMN IF NOT EXISTS "welcomeTitle" TEXT,
      ADD COLUMN IF NOT EXISTS "welcomeDescription" TEXT,
      ADD COLUMN IF NOT EXISTS "welcomeVideoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "welcomeButtonText" TEXT,
      ADD COLUMN IF NOT EXISTS "welcomeItems" TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "estimatedTime" INTEGER,
      ADD COLUMN IF NOT EXISTS "successTitle" TEXT,
      ADD COLUMN IF NOT EXISTS "successDescription" TEXT,
      ADD COLUMN IF NOT EXISTS "successVideoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "successButtonText" TEXT,
      ADD COLUMN IF NOT EXISTS "successButtonUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "nextSteps" TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
      ADD COLUMN IF NOT EXISTS "contactPhone" TEXT
    `;

    console.log('Schema updated successfully!');
  } catch (error) {
    console.error('Error updating schema:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateSchema(); 