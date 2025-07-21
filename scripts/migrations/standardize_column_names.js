const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando padronização dos nomes das colunas...');

    // 1. Protocol
    console.log('Renomeando colunas da tabela protocols...');
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "doctorId" TO doctor_id;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "isActive" TO is_active;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "createdAt" TO created_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "updatedAt" TO updated_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "modalTitle" TO modal_title;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "modalVideoUrl" TO modal_video_url;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "modalDescription" TO modal_description;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "modalButtonText" TO modal_button_text;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "modalButtonUrl" TO modal_button_url;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "showDoctorInfo" TO show_doctor_info;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "isTemplate" TO is_template;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "coverImage" TO cover_image;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocols
      RENAME COLUMN "onboardingTemplateId" TO onboarding_template_id;
    `;

    // 2. ProtocolPrescription
    console.log('Renomeando colunas da tabela protocol_prescriptions...');
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "protocolId" TO protocol_id;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "userId" TO user_id;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "prescribedBy" TO prescribed_by;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "prescribedAt" TO prescribed_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "plannedStartDate" TO planned_start_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "actualStartDate" TO actual_start_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "plannedEndDate" TO planned_end_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "actualEndDate" TO actual_end_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "currentDay" TO current_day;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "adherenceRate" TO adherence_rate;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "lastProgressDate" TO last_progress_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "pausedAt" TO paused_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "pauseReason" TO pause_reason;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "abandonedAt" TO abandoned_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "abandonReason" TO abandon_reason;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "consultationDate" TO consultation_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "onboardingLink" TO onboarding_link;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "preConsultationTemplateId" TO pre_consultation_template_id;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "preConsultationStatus" TO pre_consultation_status;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "createdAt" TO created_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE protocol_prescriptions
      RENAME COLUMN "updatedAt" TO updated_at;
    `;

    // 3. User
    console.log('Renomeando colunas da tabela User...');
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "isActive" TO is_active;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "createdAt" TO created_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "updatedAt" TO updated_at;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "emailVerified" TO email_verified;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "resetToken" TO reset_token;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "resetTokenExpiry" TO reset_token_expiry;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "verificationCode" TO verification_code;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "verificationCodeExpiry" TO verification_code_expiry;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "doctorId" TO doctor_id;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "referralCode" TO referral_code;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "birthDate" TO birth_date;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "emergencyContact" TO emergency_contact;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "emergencyPhone" TO emergency_phone;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "medicalHistory" TO medical_history;
    `;
    await prisma.$executeRaw`
      ALTER TABLE "User"
      RENAME COLUMN "googleReviewLink" TO google_review_link;
    `;

    console.log('Migração concluída com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Atualize o schema.prisma com os novos nomes de campos');
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