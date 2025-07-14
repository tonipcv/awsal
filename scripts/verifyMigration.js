const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    console.log('Verificando resultados da migração...\n');

    // 1. Contagem de protocolos
    const oldProtocolsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "UserProtocol" WHERE "isActive" = true;
    `;
    
    const newProtocolsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "protocol_prescriptions";
    `;

    console.log('Contagem de protocolos:');
    console.log('- Modelo antigo:', oldProtocolsCount[0].count);
    console.log('- Modelo novo:', newProtocolsCount[0].count);
    console.log();

    // 2. Contagem de progresso diário
    const oldProgressCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "ProtocolDayProgress" pdp
      JOIN "UserProtocol" up ON up."userId" = pdp."userId" AND up."protocolId" = pdp."protocolId"
      WHERE up."isActive" = true;
    `;
    
    const newProgressCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "protocol_day_progress_v2";
    `;

    console.log('Contagem de registros de progresso:');
    console.log('- Modelo antigo:', oldProgressCount[0].count);
    console.log('- Modelo novo:', newProgressCount[0].count);
    console.log();

    // 3. Amostra de dados migrados
    console.log('Amostra de dados migrados:');
    const sampleData = await prisma.$queryRaw`
      SELECT 
        pp.id,
        pp."protocolId",
        p.name as protocol_name,
        u.name as patient_name,
        d.name as doctor_name,
        pp.status,
        pp."currentDay",
        pp."plannedStartDate",
        pp."plannedEndDate",
        COUNT(pdp.id) as progress_count
      FROM "protocol_prescriptions" pp
      JOIN "protocols" p ON p.id = pp."protocolId"
      JOIN "User" u ON u.id = pp."userId"
      JOIN "User" d ON d.id = pp."prescribedBy"
      LEFT JOIN "protocol_day_progress_v2" pdp ON pdp."prescriptionId" = pp.id
      GROUP BY pp.id, pp."protocolId", p.name, u.name, d.name, pp.status, pp."currentDay", pp."plannedStartDate", pp."plannedEndDate"
      LIMIT 5;
    `;

    console.table(sampleData);

  } catch (error) {
    console.error('Erro durante a verificação:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a verificação
verifyMigration(); 