const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateSubscriptionsOld() {
  console.log('Migrando subscriptions_old...');
  const oldSubs = await prisma.subscriptions_old.findMany({
    include: {
      User: true,
      subscription_plans: true
    }
  });

  console.log(`Encontradas ${oldSubs.length} assinaturas antigas`);

  for (const sub of oldSubs) {
    // Verificar se já existe uma assinatura unificada
    const existingUnified = await prisma.unified_subscriptions.findFirst({
      where: {
        subscriber_id: sub.userId,
        type: 'DOCTOR'
      }
    });

    if (existingUnified) {
      console.log(`Assinatura já migrada para ${sub.userId}`);
      continue;
    }

    // Criar nova assinatura unificada
    await prisma.unified_subscriptions.create({
      data: {
        id: `migrated_${sub.id}`,
        type: 'DOCTOR',
        subscriber_id: sub.userId,
        plan_id: sub.planId,
        status: sub.status,
        start_date: sub.startDate,
        end_date: sub.endDate,
        trial_end_date: sub.trialEndDate,
        auto_renew: sub.autoRenew,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt
      }
    });

    console.log(`Migrada assinatura de ${sub.userId}`);
  }
}

async function migrateDoctorSubscriptionsOld() {
  console.log('Migrando doctor_subscriptions_old...');
  const oldSubs = await prisma.doctor_subscriptions_old.findMany({
    include: {
      User: true,
      subscription_plans: true
    }
  });

  console.log(`Encontradas ${oldSubs.length} assinaturas de médicos antigas`);

  for (const sub of oldSubs) {
    // Verificar se já existe uma assinatura unificada
    const existingUnified = await prisma.unified_subscriptions.findFirst({
      where: {
        subscriber_id: sub.doctorId,
        type: 'DOCTOR'
      }
    });

    if (existingUnified) {
      console.log(`Assinatura já migrada para ${sub.doctorId}`);
      continue;
    }

    // Criar nova assinatura unificada
    await prisma.unified_subscriptions.create({
      data: {
        id: `migrated_${sub.id}`,
        type: 'DOCTOR',
        subscriber_id: sub.doctorId,
        plan_id: sub.planId,
        status: sub.status,
        start_date: sub.startDate,
        end_date: sub.endDate,
        trial_end_date: sub.trialEndDate,
        auto_renew: sub.autoRenew,
        last_payment_date: sub.lastPaymentDate,
        next_payment_date: sub.nextPaymentDate,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt
      }
    });

    console.log(`Migrada assinatura de médico ${sub.doctorId}`);
  }
}

async function migrateClinicSubscriptionsOld() {
  console.log('Migrando clinic_subscriptions_old...');
  const oldSubs = await prisma.clinic_subscriptions_old.findMany({
    include: {
      clinics: true,
      subscription_plans: true
    }
  });

  console.log(`Encontradas ${oldSubs.length} assinaturas de clínicas antigas`);

  for (const sub of oldSubs) {
    // Verificar se já existe uma assinatura unificada
    const existingUnified = await prisma.unified_subscriptions.findFirst({
      where: {
        subscriber_id: sub.clinicId,
        type: 'CLINIC'
      }
    });

    if (existingUnified) {
      console.log(`Assinatura já migrada para clínica ${sub.clinicId}`);
      continue;
    }

    // Criar nova assinatura unificada
    await prisma.unified_subscriptions.create({
      data: {
        id: `migrated_${sub.id}`,
        type: 'CLINIC',
        subscriber_id: sub.clinicId,
        plan_id: sub.planId,
        status: sub.status,
        start_date: sub.startDate,
        end_date: sub.endDate,
        trial_end_date: sub.trialEndDate,
        auto_renew: sub.autoRenew,
        max_doctors: sub.maxDoctors,
        created_at: sub.createdAt,
        updated_at: sub.updatedAt
      }
    });

    console.log(`Migrada assinatura de clínica ${sub.clinicId}`);
  }
}

async function removeOldSubscriptionModels() {
  console.log('Removendo modelos antigos...');

  // Remover todas as assinaturas antigas
  await prisma.subscriptions_old.deleteMany({});
  await prisma.doctor_subscriptions_old.deleteMany({});
  await prisma.clinic_subscriptions_old.deleteMany({});

  // Remover as tabelas
  await prisma.$executeRaw`DROP TABLE IF EXISTS "subscriptions_old" CASCADE`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "doctor_subscriptions_old" CASCADE`;
  await prisma.$executeRaw`DROP TABLE IF EXISTS "clinic_subscriptions_old" CASCADE`;

  console.log('Modelos antigos removidos com sucesso');
}

async function main() {
  try {
    console.log('Iniciando migração das assinaturas...');

    // 1. Migrar dados antigos
    await migrateSubscriptionsOld();
    await migrateDoctorSubscriptionsOld();
    await migrateClinicSubscriptionsOld();

    // 2. Remover modelos antigos
    await removeOldSubscriptionModels();

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Remova os seguintes modelos do seu schema.prisma:');
    console.log('   - subscriptions_old');
    console.log('   - doctor_subscriptions_old');
    console.log('   - clinic_subscriptions_old');
    console.log('2. Remova as referências desses modelos do modelo User e Clinic');
    console.log('3. Execute npx prisma generate para atualizar o cliente');

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