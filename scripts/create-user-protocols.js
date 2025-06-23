const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createUserProtocolsTable() {
  try {
    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_protocols'
      );
    `;
    
    const { rows: [{ exists }] } = await pool.query(checkTableQuery);
    
    if (exists) {
      console.log('Tabela user_protocols já existe');
      return;
    }

    // Criar a tabela user_protocols
    await pool.query(`
      CREATE TABLE "user_protocols" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "protocolId" TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "endDate" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "currentDay" INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        "consultationDate" TIMESTAMPTZ(6),
        "preConsultationTemplateId" TEXT,
        "preConsultationStatus" TEXT,

        CONSTRAINT "user_protocols_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "user_protocols_userId_protocolId_key" UNIQUE ("userId", "protocolId"),
        CONSTRAINT "user_protocols_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "user_protocols_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log('Tabela user_protocols criada com sucesso');

  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    await pool.end();
  }
}

createUserProtocolsTable().catch(console.error); 