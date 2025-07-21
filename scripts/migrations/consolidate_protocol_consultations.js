const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando consolidação das consultas de protocolo...');

    // 1. Buscar todas as consultas
    const consultations = await prisma.protocol_consultations.findMany();
    console.log(`Encontradas ${consultations.length} consultas para migrar`);

    // 2. Migrar dados para ProtocolPrescription
    for (const consultation of consultations) {
      if (!consultation.prescription_id) {
        console.log(`Consulta ${consultation.id} não tem prescription_id, pulando...`);
        continue;
      }

      // Atualizar a prescrição com os dados da consulta
      await prisma.protocolPrescription.update({
        where: { id: consultation.prescription_id },
        data: {
          consultationDate: consultation.consultation_date,
          preConsultationTemplateId: consultation.pre_consultation_template_id,
          preConsultationStatus: consultation.pre_consultation_status,
          onboardingLink: consultation.onboarding_link
        }
      });

      console.log(`Migrados dados da consulta ${consultation.id} para prescrição ${consultation.prescription_id}`);
    }

    // 3. Remover a tabela antiga
    await prisma.$executeRaw`DROP TABLE IF EXISTS "protocol_consultations" CASCADE`;

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Remova o modelo protocol_consultations do schema.prisma');
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