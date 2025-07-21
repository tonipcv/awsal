const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addLastScheduleUpdate() {
  try {
    // Adicionar a coluna last_schedule_update
    await prisma.$executeRaw`ALTER TABLE protocols ADD COLUMN IF NOT EXISTS last_schedule_update TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;`;
    
    console.log('✅ Coluna last_schedule_update adicionada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLastScheduleUpdate(); 