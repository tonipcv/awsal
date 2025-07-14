import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyMobileAuth } from '@/lib/mobile-auth';
import { createReferralEmail } from '@/email-templates/notifications/referral';
import { createCreditEmail } from '@/email-templates/notifications/credit';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// POST - Criar nova indicação
export async function POST(request: NextRequest) {
  try {
    // Tentar autenticação web primeiro
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;

    // Se não há sessão web, tentar autenticação mobile
    if (!userId) {
      const mobileUser = await verifyMobileAuth(request);
      if (mobileUser) {
        userId = mobileUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true,
        doctorId: true,
        name: true,
        email: true,
        clinicMemberships: {
          where: { isActive: true },
          include: {
            clinic: {
              select: {
                name: true,
                logo: true
              }
            }
          },
          take: 1
        }
      }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem criar indicações.' }, { status: 403 });
    }

    if (!user.doctorId) {
      return NextResponse.json({ error: 'Você precisa estar vinculado a um médico para fazer indicações.' }, { status: 400 });
    }

    const { name, email, phone, notes } = await request.json();

    // Validações
    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    // Verificar se o email já existe como usuário
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Esta pessoa já possui uma conta no sistema' }, { status: 400 });
    }

    // Verificar se já existe uma indicação pendente para este email
    const existingReferral = await prisma.referralLead.findFirst({
      where: {
        email,
        status: { in: ['PENDING', 'CONTACTED'] }
      }
    });

    if (existingReferral) {
      return NextResponse.json({ error: 'Já existe uma indicação pendente para este email' }, { status: 400 });
    }

    // Buscar informações do médico e clínica
    const doctor = await prisma.user.findUnique({
      where: { id: user.doctorId },
      include: {
        clinicMemberships: {
          where: { isActive: true },
          include: {
            clinic: {
              select: {
                name: true,
                logo: true
              }
            }
          },
          take: 1
        }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    // Criar a indicação
    const referral = await prisma.referralLead.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
        referrerId: userId,
        doctorId: user.doctorId,
        status: 'PENDING',
        source: 'PATIENT_REFERRAL'
      }
    });

    const clinicName = doctor.clinicMemberships?.[0]?.clinic?.name || doctor.name || 'CXLUS';
    const clinicLogo = doctor.clinicMemberships?.[0]?.clinic?.logo || undefined;

    // Enviar notificação por email
    try {
      const emailHtml = createReferralEmail({
        referralName: name,
        referrerName: user.name || '',
        doctorName: doctor.name || '',
        clinicName,
        clinicLogo,
        notes: notes || undefined
      });

      await transporter.sendMail({
        from: {
          name: clinicName,
          address: process.env.SMTP_FROM as string
        },
        to: doctor.email,
        subject: `[Cxlus] Nova Indicação - ${name}`,
        html: emailHtml
      });

      // Enviar email de crédito para o paciente que indicou
      const creditEmailHtml = createCreditEmail({
        name: user.name || '',
        amount: 1,
        type: 'CONSULTATION_REFERRAL',
        clinicName,
        clinicLogo
      });

      await transporter.sendMail({
        from: {
          name: clinicName,
          address: process.env.SMTP_FROM as string
        },
        to: user.email,
        subject: '[Cxlus] Novo Crédito de Indicação',
        html: creditEmailHtml
      });

    } catch (emailError) {
      console.error('Erro ao enviar notificação de indicação:', emailError);
      // Não falhar a criação da indicação por causa do email
    }

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        name: referral.name,
        email: referral.email,
        phone: referral.phone,
        status: referral.status,
        createdAt: referral.createdAt
      },
      message: 'Indicação criada com sucesso! O médico será notificado.'
    });

  } catch (error) {
    console.error('Erro ao criar indicação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 