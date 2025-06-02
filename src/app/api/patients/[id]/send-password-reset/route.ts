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
    const patient = await prisma.user.findUnique({
      where: {
        id: id, // Use the awaited id
        doctorId: session.user.id, // Garantir que o paciente pertence ao médico
        role: 'PATIENT'
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
                email: true
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
                      'BOOP';

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
        subject: `Defina sua senha de acesso - ${senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e293b; text-align: center; margin-bottom: 30px;">Defina sua senha de acesso</h1>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Olá <strong>${patient.name}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Seu médico solicitou o envio de um link para você definir sua senha de acesso à plataforma ${senderName}.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #5154e7; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Definir Minha Senha
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 10px 0;">📋 Informações da Conta</h3>
              <p style="color: #475569; margin: 0; font-size: 14px;">
                <strong>Email:</strong> ${patient.email}<br>
                <strong>Médico:</strong> ${doctorWithClinic?.name || 'Não informado'}<br>
                <strong>Clínica:</strong> ${senderName}
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              <strong>Importante:</strong> Este link é válido por 24 horas. Se você não definir sua senha dentro deste prazo, será necessário solicitar um novo link ao seu médico.
            </p>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Se você não solicitou este acesso, pode ignorar este email com segurança.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${senderName} - Plataforma Médica<br>
              Este é um email automático, não responda.
            </p>
          </div>
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