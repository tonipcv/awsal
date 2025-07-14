const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTables() {
  try {
    // Criar enum PrescriptionStatus
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "PrescriptionStatus" AS ENUM ('PRESCRIBED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Criar enum DayStatus
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "DayStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'POSTPONED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Criar tabela protocol_prescriptions
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "protocol_prescriptions" (
        "id" TEXT NOT NULL,
        "protocolId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "prescribedBy" TEXT NOT NULL,
        "prescribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "plannedStartDate" TIMESTAMP(3) NOT NULL,
        "actualStartDate" TIMESTAMP(3),
        "plannedEndDate" TIMESTAMP(3) NOT NULL,
        "actualEndDate" TIMESTAMP(3),
        "status" "PrescriptionStatus" NOT NULL DEFAULT 'PRESCRIBED',
        "currentDay" INTEGER NOT NULL DEFAULT 1,
        "adherenceRate" DOUBLE PRECISION,
        "lastProgressDate" TIMESTAMP(3),
        "pausedAt" TIMESTAMP(3),
        "pauseReason" TEXT,
        "abandonedAt" TIMESTAMP(3),
        "abandonReason" TEXT,
        "consultationDate" TIMESTAMPTZ(6),
        "onboardingLink" TEXT,
        "preConsultationTemplateId" TEXT,
        "preConsultationStatus" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "protocol_prescriptions_pkey" PRIMARY KEY ("id")
      );
    `;

    // Criar tabela protocol_day_progress_v2
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "protocol_day_progress_v2" (
        "id" TEXT NOT NULL,
        "prescriptionId" TEXT NOT NULL,
        "dayNumber" INTEGER NOT NULL,
        "scheduledDate" TIMESTAMP(3) NOT NULL,
        "completedAt" TIMESTAMP(3),
        "status" "DayStatus" NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "protocolTaskId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "protocol_day_progress_v2_pkey" PRIMARY KEY ("id")
      );
    `;

    // Criar índices e constraints
    await prisma.$executeRaw`
      DO $$ BEGIN
        -- Índices para protocol_prescriptions
        CREATE UNIQUE INDEX IF NOT EXISTS "protocol_prescriptions_onboardingLink_key" 
          ON "protocol_prescriptions"("onboardingLink");
        CREATE UNIQUE INDEX IF NOT EXISTS "protocol_prescriptions_userId_protocolId_key" 
          ON "protocol_prescriptions"("userId", "protocolId");
        CREATE INDEX IF NOT EXISTS "protocol_prescriptions_userId_idx" 
          ON "protocol_prescriptions"("userId");
        CREATE INDEX IF NOT EXISTS "protocol_prescriptions_prescribedBy_idx" 
          ON "protocol_prescriptions"("prescribedBy");
        CREATE INDEX IF NOT EXISTS "protocol_prescriptions_status_idx" 
          ON "protocol_prescriptions"("status");
        
        -- Índices para protocol_day_progress_v2
        CREATE UNIQUE INDEX IF NOT EXISTS "protocol_day_progress_v2_prescriptionId_protocolTaskId_schedul_key" 
          ON "protocol_day_progress_v2"("prescriptionId", "protocolTaskId", "scheduledDate");
        CREATE INDEX IF NOT EXISTS "protocol_day_progress_v2_prescriptionId_idx" 
          ON "protocol_day_progress_v2"("prescriptionId");
        CREATE INDEX IF NOT EXISTS "protocol_day_progress_v2_status_idx" 
          ON "protocol_day_progress_v2"("status");
        CREATE INDEX IF NOT EXISTS "protocol_day_progress_v2_scheduledDate_idx" 
          ON "protocol_day_progress_v2"("scheduledDate");
      END $$;
    `;

    // Adicionar foreign keys
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "protocol_prescriptions" 
          ADD CONSTRAINT "protocol_prescriptions_protocolId_fkey" 
          FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "protocol_prescriptions" 
          ADD CONSTRAINT "protocol_prescriptions_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "protocol_prescriptions" 
          ADD CONSTRAINT "protocol_prescriptions_prescribedBy_fkey" 
          FOREIGN KEY ("prescribedBy") REFERENCES "User"("id") ON DELETE RESTRICT;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "protocol_day_progress_v2" 
          ADD CONSTRAINT "protocol_day_progress_v2_prescriptionId_fkey" 
          FOREIGN KEY ("prescriptionId") REFERENCES "protocol_prescriptions"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "protocol_day_progress_v2" 
          ADD CONSTRAINT "protocol_day_progress_v2_protocolTaskId_fkey" 
          FOREIGN KEY ("protocolTaskId") REFERENCES "ProtocolTask"("id") ON DELETE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('Tabelas e constraints criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
}

async function migrateData() {
  try {
    console.log('Iniciando migração dos dados...');

    // Migrar prescrições
    await prisma.$executeRaw`
      INSERT INTO "protocol_prescriptions" (
        "id", "protocolId", "userId", "prescribedBy", "status",
        "currentDay", "plannedStartDate", "actualStartDate", "plannedEndDate", "actualEndDate",
        "consultationDate", "onboardingLink", "preConsultationTemplateId", "preConsultationStatus"
      )
      SELECT 
        'migrated_' || up.id,
        up."protocolId",
        up."userId",
        p."doctorId",
        CASE 
          WHEN up.status = 'ACTIVE' THEN 'ACTIVE'::"PrescriptionStatus"
          WHEN up.status = 'COMPLETED' THEN 'COMPLETED'::"PrescriptionStatus"
          WHEN up.status = 'INACTIVE' THEN 'ABANDONED'::"PrescriptionStatus"
          ELSE 'PRESCRIBED'::"PrescriptionStatus"
        END,
        up."currentDay",
        up."startDate",
        up."startDate",
        COALESCE(up."endDate", up."startDate" + INTERVAL '30 days'),
        up."endDate",
        up."consultationDate",
        up."onboardingLink",
        up."preConsultationTemplateId",
        up."preConsultationStatus"
      FROM "UserProtocol" up
      JOIN "protocols" p ON p.id = up."protocolId"
      WHERE up."isActive" = true;
    `;

    // Migrar progresso diário
    await prisma.$executeRaw`
      INSERT INTO "protocol_day_progress_v2" (
        "id", "prescriptionId", "dayNumber", "scheduledDate",
        "completedAt", "status", "notes", "protocolTaskId"
      )
      SELECT 
        'migrated_' || pdp.id,
        'migrated_' || up.id,
        pdp."dayNumber",
        COALESCE(
          pdp.date,
          up."startDate" + ((pdp."dayNumber" - 1) || ' days')::INTERVAL
        ),
        pdp."completedAt",
        CASE 
          WHEN pdp.completed THEN 'COMPLETED'::"DayStatus"
          ELSE 'PENDING'::"DayStatus"
        END,
        pdp.notes,
        pdp."protocolTaskId"
      FROM "ProtocolDayProgress" pdp
      JOIN "UserProtocol" up ON up."userId" = pdp."userId" AND up."protocolId" = pdp."protocolId"
      WHERE up."isActive" = true;
    `;

    console.log('Migração de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração de dados:', error);
    throw error;
  }
}

async function runMigration() {
  try {
    console.log('Iniciando processo de migração...');
    
    // 1. Criar tabelas e constraints
    await createTables();
    
    // 2. Migrar dados
    await migrateData();
    
    console.log('Processo de migração concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a migração
runMigration(); 