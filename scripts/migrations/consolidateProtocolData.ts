import { prisma } from '../../lib/prisma';
import { PrescriptionStatus, DayStatus } from '@prisma/client';

async function createConsultationTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS protocol_consultations (
      id TEXT PRIMARY KEY,
      prescription_id TEXT UNIQUE REFERENCES protocol_prescriptions(id) ON DELETE CASCADE,
      consultation_date TIMESTAMPTZ,
      pre_consultation_template_id TEXT,
      pre_consultation_status TEXT,
      onboarding_link TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

async function migrateUserProtocolsToPrescriptions() {
  // Buscar todos UserProtocols que não têm prescrição correspondente
  const userProtocols = await prisma.userProtocol.findMany({
    where: {
      isActive: true
    },
    include: {
      protocol: true
    }
  });

  console.log(`Encontrados ${userProtocols.length} protocolos de usuário para migrar`);

  for (const userProtocol of userProtocols) {
    // Verificar se já existe uma prescrição
    const existingPrescription = await prisma.protocolPrescription.findFirst({
      where: {
        userId: userProtocol.userId,
        protocolId: userProtocol.protocolId
      }
    });

    if (existingPrescription) {
      console.log(`Prescrição já existe para protocolo ${userProtocol.id}`);
      continue;
    }

    // Criar nova prescrição
    const prescription = await prisma.protocolPrescription.create({
      data: {
        protocolId: userProtocol.protocolId,
        userId: userProtocol.userId,
        prescribedBy: userProtocol.protocol.doctorId,
        status: mapStatus(userProtocol.status),
        currentDay: userProtocol.currentDay,
        prescribedAt: userProtocol.createdAt,
        plannedStartDate: userProtocol.startDate,
        actualStartDate: userProtocol.status === 'ACTIVE' ? userProtocol.startDate : null,
        plannedEndDate: userProtocol.endDate || new Date(userProtocol.startDate.getTime() + (userProtocol.protocol.duration || 30) * 24 * 60 * 60 * 1000)
      }
    });

    // Criar consulta associada se houver dados
    if (userProtocol.consultationDate || userProtocol.preConsultationTemplateId || userProtocol.onboardingLink) {
      await prisma.$executeRaw`
        INSERT INTO protocol_consultations (
          id,
          prescription_id,
          consultation_date,
          pre_consultation_template_id,
          pre_consultation_status,
          onboarding_link
        ) VALUES (
          gen_random_uuid(),
          ${prescription.id},
          ${userProtocol.consultationDate},
          ${userProtocol.preConsultationTemplateId},
          ${userProtocol.preConsultationStatus},
          ${userProtocol.onboardingLink}
        );
      `;
    }

    console.log(`Migrado protocolo ${userProtocol.id} para prescrição ${prescription.id}`);
  }
}

async function migrateProtocolProgress() {
  // Buscar todo progresso antigo
  const oldProgress = await prisma.protocolDayProgress.findMany({
    include: {
      protocols: true
    }
  });

  console.log(`Encontrados ${oldProgress.length} registros de progresso para migrar`);

  for (const progress of oldProgress) {
    // Buscar prescrição correspondente
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        userId: progress.userId,
        protocolId: progress.protocolId
      }
    });

    if (!prescription) {
      console.log(`Prescrição não encontrada para progresso ${progress.id}`);
      continue;
    }

    // Verificar se já existe progresso V2
    const existingProgress = await prisma.protocolDayProgressV2.findFirst({
      where: {
        prescriptionId: prescription.id,
        dayNumber: progress.dayNumber,
        protocolTaskId: progress.protocolTaskId
      }
    });

    if (existingProgress) {
      console.log(`Progresso V2 já existe para ${progress.id}`);
      continue;
    }

    // Criar novo progresso
    await prisma.protocolDayProgressV2.create({
      data: {
        prescriptionId: prescription.id,
        dayNumber: progress.dayNumber,
        scheduledDate: progress.date || new Date(prescription.plannedStartDate.getTime() + (progress.dayNumber - 1) * 24 * 60 * 60 * 1000),
        completedAt: progress.completedAt,
        status: progress.completed || progress.isCompleted ? DayStatus.COMPLETED : DayStatus.PENDING,
        notes: progress.notes,
        protocolTaskId: progress.protocolTaskId
      }
    });

    console.log(`Migrado progresso ${progress.id}`);
  }
}

function mapStatus(oldStatus: string): PrescriptionStatus {
  switch (oldStatus.toUpperCase()) {
    case 'ACTIVE':
      return PrescriptionStatus.ACTIVE;
    case 'COMPLETED':
      return PrescriptionStatus.COMPLETED;
    case 'ABANDONED':
      return PrescriptionStatus.ABANDONED;
    case 'PAUSED':
      return PrescriptionStatus.PAUSED;
    default:
      return PrescriptionStatus.PRESCRIBED;
  }
}

async function updateAdherenceRates() {
  const prescriptions = await prisma.protocolPrescription.findMany({
    include: {
      progressV2: true
    }
  });

  for (const prescription of prescriptions) {
    const totalDays = prescription.progressV2.length;
    const completedDays = prescription.progressV2.filter(p => p.status === DayStatus.COMPLETED).length;
    const missedDays = prescription.progressV2.filter(p => p.status === DayStatus.MISSED).length;

    const adherenceRate = totalDays > 0 
      ? (completedDays / (completedDays + missedDays)) * 100 
      : 0;

    await prisma.protocolPrescription.update({
      where: { id: prescription.id },
      data: {
        adherenceRate,
        lastProgressDate: prescription.progressV2
          .filter(p => p.completedAt)
          .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0]?.completedAt || null
      }
    });

    console.log(`Atualizada taxa de adesão para prescrição ${prescription.id}: ${adherenceRate}%`);
  }
}

async function main() {
  try {
    console.log('Iniciando migração de dados...');

    console.log('Criando tabela de consultas...');
    await createConsultationTable();

    console.log('Migrando protocolos de usuário para prescrições...');
    await migrateUserProtocolsToPrescriptions();

    console.log('Migrando registros de progresso...');
    await migrateProtocolProgress();

    console.log('Atualizando taxas de adesão...');
    await updateAdherenceRates();

    console.log('Migração concluída com sucesso!');
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