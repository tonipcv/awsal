const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create OnboardingTemplate table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "OnboardingTemplate" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "doctorId" TEXT NOT NULL,
        "clinicId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "welcomeTitle" TEXT,
        "welcomeDescription" TEXT,
        "welcomeVideoUrl" TEXT,
        "welcomeButtonText" TEXT,
        "successTitle" TEXT,
        "successDescription" TEXT,
        "successVideoUrl" TEXT,
        "successButtonText" TEXT,
        "successButtonUrl" TEXT,
        "welcomeItems" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "estimatedTime" INTEGER,
        "nextSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "contactEmail" TEXT,
        "contactPhone" TEXT,
        CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "OnboardingTemplate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "OnboardingTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `;
    console.log('✅ Created OnboardingTemplate table');

    // Add onboardingTemplateId column
    await prisma.$executeRaw`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS "onboardingTemplateId" TEXT`;
    console.log('✅ Added onboardingTemplateId column');

    // Check if foreign key constraint exists
    const constraintExists = await prisma.$queryRaw`
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_name = 'protocols_onboardingTemplateId_fkey'
      AND table_name = 'protocols'
    `;

    if (!constraintExists.length) {
      // Add foreign key constraint only if it doesn't exist
      await prisma.$executeRaw`ALTER TABLE protocols ADD CONSTRAINT "protocols_onboardingTemplateId_fkey" FOREIGN KEY ("onboardingTemplateId") REFERENCES "OnboardingTemplate"(id) ON DELETE SET NULL ON UPDATE CASCADE`;
      console.log('✅ Added foreign key constraint');
    } else {
      console.log('ℹ️ Foreign key constraint already exists');
    }

    // Check if index exists
    const indexExists = await prisma.$queryRaw`
      SELECT 1
      FROM pg_indexes
      WHERE indexname = 'protocols_onboardingTemplateId_idx'
    `;

    if (!indexExists.length) {
      // Add index only if it doesn't exist
      await prisma.$executeRaw`CREATE INDEX "protocols_onboardingTemplateId_idx" ON protocols("onboardingTemplateId")`;
      console.log('✅ Added index');
    } else {
      console.log('ℹ️ Index already exists');
    }

    console.log('✅ Migration completed successfully');

    // Regenerate Prisma Client
    console.log('🔄 Regenerating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client regenerated');

  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 