const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando remoção de índices redundantes...');

    // 1. Remover índices redundantes de DoctorDefaultProtocol
    console.log('Removendo índices redundantes de DoctorDefaultProtocol...');
    
    await prisma.$executeRaw`DROP INDEX IF EXISTS "idx_doctor_default_protocols_doctor_id"`;
    await prisma.$executeRaw`DROP INDEX IF EXISTS "idx_doctor_default_protocols_protocol_id"`;

    // 2. Remover índices redundantes de DoctorFAQ
    console.log('Removendo índices redundantes de DoctorFAQ...');
    
    // Primeiro, verificar se o índice composto existe
    const compositeIndexExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'doctor_faqs'
        AND indexname = 'DoctorFAQ_doctorId_isActive_idx'
      );
    `;

    if (compositeIndexExists[0].exists) {
      // Se o índice composto existe, podemos remover os índices simples
      await prisma.$executeRaw`DROP INDEX IF EXISTS "DoctorFAQ_doctorId_idx"`;
      await prisma.$executeRaw`DROP INDEX IF EXISTS "DoctorFAQ_isActive_idx"`;
    } else {
      console.log('AVISO: Índice composto não encontrado em DoctorFAQ, mantendo índices simples');
    }

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Atualize o schema.prisma removendo os índices redundantes:');
    console.log('   DoctorDefaultProtocol:');
    console.log('   - Remova: @@index([doctorId], map: "idx_doctor_default_protocols_doctor_id")');
    console.log('   - Remova: @@index([protocolId], map: "idx_doctor_default_protocols_protocol_id")');
    console.log('   DoctorFAQ:');
    console.log('   - Remova: @@index([doctorId])');
    console.log('   - Remova: @@index([isActive])');
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