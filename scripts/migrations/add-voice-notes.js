const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createVoiceNoteTables() {
  try {
    // Create VoiceNoteStatus enum
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "VoiceNoteStatus" AS ENUM (
          'PROCESSING',
          'TRANSCRIBED',
          'ANALYZED',
          'ERROR'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    console.log('Created VoiceNoteStatus enum');

    // Create voice_notes table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "voice_notes" (
        "id" TEXT PRIMARY KEY,
        "patientId" TEXT NOT NULL,
        "doctorId" TEXT NOT NULL,
        "audioUrl" TEXT NOT NULL,
        "duration" INTEGER NOT NULL,
        "status" "VoiceNoteStatus" NOT NULL DEFAULT 'PROCESSING',
        "transcription" TEXT,
        "summary" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE,
        FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `;
    console.log('Created voice_notes table');

    // Create voice_note_checklists table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "voice_note_checklists" (
        "id" TEXT PRIMARY KEY,
        "voiceNoteId" TEXT NOT NULL UNIQUE,
        "items" JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("voiceNoteId") REFERENCES "voice_notes"("id") ON DELETE CASCADE
      );
    `;
    console.log('Created voice_note_checklists table');

    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "voice_notes_patientId_idx" ON "voice_notes"("patientId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "voice_notes_doctorId_idx" ON "voice_notes"("doctorId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "voice_notes_status_idx" ON "voice_notes"("status");`;
    console.log('Created indexes');

    console.log('Voice notes tables created successfully');
  } catch (error) {
    console.error('Error creating voice notes tables:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting voice notes migration...');
    await createVoiceNoteTables();
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error); 