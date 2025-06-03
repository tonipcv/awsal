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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch doctors
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch subscriptions separately
    const subscriptions = await prisma.doctorSubscription.findMany({
      where: {
        doctorId: { in: doctors.map(d => d.id) }
      },
      include: {
        plan: {
          select: {
            name: true,
            maxPatients: true,
            maxProtocols: true,
            maxCourses: true,
            maxProducts: true
          }
        }
      }
    });

    // Fetch patient counts per doctor
    const patientCounts = await Promise.all(
      doctors.map(async (doctor) => ({
        doctorId: doctor.id,
        count: await prisma.user.count({
          where: { 
            role: 'PATIENT',
            doctorId: doctor.id
          }
        })
      }))
    );

    // Combine data
    const doctorsWithData = doctors.map(doctor => {
      const subscription = subscriptions.find(s => s.doctorId === doctor.id);
      const patientCount = patientCounts.find(p => p.doctorId === doctor.id)?.count || 0;
      
      return {
        ...doctor,
        subscription,
        patientCount
      };
    });

    return NextResponse.json({ 
      doctors: doctorsWithData
    });

  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, subscriptionType = 'TRIAL' } = body;

    // Validações
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Validar tipo de subscription (padrão é TRIAL)
    if (!['TRIAL', 'ACTIVE'].includes(subscriptionType)) {
      return NextResponse.json({ error: 'Invalid subscription type' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'This email is already in use' }, { status: 400 });
    }

    // Buscar o plano padrão (Básico)
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true }
    });

    if (!defaultPlan) {
      return NextResponse.json({ error: 'Default plan not found' }, { status: 500 });
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
      const trialDays = defaultPlan.trialDays || 7; // Default to 7 days if null
      subscriptionData.trialEndDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
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
    const trialDays = defaultPlan.trialDays || 7; // For email template

    try {
      await transporter.verify();
      console.log('SMTP connection verified');

      await transporter.sendMail({
        from: {
          name: 'AwLov',
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: 'Invitation to AwLov - Set your password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1e293b; text-align: center; margin-bottom: 30px;">Welcome to AwLov!</h1>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Hello <strong>${name}</strong>,
            </p>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              You have been invited to join the AwLov platform as a doctor. To start using the platform, you need to set your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" 
                 style="display: inline-block; padding: 15px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Set Password and Access
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 10px 0;">🎉 ${subscriptionType === 'TRIAL' ? 'Your Free Trial' : 'Your Active Subscription'}</h3>
              <p style="color: #475569; margin: 0; font-size: 14px;">
                Your account is already configured with the Basic plan ${subscriptionType === 'TRIAL' ? 'in trial period' : 'active'} which includes:
              </p>
              <ul style="color: #475569; font-size: 14px; margin: 10px 0;">
                <li>Up to 50 patients</li>
                <li>Up to 10 protocols</li>
                <li>Up to 5 courses</li>
                <li>Up to 30 products</li>
                ${subscriptionType === 'TRIAL' ? `<li>${trialDays} days free trial</li>` : '<li>Active subscription immediately</li>'}
              </ul>
            </div>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              <strong>Important:</strong> This link is valid for 7 days. If you don't set your password within this period, you'll need to request a new invite.
            </p>
            
            <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
              If you didn't request this invite, you can safely ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              AwLov - Medical Platform<br>
              This is an automated email, please do not reply.
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
      throw new Error('Error sending invite email');
    }

    return NextResponse.json({ 
      success: true, 
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email
      },
      message: 'Doctor created successfully and invite sent by email'
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 