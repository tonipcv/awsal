const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando renomeação da tabela e índices do ProtocolTaskProgress...');

    // 1. Verificar se a tabela antiga existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'protocol_day_progress_v2'
      );
    `;

    if (!tableExists[0].exists) {
      console.log('Tabela protocol_day_progress_v2 não encontrada, verificando se protocol_task_progress já existe...');
      
      const newTableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'protocol_task_progress'
        );
      `;

      if (newTableExists[0].exists) {
        console.log('Tabela protocol_task_progress já existe, pulando renomeação...');
      } else {
        console.log('ATENÇÃO: Nenhuma das tabelas foi encontrada!');
      }
      return;
    }

    // 2. Renomear a tabela
    await prisma.$executeRaw`
      ALTER TABLE protocol_day_progress_v2 
      RENAME TO protocol_task_progress;
    `;
    console.log('Tabela renomeada com sucesso');

    // 3. Renomear o índice único
    await prisma.$executeRaw`
      ALTER INDEX IF EXISTS protocol_day_progress_v2_prescriptionId_protocolTaskId_schedul_
      RENAME TO protocol_task_progress_unique;
    `;
    console.log('Índice único renomeado com sucesso');

    // 4. Renomear outros índices
    await prisma.$executeRaw`
      ALTER INDEX IF EXISTS "protocol_day_progress_v2_prescriptionId_idx"
      RENAME TO "protocol_task_progress_prescriptionId_idx";
    `;

    await prisma.$executeRaw`
      ALTER INDEX IF EXISTS "protocol_day_progress_v2_status_idx"
      RENAME TO "protocol_task_progress_status_idx";
    `;

    await prisma.$executeRaw`
      ALTER INDEX IF EXISTS "protocol_day_progress_v2_scheduledDate_idx"
      RENAME TO "protocol_task_progress_scheduledDate_idx";
    `;

    console.log('Índices secundários renomeados com sucesso');

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Atualize o schema.prisma com os novos nomes:');
    console.log('   - Mude @@map("protocol_day_progress_v2") para @@map("protocol_task_progress")');
    console.log('   - Atualize o nome do índice único');
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