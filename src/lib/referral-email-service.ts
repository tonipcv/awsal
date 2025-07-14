import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { createReferralEmail } from '@/email-templates/notifications/referral';
import { createCreditEmail } from '@/email-templates/notifications/credit';

// Usar a mesma configuração de email existente
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

/**
 * Envia notificação quando uma nova indicação é recebida
 */
export async function sendReferralNotification(leadId: string) {
  try {
    const lead = await prisma.referralLead.findUnique({
      where: { id: leadId },
      include: {
        doctor: { select: { name: true, email: true } }
      }
    });

    if (!lead || !lead.doctor?.email) {
      console.error('Lead não encontrado ou email do médico inválido:', leadId);
      return;
    }

    // Buscar referrer separadamente se existir
    let referrer = null;
    if (lead.referrerId) {
      referrer = await prisma.user.findUnique({
        where: { id: lead.referrerId },
        select: { name: true, email: true }
      });
    }

    // Buscar informações da clínica para personalizar o email
    let clinicInfo = null;
    try {
      if (lead.doctorId) {
        const clinic = await prisma.clinic.findFirst({
          where: {
            members: {
              some: {
                userId: lead.doctorId,
                isActive: true
              }
            }
          },
          select: { name: true, logo: true }
        });
        clinicInfo = clinic;
      }
    } catch (error) {
      console.log('Clínica não encontrada, usando informações do médico');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Email para o médico
    const doctorEmailHtml = createReferralEmail({
      referralName: lead.name,
      referrerName: referrer?.name || 'Unknown',
      doctorName: lead.doctor.name || '',
      clinicName: clinicInfo?.name || 'Cxlus',
      clinicLogo: clinicInfo?.logo || undefined
    });

    await transporter.sendMail({
      from: {
        name: 'Cxlus',
        address: process.env.SMTP_FROM as string
      },
      to: lead.doctor.email,
      subject: 'New referral',
      html: doctorEmailHtml
    });

    console.log('Notificação de indicação enviada com sucesso para:', lead.doctor.email);
  } catch (error) {
    console.error('Erro ao enviar notificação de indicação:', error);
  }
}

/**
 * Envia notificação quando um crédito é concedido
 */
export async function sendCreditNotification(creditId: string) {
  try {
    const credit = await prisma.referralCredit.findUnique({
      where: { id: creditId },
      include: {
        user: true,
        referral_leads: {
          select: { name: true }
        }
      }
    });

    if (!credit || !credit.user?.email) {
      console.error('Crédito não encontrado ou email do usuário inválido:', creditId);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const leadName = credit.referral_leads?.name;

    const emailHtml = createCreditEmail({
      name: credit.user.name || '',
      amount: Number(credit.amount),
      type: 'CONSULTATION_REFERRAL',
      clinicName: 'Cxlus'
    });

    await transporter.sendMail({
      from: {
        name: 'Cxlus',
        address: process.env.SMTP_FROM as string
      },
      to: credit.user.email,
      subject: 'New credit',
      html: emailHtml
    });

    console.log('Notificação de crédito enviada com sucesso para:', credit.user.email);
  } catch (error) {
    console.error('Erro ao enviar notificação de crédito:', error);
  }
} 