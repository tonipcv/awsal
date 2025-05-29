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

async function generateCodesForExistingUsers() {
  try {
    console.log('🔄 Gerando códigos de indicação para usuários existentes...');
    
    // Buscar todos os usuários sem código de indicação
    const users = await prisma.user.findMany({
      where: {
        referralCode: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log(`📊 Encontrados ${users.length} usuários sem código de indicação`);

    for (const user of users) {
      let referralCode;
      let isUnique = false;
      let attempts = 0;
      
      // Gerar código único
      while (!isUnique && attempts < 10) {
        referralCode = generateReferralCode();
        
        const existing = await prisma.user.findUnique({
          where: { referralCode }
        });
        
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (isUnique) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode }
        });
        
        console.log(`✅ ${user.name || user.email} (${user.role}): ${referralCode}`);
      } else {
        console.log(`❌ Falha ao gerar código único para ${user.name || user.email}`);
      }
    }
    
    console.log('🎉 Códigos de indicação gerados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao gerar códigos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateCodesForExistingUsers(); 