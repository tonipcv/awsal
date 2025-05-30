const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProtocolProgressSchema() {
  try {
    console.log('🔧 Iniciando correção do schema de ProtocolDayProgress...');
    
    // 1. Verificar se as colunas já existem
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ProtocolDayProgress' 
      AND column_name IN ('protocolTaskId', 'date', 'isCompleted', 'notes');
    `;
    
    const existingColumns = result.map(row => row.column_name);
    console.log('📊 Colunas existentes:', existingColumns);
    
    // 2. Adicionar colunas que não existem
    const columnsToAdd = [
      { name: 'protocolTaskId', type: 'TEXT' },
      { name: 'date', type: 'TIMESTAMP(3)' },
      { name: 'isCompleted', type: 'BOOLEAN DEFAULT false' },
      { name: 'notes', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`📝 Adicionando coluna ${column.name}...`);
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "ProtocolDayProgress" 
          ADD COLUMN "${column.name}" ${column.type};
        `);
        console.log(`✅ Coluna ${column.name} adicionada`);
      } else {
        console.log(`✅ Coluna ${column.name} já existe`);
      }
    }
    
    // 3. Verificar se o índice único já existe
    const indexResult = await prisma.$queryRaw`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'ProtocolDayProgress' 
      AND indexname = 'ProtocolDayProgress_userId_protocolTaskId_date_key';
    `;
    
    if (indexResult.length === 0) {
      console.log('📈 Adicionando índice único para userId_protocolTaskId_date...');
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX "ProtocolDayProgress_userId_protocolTaskId_date_key" 
        ON "ProtocolDayProgress"("userId", "protocolTaskId", "date");
      `);
      console.log('✅ Índice único adicionado');
    } else {
      console.log('✅ Índice único já existe');
    }
    
    // 4. Adicionar foreign key para protocolTaskId se não existir
    const fkResult = await prisma.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'ProtocolDayProgress' 
      AND constraint_name = 'ProtocolDayProgress_protocolTaskId_fkey';
    `;
    
    if (fkResult.length === 0) {
      console.log('🔗 Adicionando foreign key para protocolTaskId...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "ProtocolDayProgress" 
        ADD CONSTRAINT "ProtocolDayProgress_protocolTaskId_fkey" 
        FOREIGN KEY ("protocolTaskId") REFERENCES "ProtocolTask"(id) ON DELETE CASCADE;
      `);
      console.log('✅ Foreign key adicionada');
    } else {
      console.log('✅ Foreign key já existe');
    }
    
    console.log('🎉 Correção do schema de ProtocolDayProgress concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema de ProtocolDayProgress:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixProtocolProgressSchema()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { fixProtocolProgressSchema }; 