const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixReferralLeadSchema() {
  try {
    console.log('🔧 Iniciando correção do schema de ReferralLead...');
    
    // 1. Verificar se a coluna referralCode já existe
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'referral_leads' AND column_name = 'referralCode';
    `;
    
    if (result.length > 0) {
      console.log('✅ Campo referralCode já existe na tabela referral_leads');
      return;
    }
    
    console.log('📝 Adicionando campo referralCode à tabela referral_leads...');
    
    // 2. Adicionar a coluna referralCode
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "referral_leads" 
      ADD COLUMN "referralCode" TEXT;
    `);
    
    console.log('✅ Campo referralCode adicionado com sucesso');
    
    // 3. Gerar códigos únicos para registros existentes
    const existingLeads = await prisma.referralLead.findMany({
      where: { referralCode: null }
    });
    
    console.log(`📊 Encontrados ${existingLeads.length} leads sem referralCode`);
    
    if (existingLeads.length > 0) {
      const { createId } = require('@paralleldrive/cuid2');
      
      for (const lead of existingLeads) {
        const referralCode = createId().substring(0, 8).toUpperCase();
        await prisma.referralLead.update({
          where: { id: lead.id },
          data: { referralCode }
        });
      }
      
      console.log('✅ Códigos de referência gerados para leads existentes');
    }
    
    // 4. Adicionar índice único para referralCode
    console.log('📈 Adicionando índice único para referralCode...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "referral_leads_referralCode_key" 
      ON "referral_leads"("referralCode");
    `);
    
    console.log('✅ Índice único adicionado com sucesso');
    
    console.log('🎉 Correção do schema de ReferralLead concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema de ReferralLead:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixReferralLeadSchema()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { fixReferralLeadSchema }; 