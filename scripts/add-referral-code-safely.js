const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function addReferralCodeSafely() {
  try {
    console.log('🔄 Iniciando migração segura do sistema de códigos de indicação...');
    
    // 1. Verificar se a coluna já existe
    console.log('📋 Verificando estrutura atual da tabela User...');
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(User)`;
    const hasReferralCode = tableInfo.some(column => column.name === 'referralCode');
    
    if (hasReferralCode) {
      console.log('✅ Campo referralCode já existe!');
    } else {
      console.log('➕ Adicionando campo referralCode à tabela User...');
      await prisma.$executeRaw`ALTER TABLE User ADD COLUMN referralCode TEXT`;
      console.log('✅ Campo referralCode adicionado com sucesso!');
    }
    
    // 2. Buscar usuários sem código de indicação
    console.log('🔍 Buscando usuários sem código de indicação...');
    const users = await prisma.$queryRaw`
      SELECT id, name, email, role 
      FROM User 
      WHERE referralCode IS NULL
    `;
    
    console.log(`📊 Encontrados ${users.length} usuários sem código de indicação`);
    
    // 3. Gerar códigos únicos para cada usuário
    for (const user of users) {
      let referralCode;
      let isUnique = false;
      let attempts = 0;
      
      // Gerar código único
      while (!isUnique && attempts < 10) {
        referralCode = generateReferralCode();
        
        const existing = await prisma.$queryRaw`
          SELECT id FROM User WHERE referralCode = ${referralCode}
        `;
        
        if (existing.length === 0) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (isUnique) {
        await prisma.$executeRaw`
          UPDATE User 
          SET referralCode = ${referralCode} 
          WHERE id = ${user.id}
        `;
        
        console.log(`✅ ${user.name || user.email} (${user.role}): ${referralCode}`);
      } else {
        console.log(`❌ Falha ao gerar código único para ${user.name || user.email}`);
      }
    }
    
    // 4. Criar índice único para referralCode
    console.log('🔧 Criando índice único para referralCode...');
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX User_referralCode_key ON User(referralCode)`;
      console.log('✅ Índice único criado com sucesso!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Índice único já existe!');
      } else {
        console.log('⚠️ Erro ao criar índice:', error.message);
      }
    }
    
    // 5. Verificar se precisamos atualizar a tabela ReferralLead
    console.log('🔍 Verificando estrutura da tabela ReferralLead...');
    try {
      const referralLeadInfo = await prisma.$queryRaw`PRAGMA table_info(referral_leads)`;
      const hasReferrerCode = referralLeadInfo.some(column => column.name === 'referrerCode');
      
      if (!hasReferrerCode) {
        console.log('➕ Adicionando campo referrerCode à tabela referral_leads...');
        await prisma.$executeRaw`ALTER TABLE referral_leads ADD COLUMN referrerCode TEXT`;
        
        // Migrar dados existentes (se houver)
        const existingLeads = await prisma.$queryRaw`
          SELECT id, referrerId FROM referral_leads WHERE referrerCode IS NULL
        `;
        
        for (const lead of existingLeads) {
          const referrer = await prisma.$queryRaw`
            SELECT referralCode FROM User WHERE id = ${lead.referrerId}
          `;
          
          if (referrer.length > 0 && referrer[0].referralCode) {
            await prisma.$executeRaw`
              UPDATE referral_leads 
              SET referrerCode = ${referrer[0].referralCode} 
              WHERE id = ${lead.id}
            `;
          }
        }
        
        console.log('✅ Campo referrerCode adicionado e dados migrados!');
      } else {
        console.log('✅ Campo referrerCode já existe!');
      }
    } catch (error) {
      console.log('ℹ️ Tabela referral_leads não existe ainda (será criada quando necessário)');
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - Códigos gerados para ${users.length} usuários`);
    console.log('   - Índice único criado');
    console.log('   - Sistema pronto para usar códigos de indicação!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addReferralCodeSafely(); 