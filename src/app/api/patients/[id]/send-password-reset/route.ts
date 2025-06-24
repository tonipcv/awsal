import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuração do transporter de email
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  console.warn('Missing SMTP configuration environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false, // false para porta 2525 do SendPulse
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
    const { id } = await params; // Await params before using
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
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

    // Buscar informações do médico e clínica para incluir no email
    const doctorWithClinic = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        clinicMemberships: {
          where: { isActive: true },
          include: {
            clinic: {
              select: {
                name: true,
                email: true,
                logo: true
              }
            }
          },
          take: 1
        }
      }
    });

    // Determinar nome do remetente (clínica ou médico)
    const senderName = doctorWithClinic?.clinicMemberships?.[0]?.clinic?.name || 
                      doctorWithClinic?.name || 
                      'CXLUS';

    try {
      // Verificar conexão SMTP
      await transporter.verify();
      console.log('SMTP connection verified for password reset');

      // Enviar email de redefinição de senha
      await transporter.sendMail({
        from: {
          name: senderName,
          address: process.env.SMTP_FROM as string
        },
        to: patient.email!,
        subject: `Set Your Password - ${senderName}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Set Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; line-height: 1.6;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              
              <!-- Header with Clinic Logo -->
              <div style="background-color: #000000; padding: 40px 30px; text-align: center;">
                ${doctorWithClinic?.clinicMemberships?.[0]?.clinic?.logo ? `
                  <img src="${doctorWithClinic.clinicMemberships[0].clinic.logo}" alt="${senderName}" style="max-height: 60px; max-width: 200px; margin-bottom: 20px; object-fit: contain;">
                ` : `
                  <div style="margin-bottom: 20px;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${senderName}</h2>
                  </div>
                `}
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 400;">Welcome to Our Platform</h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 30px; background-color: #ffffff;">
                <div style="margin-bottom: 30px;">
                  <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hello ${patient.name},</h2>
                  <p style="color: #666666; margin: 0 0 16px 0; font-size: 16px;">
                    Your doctor has requested to send you access to our healthcare platform. To get started, please set your password by clicking the button below.
                  </p>
                </div>

                <!-- Set Password Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${resetUrl}" 
                     style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 4px; font-weight: 600; font-size: 16px;">
                    Set My Password
                  </a>
                </div>

                <!-- Account Information -->
                <div style="background-color: #f8f8f8; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #000000; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Account Information</h3>
                  <div style="color: #666666; font-size: 14px;">
                    <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${patient.email}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Healthcare Provider:</strong> ${doctorWithClinic?.name || 'Not specified'}</p>
                    <p style="margin: 0;"><strong>Clinic:</strong> ${senderName}</p>
                  </div>
                </div>

                <!-- Important Notice -->
                <div style="background-color: #f8f8f8; border-left: 4px solid #666666; padding: 20px; margin: 30px 0;">
                  <h3 style="color: #000000; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Important</h3>
                  <ul style="color: #666666; margin: 0; padding-left: 20px; font-size: 14px;">
                    <li style="margin-bottom: 8px;">This link is valid for 24 hours</li>
                    <li style="margin-bottom: 8px;">If you don't set your password within this time, you'll need to request a new link from your doctor</li>
                    <li>If you didn't expect this email, you can safely ignore it</li>
                  </ul>
                </div>

                <!-- Alternative Link -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color: #000000; font-size: 14px; word-break: break-all; margin: 0;">
                    ${resetUrl}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                <div style="margin-bottom: 20px;">
                  <p style="color: #666666; font-size: 14px; margin: 0;">
                    This email was sent by <strong>${senderName}</strong>
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 8px 0 0 0;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </div>
                
                <!-- System Logo -->
                <div style="padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                    Powered by
                  </p>
                  <img src="${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'}/logo.png" alt="CXLUS" style="height: 20px; opacity: 0.7;">
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log(`✅ Email de redefinição de senha enviado para: ${patient.email} em nome de ${senderName}`);
      
      return NextResponse.json({
        success: true,
        message: 'Email de redefinição de senha enviado com sucesso'
      });

    } catch (emailError) {
      console.error('❌ Erro ao enviar email de redefinição:', emailError);
      return NextResponse.json({ 
        error: 'Erro ao enviar email. Verifique a configuração SMTP.' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
  }
}