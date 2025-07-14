import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import { createDoctorVerificationEmail } from "@/email-templates/auth/doctor-verification";

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

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // Validações básicas
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Buscar plano padrão para médicos
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true }
    });

    if (!defaultPlan) {
      return NextResponse.json(
        { message: "Plano padrão não encontrado" },
        { status: 500 }
      );
    }

    // Gerar código de verificação (6 dígitos)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Hash da senha
    const hashedPassword = await hash(password, 12);

    // Criar médico
    const doctor = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'DOCTOR',
        emailVerified: null,
        verificationCode,
        verificationCodeExpiry: codeExpiry
      }
    });

    // Criar assinatura trial
    await prisma.doctorSubscription.create({
      data: {
        doctorId: doctor.id,
        planId: defaultPlan.id,
        status: 'TRIAL',
        trialEndDate: new Date(Date.now() + (defaultPlan.trialDays || 7) * 24 * 60 * 60 * 1000)
      }
    });

    // Enviar email de verificação
    try {
      await transporter.verify();
      console.log('SMTP connection verified');

      const html = createDoctorVerificationEmail({
        name,
        code: verificationCode,
        trialDays: defaultPlan.trialDays || 7
      });

      await transporter.sendMail({
        from: {
          name: 'Cxlus',
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: '[Cxlus] Verify Your Email',
        html
      });

      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Se o email falhar, deletar o médico criado
      await prisma.doctorSubscription.deleteMany({
        where: { doctorId: doctor.id }
      });
      await prisma.user.delete({
        where: { id: doctor.id }
      });
      throw emailError;
    }

    return NextResponse.json(
      {
        message: "Médico criado com sucesso. Verifique seu email para confirmar o cadastro.",
        doctorId: doctor.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Erro ao criar médico" },
      { status: 500 }
    );
  }
} 