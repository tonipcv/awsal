import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';
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

const createReferralSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().nullable(),
  notes: z.string().nullable()
});

// GET /api/mobile/referrals - Listar indicações do usuário
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Buscar indicações do usuário
    const referrals = await prisma.referralLead.findMany({
      where: {
        referrerId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        convertedAt: true,
        creditAwarded: true,
        creditValue: true
      }
    });

    return NextResponse.json({
      success: true,
      referrals,
      total: referrals.length
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/referrals:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    
    return NextResponse.json(
      { error: 'Error fetching referrals' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/referrals - Criar nova indicação
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar se é paciente
    const userDetails = await prisma.user.findUnique({
      where: { id: user.id },
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

    if (!userDetails || userDetails.role !== 'PATIENT') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas pacientes podem criar indicações.' },
        { status: 403 }
      );
    }

    if (!userDetails.doctorId) {
      return NextResponse.json(
        { error: 'Você precisa estar vinculado a um médico para fazer indicações.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, notes } = createReferralSchema.parse(body);

    // Verificar se o email já existe como usuário
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Esta pessoa já possui uma conta no sistema' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma indicação pendente para este email
    const existingReferral = await prisma.referralLead.findFirst({
      where: {
        email,
        status: { in: ['PENDING', 'CONTACTED'] }
      }
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Já existe uma indicação pendente para este email' },
        { status: 400 }
      );
    }

    // Buscar informações do médico e clínica
    const doctor = await prisma.user.findUnique({
      where: { id: userDetails.doctorId },
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
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Criar a indicação
    const referral = await prisma.referralLead.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        notes: notes || undefined,
        referrerId: user.id,
        doctorId: userDetails.doctorId,
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
        referrerName: userDetails.name || '',
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
        name: userDetails.name || '',
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
        to: userDetails.email,
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

  } catch (error: any) {
    console.error('Error in POST /api/mobile/referrals:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error creating referral' },
      { status: 500 }
    );
  }
} 