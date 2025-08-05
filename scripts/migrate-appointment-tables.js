// Script to create appointment and Google Calendar credentials tables
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database migration for appointment tables...');

  try {
    // Skip creating AppointmentStatus enum since it already exists
    console.log('✅ AppointmentStatus enum already exists, skipping creation');

    // Create GoogleCalendarCredentials table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "GoogleCalendarCredentials" (
        "id" TEXT NOT NULL,
        "doctorId" TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "calendarId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "GoogleCalendarCredentials_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "GoogleCalendarCredentials_doctorId_key" UNIQUE ("doctorId"),
        CONSTRAINT "GoogleCalendarCredentials_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    console.log('✅ GoogleCalendarCredentials table created');

    // Create Appointment table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Appointment" (
        "id" TEXT NOT NULL,
        "patientId" TEXT NOT NULL,
        "doctorId" TEXT NOT NULL,
        "startTime" TIMESTAMP(3) NOT NULL,
        "endTime" TIMESTAMP(3) NOT NULL,
        "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
        "title" TEXT NOT NULL,
        "notes" TEXT,
        "googleEventId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        
        CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    console.log('✅ Appointment table created');

    // Create indexes for better query performance
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Appointment_patientId_idx" ON "Appointment"("patientId")`;    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Appointment_doctorId_idx" ON "Appointment"("doctorId")`;    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Appointment_startTime_idx" ON "Appointment"("startTime")`;    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Appointment_status_idx" ON "Appointment"("status")`;
    console.log('✅ Indexes created for Appointment table');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Migration script execution completed.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Unhandled error in migration script:', e);
    process.exit(1);
  });
