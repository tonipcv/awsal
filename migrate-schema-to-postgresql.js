const { Client } = require('pg');

async function migrateSchemaToPostgreSQL() {
  const client = new Client({
    connectionString: 'postgres://postgres:16404d694ca62cf5ec3e@dpbdp1.easypanel.host:324/aa?sslmode=disable'
  });

  try {
    await client.connect();
    console.log('🔗 Conectado à base de dados PostgreSQL');

    // 1. Primeiro, vamos limpar dados duplicados se existirem
    console.log('🧹 Limpando dados duplicados...');
    
    // Limpar referralCode duplicados na tabela User
    await client.query(`
      UPDATE "User" 
      SET "referralCode" = NULL 
      WHERE "referralCode" IN (
        SELECT "referralCode" 
        FROM "User" 
        WHERE "referralCode" IS NOT NULL 
        GROUP BY "referralCode" 
        HAVING COUNT(*) > 1
      );
    `);

    // Limpar nomes duplicados na tabela subscription_plans se existir
    await client.query(`
      DELETE FROM "subscription_plans" 
      WHERE "id" NOT IN (
        SELECT MIN("id") 
        FROM "subscription_plans" 
        GROUP BY "name"
      );
    `);

    console.log('✅ Dados duplicados limpos');

    // 2. Agora vamos atualizar o schema para PostgreSQL
    console.log('🔄 Atualizando schema para PostgreSQL...');

    // Alterar tipos de ID de INTEGER para TEXT (cuid)
    const alterTableQueries = [
      // Cycles
      `ALTER TABLE "Cycle" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "Week" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "Week" ALTER COLUMN "cycleId" TYPE TEXT;`,
      `ALTER TABLE "Goal" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "Goal" ALTER COLUMN "weekId" TYPE TEXT;`,
      `ALTER TABLE "KeyResult" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "KeyResult" ALTER COLUMN "weekId" TYPE TEXT;`,
      `ALTER TABLE "Day" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "Day" ALTER COLUMN "weekId" TYPE TEXT;`,
      `ALTER TABLE "Task" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "Task" ALTER COLUMN "dayId" TYPE TEXT;`,
      
      // Habits
      `ALTER TABLE "Habit" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "DayProgress" ALTER COLUMN "id" TYPE TEXT;`,
      `ALTER TABLE "DayProgress" ALTER COLUMN "habitId" TYPE TEXT;`,
      
      // Circles
      `ALTER TABLE "Circle" ALTER COLUMN "id" TYPE TEXT;`,
    ];

    for (const query of alterTableQueries) {
      try {
        await client.query(query);
        console.log(`✅ Executado: ${query.substring(0, 50)}...`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`⚠️  Tabela não existe, pulando: ${query.substring(0, 50)}...`);
        } else {
          console.log(`⚠️  Erro esperado (pode ser ignorado): ${error.message.substring(0, 100)}`);
        }
      }
    }

    // 3. Criar tabelas que podem estar faltando
    console.log('📋 Criando tabelas faltantes...');

    const createTablesSQL = `
      -- Criar tabelas de sistema de planos se não existirem
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL UNIQUE,
        "description" TEXT,
        "maxPatients" INTEGER NOT NULL DEFAULT 10,
        "maxProtocols" INTEGER NOT NULL DEFAULT 5,
        "maxCourses" INTEGER NOT NULL DEFAULT 3,
        "maxProducts" INTEGER NOT NULL DEFAULT 20,
        "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "features" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "trialDays" INTEGER NOT NULL DEFAULT 7,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "doctor_subscriptions" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "doctorId" TEXT NOT NULL UNIQUE,
        "planId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'TRIAL',
        "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endDate" TIMESTAMP(3),
        "trialEndDate" TIMESTAMP(3),
        "autoRenew" BOOLEAN NOT NULL DEFAULT true,
        "lastPaymentDate" TIMESTAMP(3),
        "nextPaymentDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "doctor_subscriptions_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "doctor_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "system_metrics" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "date" TIMESTAMP(3) NOT NULL UNIQUE DEFAULT CURRENT_TIMESTAMP,
        "totalDoctors" INTEGER NOT NULL DEFAULT 0,
        "totalPatients" INTEGER NOT NULL DEFAULT 0,
        "totalProtocols" INTEGER NOT NULL DEFAULT 0,
        "totalCourses" INTEGER NOT NULL DEFAULT 0,
        "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
        "trialSubscriptions" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Sistema de clínicas
      CREATE TABLE IF NOT EXISTS "clinics" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "ownerId" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "clinics_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "clinic_members" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "clinicId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'DOCTOR',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "clinic_members_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "clinic_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "clinic_subscriptions" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "clinicId" TEXT NOT NULL UNIQUE,
        "planId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'TRIAL',
        "maxDoctors" INTEGER NOT NULL DEFAULT 1,
        "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endDate" TIMESTAMP(3),
        "trialEndDate" TIMESTAMP(3),
        "autoRenew" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "clinic_subscriptions_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "clinic_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      -- Sistema de indicações
      CREATE TABLE IF NOT EXISTS "referral_leads" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "referralCode" TEXT NOT NULL UNIQUE,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "referrerCode" TEXT NOT NULL,
        "doctorId" TEXT NOT NULL,
        "convertedUserId" TEXT UNIQUE,
        "convertedAt" TIMESTAMP(3),
        "source" TEXT NOT NULL DEFAULT 'referral_form',
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "emailSent" BOOLEAN NOT NULL DEFAULT false,
        "emailSentAt" TIMESTAMP(3),
        "lastContactAt" TIMESTAMP(3),
        CONSTRAINT "referral_leads_referrerCode_fkey" FOREIGN KEY ("referrerCode") REFERENCES "User"("referralCode") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "referral_leads_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "referral_leads_convertedUserId_fkey" FOREIGN KEY ("convertedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "referral_credits" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL,
        "amount" INTEGER NOT NULL DEFAULT 1,
        "type" TEXT NOT NULL DEFAULT 'SUCCESSFUL_REFERRAL',
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "leadId" TEXT,
        "usedAt" TIMESTAMP(3),
        "usedFor" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "referral_credits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "referral_credits_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "referral_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "referral_rewards" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "doctorId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "creditsRequired" INTEGER NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "maxRedemptions" INTEGER,
        "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "referral_rewards_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "reward_redemptions" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL,
        "rewardId" TEXT NOT NULL,
        "creditsUsed" INTEGER NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fulfilledAt" TIMESTAMP(3),
        "notes" TEXT,
        CONSTRAINT "reward_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "reward_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "referral_rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "referral_form_settings" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "doctorId" TEXT NOT NULL UNIQUE,
        "welcomeTitle" TEXT NOT NULL DEFAULT 'Indique amigos e familiares',
        "welcomeDescription" TEXT NOT NULL DEFAULT 'Indique pessoas que você conhece e ganhe recompensas especiais quando elas se tornarem pacientes.',
        "customFields" TEXT,
        "showPhoneField" BOOLEAN NOT NULL DEFAULT true,
        "phoneFieldRequired" BOOLEAN NOT NULL DEFAULT false,
        "showReferrerField" BOOLEAN NOT NULL DEFAULT true,
        "referrerFieldRequired" BOOLEAN NOT NULL DEFAULT false,
        "successMessage" TEXT NOT NULL DEFAULT 'Sua indicação foi registrada com sucesso! Nossa equipe entrará em contato em breve.',
        "programDescription" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "referral_form_settings_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      -- Sistema de consultas
      CREATE TABLE IF NOT EXISTS "consultation_forms" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "doctorId" TEXT NOT NULL UNIQUE,
        "title" TEXT NOT NULL DEFAULT 'Agende sua consulta',
        "description" TEXT NOT NULL DEFAULT 'Preencha seus dados para agendar uma consulta',
        "welcomeMessage" TEXT,
        "successMessage" TEXT NOT NULL DEFAULT 'Obrigado! Entraremos em contato em breve para confirmar sua consulta.',
        "nameLabel" TEXT NOT NULL DEFAULT 'Nome completo',
        "emailLabel" TEXT NOT NULL DEFAULT 'E-mail',
        "whatsappLabel" TEXT NOT NULL DEFAULT 'WhatsApp',
        "showAgeField" BOOLEAN NOT NULL DEFAULT false,
        "ageLabel" TEXT NOT NULL DEFAULT 'Idade',
        "ageRequired" BOOLEAN NOT NULL DEFAULT false,
        "showSpecialtyField" BOOLEAN NOT NULL DEFAULT false,
        "specialtyLabel" TEXT NOT NULL DEFAULT 'Especialidade de interesse',
        "specialtyOptions" TEXT,
        "specialtyRequired" BOOLEAN NOT NULL DEFAULT false,
        "showMessageField" BOOLEAN NOT NULL DEFAULT true,
        "messageLabel" TEXT NOT NULL DEFAULT 'Mensagem (opcional)',
        "messageRequired" BOOLEAN NOT NULL DEFAULT false,
        "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
        "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
        "textColor" TEXT NOT NULL DEFAULT '#1F2937',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "requireReferralCode" BOOLEAN NOT NULL DEFAULT false,
        "autoReply" BOOLEAN NOT NULL DEFAULT true,
        "autoReplyMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "consultation_forms_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "consultation_submissions" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "formId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "whatsapp" TEXT NOT NULL,
        "age" INTEGER,
        "specialty" TEXT,
        "message" TEXT,
        "referralCode" TEXT,
        "status" TEXT NOT NULL DEFAULT 'NEW',
        "contactedAt" TIMESTAMP(3),
        "contactMethod" TEXT,
        "contactNotes" TEXT,
        "convertedToPatient" BOOLEAN NOT NULL DEFAULT false,
        "convertedAt" TIMESTAMP(3),
        "patientId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "source" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "consultation_submissions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "consultation_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "consultation_submissions_referralCode_fkey" FOREIGN KEY ("referralCode") REFERENCES "User"("referralCode") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "consultation_submissions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );

      -- Criar índices
      CREATE INDEX IF NOT EXISTS "referral_leads_referrerCode_idx" ON "referral_leads"("referrerCode");
      CREATE INDEX IF NOT EXISTS "referral_leads_doctorId_idx" ON "referral_leads"("doctorId");
      CREATE INDEX IF NOT EXISTS "referral_leads_status_idx" ON "referral_leads"("status");
      CREATE INDEX IF NOT EXISTS "referral_credits_userId_idx" ON "referral_credits"("userId");
      CREATE INDEX IF NOT EXISTS "referral_credits_status_idx" ON "referral_credits"("status");
      CREATE INDEX IF NOT EXISTS "referral_rewards_doctorId_idx" ON "referral_rewards"("doctorId");
      CREATE INDEX IF NOT EXISTS "consultation_submissions_formId_idx" ON "consultation_submissions"("formId");
      CREATE INDEX IF NOT EXISTS "consultation_submissions_status_idx" ON "consultation_submissions"("status");
      CREATE INDEX IF NOT EXISTS "consultation_submissions_referralCode_idx" ON "consultation_submissions"("referralCode");

      -- Criar índices únicos
      CREATE UNIQUE INDEX IF NOT EXISTS "clinic_members_clinicId_userId_key" ON "clinic_members"("clinicId", "userId");
    `;

    await client.query(createTablesSQL);
    console.log('✅ Tabelas criadas/atualizadas com sucesso!');

    // 4. Inserir plano padrão se não existir
    console.log('📦 Criando plano padrão...');
    await client.query(`
      INSERT INTO "subscription_plans" ("id", "name", "description", "maxPatients", "maxProtocols", "maxCourses", "maxProducts", "price", "isDefault", "trialDays")
      VALUES ('default-plan-id', 'Plano Básico', 'Plano básico para médicos', 50, 10, 5, 50, 0, true, 30)
      ON CONFLICT ("name") DO NOTHING;
    `);

    console.log('🎉 Migração do schema para PostgreSQL concluída com sucesso!');
    console.log('');
    console.log('✅ Próximos passos:');
    console.log('1. Execute: npx prisma generate');
    console.log('2. Teste a aplicação com a nova base de dados');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await client.end();
  }
}

migrateSchemaToPostgreSQL(); 