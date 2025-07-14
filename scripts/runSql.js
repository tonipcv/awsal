const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runSql() {
  try {
    // Query para visualizar o modelo atual de protocolos
    const result = await prisma.$queryRaw`
      SELECT 
        p.id as protocol_id,
        p.name as protocol_name,
        u.name as patient_name,
        up.status,
        up."currentDay",
        up."startDate",
        up."endDate",
        COUNT(pdp.id) as progress_count
      FROM "protocols" p
      LEFT JOIN "UserProtocol" up ON p.id = up."protocolId"
      LEFT JOIN "User" u ON up."userId" = u.id
      LEFT JOIN "ProtocolDayProgress" pdp ON p.id = pdp."protocolId" AND up."userId" = pdp."userId"
      WHERE up."userId" IS NOT NULL
      GROUP BY p.id, p.name, u.name, up.status, up."currentDay", up."startDate", up."endDate"
      ORDER BY up."startDate" DESC
      LIMIT 5
    `;

    // Imprimindo os resultados
    console.log('Estrutura atual de protocolos (antes da migração):');
    console.table(result);

  } catch (error) {
    console.error('Erro ao executar SQL:', error);
  } finally {
    // Sempre feche a conexão quando terminar
    await prisma.$disconnect();
  }
}

// Executando a função
runSql(); 