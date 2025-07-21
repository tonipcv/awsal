const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando atualização do schema...');

    // 1. Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'protocol_day_progress_v2'
      );
    `;

    if (tableExists[0].exists) {
      console.log('Tabela protocol_day_progress_v2 encontrada, renomeando...');
      await prisma.$executeRaw`ALTER TABLE "protocol_day_progress_v2" RENAME TO "protocol_task_progress"`;
      console.log('Tabela renomeada com sucesso');
    } else {
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
    }

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Atualize o schema.prisma removendo os modelos antigos');
    console.log('2. Execute npx prisma generate para atualizar o cliente');
    console.log('3. Atualize o código da aplicação para usar os novos modelos');
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