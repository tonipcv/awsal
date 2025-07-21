const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addReferredPatientFields() {
  try {
    // Adicionar as colunas do paciente indicado
    await prisma.$executeRaw`
      ALTER TABLE referrals 
      ADD COLUMN IF NOT EXISTS referred_patient_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS referred_patient_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS referred_patient_phone VARCHAR(255)
    `;
    
    console.log('✅ Colunas do paciente indicado adicionadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar colunas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addReferredPatientFields(); 