import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Configuração do transporter de email
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  throw new Error('Missing SMTP configuration environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, subscriptionType = 'TRIAL' } = body;

    // Validações
    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    // Validar tipo de subscription (padrão é TRIAL)
    if (!['TRIAL', 'ACTIVE'].includes(subscriptionType)) {
      return NextResponse.json({ error: 'Tipo de subscription inválido' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 });
    }

    // Buscar o plano padrão (Básico)
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true }
    });

    if (!defaultPlan) {
      return NextResponse.json({ error: 'Plano padrão não encontrado' }, { status: 500 });
    }

    // Gerar token para definir senha
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(inviteToken)
      .digest("hex");

    // Criar o médico sem senha (será definida via convite)
    const doctor = await prisma.user.create({
      data: {
        name,
        email,
        role: 'DOCTOR',
        emailVerified: null, // Será verificado quando definir a senha
        resetToken: hashedToken, // Usar o campo resetToken para o convite
        resetTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias para aceitar o convite
      }
    });

    // Criar subscription baseada na seleção (padrão TRIAL)
    const now = new Date();
    const subscriptionData: any = {
      doctorId: doctor.id,
      planId: defaultPlan.id,
      status: subscriptionType,
      startDate: now,
      autoRenew: true,
    };

    if (subscriptionType === 'TRIAL') {
      subscriptionData.trialEndDate = new Date(now.getTime() + defaultPlan.trialDays * 24 * 60 * 60 * 1000);
    } else {
      subscriptionData.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    }
    
    await prisma.doctorSubscription.create({
      data: subscriptionData
    });

    // Enviar email de convite
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';
    
    const inviteUrl = `${baseUrl}/auth/set-password?token=${inviteToken}`;

    try {
      await transporter.verify();
      console.log('SMTP connection verified');

      await transporter.sendMail({
        from: {
          name: 'AwLov',
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: 'Convite para AwLov - Defina sua senha',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e293b; text-align: center; margin-bottom: 30px;">Bem-vindo ao AwLov!</h1>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Olá <strong>${name}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Você foi convidado para se juntar à plataforma AwLov como médico. Para começar a usar a plataforma, você precisa definir sua senha.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Definir Senha e Acessar
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 10px 0;">🎉 ${subscriptionType === 'TRIAL' ? 'Seu Trial Gratuito' : 'Sua Subscription Ativa'}</h3>
              <p style="color: #475569; margin: 0; font-size: 14px;">
                Sua conta já está configurada com o plano Básico ${subscriptionType === 'TRIAL' ? 'em período de trial' : 'ativo'} que inclui:
              </p>
              <ul style="color: #475569; font-size: 14px; margin: 10px 0;">
                <li>Até 50 pacientes</li>
                <li>Até 10 protocolos</li>
                <li>Até 5 cursos</li>
                <li>Até 30 produtos</li>
                ${subscriptionType === 'TRIAL' ? `<li>${defaultPlan.trialDays} dias de trial gratuito</li>` : '<li>Subscription ativa imediatamente</li>'}
              </ul>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              <strong>Importante:</strong> Este link é válido por 7 dias. Se você não definir sua senha dentro deste prazo, será necessário solicitar um novo convite.
            </p>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              Se você não solicitou este convite, pode ignorar este email com segurança.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              AwLov - Plataforma Médica<br>
              Este é um email automático, não responda.
            </p>
          </div>
        `
      });
      console.log('Invite email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Se o email falhar, deletar o médico criado
      await prisma.doctorSubscription.deleteMany({
        where: { doctorId: doctor.id }
      });
      await prisma.user.delete({
        where: { id: doctor.id }
      });
      throw new Error('Erro ao enviar email de convite');
    }

    return NextResponse.json({ 
      success: true, 
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email
      },
      message: 'Médico criado com sucesso e convite enviado por email'
    });

  } catch (error) {
    console.error('Erro ao criar médico:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 });
  }
} 