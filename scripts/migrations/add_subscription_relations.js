const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando adição de relações nas assinaturas unificadas...');

    // 1. Verificar dados existentes
    const subscriptions = await prisma.unified_subscriptions.findMany();
    console.log(`Encontradas ${subscriptions.length} assinaturas para validar`);

    // 2. Validar referências para User
    const doctorSubs = subscriptions.filter(sub => sub.type === 'DOCTOR');
    console.log(`Validando ${doctorSubs.length} assinaturas de médicos...`);
    
    for (const sub of doctorSubs) {
      const user = await prisma.user.findUnique({ where: { id: sub.subscriber_id } });
      if (!user) {
        console.log(`ERRO: Assinatura ${sub.id} referencia usuário inexistente ${sub.subscriber_id}`);
        return;
      }
    }

    // 3. Validar referências para Clinic
    const clinicSubs = subscriptions.filter(sub => sub.type === 'CLINIC');
    console.log(`Validando ${clinicSubs.length} assinaturas de clínicas...`);
    
    for (const sub of clinicSubs) {
      const clinic = await prisma.clinic.findUnique({ where: { id: sub.subscriber_id } });
      if (!clinic) {
        console.log(`ERRO: Assinatura ${sub.id} referencia clínica inexistente ${sub.subscriber_id}`);
        return;
      }
    }

    console.log('Todas as referências validadas com sucesso');

    // 4. Verificar se as constraints já existem
    const existingConstraints = await prisma.$queryRaw`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname IN ('fk_unified_subscriptions_user', 'fk_unified_subscriptions_clinic');
    `;

    const existingNames = existingConstraints.map(c => c.conname);

    // 5. Adicionar constraint para User se não existir
    if (!existingNames.includes('fk_unified_subscriptions_user')) {
      await prisma.$executeRaw`
        ALTER TABLE unified_subscriptions
        ADD CONSTRAINT fk_unified_subscriptions_user 
        FOREIGN KEY (subscriber_id) 
        REFERENCES "User"(id) 
        ON DELETE CASCADE
        WHERE type = 'DOCTOR';
      `;
      console.log('Adicionada constraint para User');
    } else {
      console.log('Constraint para User já existe');
    }

    // 6. Adicionar constraint para Clinic se não existir
    if (!existingNames.includes('fk_unified_subscriptions_clinic')) {
      await prisma.$executeRaw`
        ALTER TABLE unified_subscriptions
        ADD CONSTRAINT fk_unified_subscriptions_clinic 
        FOREIGN KEY (subscriber_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        WHERE type = 'CLINIC';
      `;
      console.log('Adicionada constraint para Clinic');
    } else {
      console.log('Constraint para Clinic já existe');
    }

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Atualize o schema.prisma para adicionar as relações:');
    console.log('   unified_subscriptions:');
    console.log('   - Adicione: user User? @relation("UserSubscriptions", fields: [subscriber_id], references: [id], onDelete: Cascade)');
    console.log('   - Adicione: clinic Clinic? @relation("ClinicSubscriptions", fields: [subscriber_id], references: [id], onDelete: Cascade)');
    console.log('   User:');
    console.log('   - Adicione: unified_subscriptions unified_subscriptions[] @relation("UserSubscriptions")');
    console.log('   Clinic:');
    console.log('   - Adicione: unified_subscriptions unified_subscriptions[] @relation("ClinicSubscriptions")');
    console.log('2. Execute npx prisma generate para atualizar o cliente');

  } catch (error) {
    console.error('Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
main()
  .catch(console.error); 