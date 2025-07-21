const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando remoção dos campos de recorrência...');

    // Remover colunas antigas de recorrência
    await prisma.$executeRaw`
      ALTER TABLE "protocols" 
      DROP COLUMN IF EXISTS "is_recurring",
      DROP COLUMN IF EXISTS "recurring_interval",
      DROP COLUMN IF EXISTS "recurring_days",
      DROP COLUMN IF EXISTS "available_from",
      DROP COLUMN IF EXISTS "available_until",
      DROP COLUMN IF EXISTS "isRecurring",
      DROP COLUMN IF EXISTS "recurringInterval",
      DROP COLUMN IF EXISTS "recurringDays",
      DROP COLUMN IF EXISTS "availableFrom",
      DROP COLUMN IF EXISTS "availableUntil";
    `;

    console.log('Campos de recorrência removidos com sucesso!');

    // Atualizar o schema.prisma
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Remova os seguintes campos do seu schema.prisma no modelo Protocol:');
    console.log('   - is_recurring');
    console.log('   - recurring_interval');
    console.log('   - recurring_days');
    console.log('   - available_from');
    console.log('   - available_until');
    console.log('   - isRecurring');
    console.log('   - recurringInterval');
    console.log('   - recurringDays');
    console.log('   - availableFrom');
    console.log('   - availableUntil');
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