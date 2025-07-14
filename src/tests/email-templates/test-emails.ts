import nodemailer from 'nodemailer';
import { createConsultationRequestEmail } from '../../email-templates/notifications/consultation-request';
import { createConsultationConfirmationEmail } from '../../email-templates/patient/consultation-confirmation';
import { createDoctorInvitationEmail } from '../../email-templates/doctor/invitation';
import { createCreditEmail } from '../../email-templates/notifications/credit';
import { createReferralEmail } from '../../email-templates/notifications/referral';
import { createVerificationEmail } from '../../email-templates/auth/verification';
import { createResetPasswordEmail } from '../../email-templates/auth/reset-password';

const TEST_EMAIL = 'xppsalvador@gmail.com';

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: 'smtp-pulse.com',
  port: 2525,
  secure: false,
  auth: {
    user: 'xppsalvador@gmail.com',
    pass: 'k44o2egpLDaa7'
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendTestEmail(subject: string, html: string) {
  try {
    const data = await transporter.sendMail({
      from: {
        name: 'CXLUS',
        address: 'ai@booplabs.com'
      },
      to: TEST_EMAIL,
      subject,
      html,
    });
    console.log(`✅ Email "${subject}" sent successfully:`, data.messageId);
  } catch (error) {
    console.error(`❌ Failed to send "${subject}":`, error);
  }
}

async function runEmailTests() {
  console.log('🚀 Starting email template tests...\n');

  // Test Consultation Request
  await sendTestEmail(
    '[TEST] Consultation Request',
    createConsultationRequestEmail({
      patientName: 'John Doe',
      patientEmail: TEST_EMAIL,
      patientPhone: '+5571999999999',
      specialty: 'Cardiologia',
      message: 'Preciso de uma consulta urgente',
      clinicName: 'CXLUS Clinic',
      doctorName: 'Dr. Smith'
    })
  );

  // Test Consultation Confirmation
  await sendTestEmail(
    '[TEST] Consultation Confirmation',
    createConsultationConfirmationEmail({
      patientName: 'John Doe',
      doctorName: 'Dr. Smith',
      specialty: 'Cardiologia',
      whatsapp: '+5571999999999',
      message: 'Sua consulta foi confirmada!',
      clinicName: 'CXLUS Clinic'
    })
  );

  // Test Doctor Invitation
  await sendTestEmail(
    '[TEST] Doctor Invitation',
    createDoctorInvitationEmail({
      name: 'Dr. Smith',
      inviteUrl: 'https://cxlus.com/invite/123',
      subscriptionType: 'TRIAL',
      trialDays: 7,
      clinicName: 'CXLUS Clinic'
    })
  );

  // Test Credit Notification
  await sendTestEmail(
    '[TEST] Credit Notification',
    createCreditEmail({
      name: 'John Doe',
      amount: 100,
      type: 'CONSULTATION_REFERRAL',
      clinicName: 'CXLUS Clinic'
    })
  );

  // Test Referral Notification
  await sendTestEmail(
    '[TEST] Referral Notification',
    createReferralEmail({
      referralName: 'Jane Smith',
      referrerName: 'John Doe',
      doctorName: 'Dr. Smith',
      clinicName: 'CXLUS Clinic'
    })
  );

  // Test Verification Email
  await sendTestEmail(
    '[TEST] Email Verification',
    createVerificationEmail({
      name: 'John Doe',
      code: '123456',
      expiryHours: 1,
      clinicName: 'CXLUS Clinic'
    })
  );

  // Test Reset Password
  await sendTestEmail(
    '[TEST] Password Reset',
    createResetPasswordEmail({
      name: 'John Doe',
      resetUrl: 'https://cxlus.com/reset-password?token=123456',
      expiryHours: 1,
      clinicName: 'CXLUS Clinic'
    })
  );

  console.log('\n✨ All email tests completed!');
}

// Verificar conexão SMTP antes de executar os testes
async function main() {
  try {
    console.log('🔄 Verificando conexão SMTP...');
    await transporter.verify();
    console.log('✅ Conexão SMTP estabelecida com sucesso!\n');
    await runEmailTests();
  } catch (error) {
    console.error('❌ Erro na conexão SMTP:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
} 