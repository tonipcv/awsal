const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createHabitsTables() {
  try {
    console.log('🚀 Iniciando migração das tabelas de hábitos...');

    // Criar tabela habits
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "habits" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'personal',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Tabela habits criada com sucesso');

    // Criar tabela habit_progress
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "habit_progress" (
        "id" TEXT NOT NULL,
        "habitId" TEXT NOT NULL,
        "date" DATE NOT NULL,
        "isChecked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "habit_progress_pkey" PRIMARY KEY ("id")
      );
    `;
    console.log('✅ Tabela habit_progress criada com sucesso');

    // Criar constraint única para habit_progress
    await prisma.$executeRaw`
      ALTER TABLE "habit_progress" 
      ADD CONSTRAINT "habit_progress_habitId_date_key" 
      UNIQUE ("habitId", "date");
    `;
    console.log('✅ Constraint única habit_progress_habitId_date_key criada');

    // Adicionar foreign key para habits.userId -> User.id
    await prisma.$executeRaw`
      ALTER TABLE "habits" 
      ADD CONSTRAINT "habits_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    console.log('✅ Foreign key habits.userId criada');

    // Adicionar foreign key para habit_progress.habitId -> habits.id
    await prisma.$executeRaw`
      ALTER TABLE "habit_progress" 
      ADD CONSTRAINT "habit_progress_habitId_fkey" 
      FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;
    console.log('✅ Foreign key habit_progress.habitId criada');

    // Criar índices para performance
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "habits_userId_idx" ON "habits"("userId");`;
    console.log('✅ Índice habits_userId criado');

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "habits_category_idx" ON "habits"("category");`;
    console.log('✅ Índice habits_category criado');

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "habits_isActive_idx" ON "habits"("isActive");`;
    console.log('✅ Índice habits_isActive criado');

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "habit_progress_habitId_idx" ON "habit_progress"("habitId");`;
    console.log('✅ Índice habit_progress_habitId criado');

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "habit_progress_date_idx" ON "habit_progress"("date");`;
    console.log('✅ Índice habit_progress_date criado');

    console.log('🎉 Migração das tabelas de hábitos concluída com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const habitsTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'habits'
      );
    `;
    
    const progressTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'habit_progress'
      );
    `;

    console.log('📊 Verificação das tabelas:');
    console.log(`   - Tabela habits: ${habitsTable[0].exists ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`   - Tabela habit_progress: ${progressTable[0].exists ? '✅ Existe' : '❌ Não existe'}`);

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a migração
createHabitsTables()
  .then(() => {
    console.log('✅ Script de migração executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }); 