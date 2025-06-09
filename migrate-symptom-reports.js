const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateSymptomReports() {
  try {
    console.log('🚀 Iniciando migração do sistema de relatório de sintomas...');

    // Verificar se as tabelas já existem
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('SymptomReport', 'SymptomReportAttachment');
    `;

    if (existingTables.length > 0) {
      console.log('⚠️  Tabelas já existem. Pulando migração...');
      return;
    }

    // Criar enum SymptomReportStatus
    await prisma.$executeRaw`
      CREATE TYPE "SymptomReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'REQUIRES_ATTENTION', 'RESOLVED');
    `;
    console.log('✅ Enum SymptomReportStatus criado');

    // Criar tabela SymptomReport
    await prisma.$executeRaw`
      CREATE TABLE "SymptomReport" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "protocolId" TEXT NOT NULL,
        "dayNumber" INTEGER NOT NULL,
        "title" TEXT NOT NULL DEFAULT 'Relatório de Sintomas',
        "description" TEXT,
        "symptoms" TEXT NOT NULL,
        "severity" INTEGER DEFAULT 1,
        "reportTime" TIMESTAMP(3) NOT NULL,
        "isNow" BOOLEAN NOT NULL DEFAULT true,
        "status" "SymptomReportStatus" NOT NULL DEFAULT 'PENDING',
        "doctorNotes" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "reviewedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "SymptomReport_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Tabela SymptomReport criada');

    // Criar tabela SymptomReportAttachment
    await prisma.$executeRaw`
      CREATE TABLE "SymptomReportAttachment" (
        "id" TEXT NOT NULL,
        "symptomReportId" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "originalName" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "mimeType" TEXT NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "SymptomReportAttachment_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Tabela SymptomReportAttachment criada');

    // Criar índices para SymptomReport
    await prisma.$executeRaw`
      CREATE INDEX "SymptomReport_userId_protocolId_idx" ON "SymptomReport"("userId", "protocolId");
    `;
    await prisma.$executeRaw`
      CREATE INDEX "SymptomReport_status_idx" ON "SymptomReport"("status");
    `;
    await prisma.$executeRaw`
      CREATE INDEX "SymptomReport_reportTime_idx" ON "SymptomReport"("reportTime");
    `;
    await prisma.$executeRaw`
      CREATE INDEX "SymptomReport_dayNumber_idx" ON "SymptomReport"("dayNumber");
    `;
    console.log('✅ Índices da SymptomReport criados');

    // Criar índice para SymptomReportAttachment
    await prisma.$executeRaw`
      CREATE INDEX "SymptomReportAttachment_symptomReportId_idx" ON "SymptomReportAttachment"("symptomReportId");
    `;
    console.log('✅ Índices da SymptomReportAttachment criados');

    // Criar foreign keys
    await prisma.$executeRaw`
      ALTER TABLE "SymptomReport" ADD CONSTRAINT "SymptomReport_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "SymptomReport" ADD CONSTRAINT "SymptomReport_protocolId_fkey" 
      FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "SymptomReport" ADD CONSTRAINT "SymptomReport_reviewedBy_fkey" 
      FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "SymptomReportAttachment" ADD CONSTRAINT "SymptomReportAttachment_symptomReportId_fkey" 
      FOREIGN KEY ("symptomReportId") REFERENCES "SymptomReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    console.log('✅ Foreign keys criadas');

    console.log('🎉 Migração concluída com sucesso!');
    console.log('📋 Tabelas criadas:');
    console.log('   - SymptomReport');
    console.log('   - SymptomReportAttachment');
    console.log('   - Enum SymptomReportStatus');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateSymptomReports()
  .then(() => {
    console.log('✅ Migração finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  }); 