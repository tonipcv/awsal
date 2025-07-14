const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');

    // Verificar se a tabela protocol_courses existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'protocol_courses'
      );
    `;

    console.log('📊 Tabela protocol_courses existe?', tableExists[0].exists);

    if (!tableExists[0].exists) {
      console.log('❌ Tabela protocol_courses não existe!');
      console.log('\n🔧 SQL para criar a tabela:');
      console.log(`
CREATE TABLE "protocol_courses" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "protocol_courses_protocolId_courseId_key" UNIQUE ("protocolId", "courseId")
);

-- Adicionar índices
CREATE INDEX "protocol_courses_protocolId_idx" ON "protocol_courses"("protocolId");
CREATE INDEX "protocol_courses_courseId_idx" ON "protocol_courses"("courseId");

-- Adicionar foreign keys
ALTER TABLE "protocol_courses" ADD CONSTRAINT "protocol_courses_protocolId_fkey"
    FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "protocol_courses" ADD CONSTRAINT "protocol_courses_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } else {
      // Verificar estrutura da tabela
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'protocol_courses';
      `;

      console.log('\n📋 Estrutura atual da tabela:');
      console.table(columns);

      // Verificar foreign keys
      const foreignKeys = await prisma.$queryRaw`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'protocol_courses';
      `;

      console.log('\n🔗 Foreign Keys:');
      console.table(foreignKeys);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure(); 