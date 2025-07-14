import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createSetPasswordEmail } from '@/email-templates/auth/set-password';

// Configuração do transporter de email
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  console.warn('Missing SMTP configuration environment variables');
}

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const doctor = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem enviar emails.' }, { status: 403 });
    }

    // Buscar o paciente
    const patient = await prisma.user.findFirst({
      where: {
        id: id,
        role: 'PATIENT',
        patientRelationships: {
          some: {
            doctorId: session.user.id
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 });
    }

    // Gerar token de reset de senha
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar token no banco
    await prisma.user.update({
      where: { id: patient.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // URL para redefinir senha
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // Determinar nome e logo da clínica
    const clinicName = doctor.clinicMemberships?.[0]?.clinic?.name || 'CXLUS';
    const clinicLogo = doctor.clinicMemberships?.[0]?.clinic?.logo || undefined;

    try {
      // Verificar conexão SMTP
      await transporter.verify();
      console.log('SMTP connection verified for password reset');

      // Gerar o HTML do email usando o template
      const html = createSetPasswordEmail({
        name: patient.name || 'Patient',
        email: patient.email,
        resetUrl,
        doctorName: doctor.name || undefined,
        clinicName,
        clinicLogo
      });

      // Enviar email
      await transporter.sendMail({
        from: {
          name: 'Cxlus',
          address: process.env.SMTP_FROM as string
        },
        to: patient.email,
        subject: `${doctor.name || 'Your doctor'} invited you to Cxlus`,
        html
      });

      return NextResponse.json({ 
        success: true,
        message: 'Email de redefinição de senha enviado com sucesso',
        resetUrl // apenas para teste/desenvolvimento
      });

    } catch (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in password reset route:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}