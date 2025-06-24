import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

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

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null
      },
    });

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires: codeExpiry
      }
    });

    console.log('Sending verification email to:', email);
    // Send verification email
    try {
      await transporter.verify();
      console.log('SMTP connection verified');

      await transporter.sendMail({
        from: {
          name: 'CXLUS',
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: 'Verifique seu email',
        html: `
          <h1>Bem-vindo ao CXLUS!</h1>
          <p>Para confirmar seu cadastro, use o código abaixo:</p>
          <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 24px; letter-spacing: 4px; margin: 20px 0;">
            <strong>${verificationCode}</strong>
          </div>
          <p>Este código é válido por 1 hora.</p>
          <p>Se você não solicitou este cadastro, ignore este email.</p>
        `
      });
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // If email fails, delete the user and verification token
      await prisma.user.delete({
        where: { id: user.id }
      });
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token: verificationCode
          }
        }
      });
      throw emailError;
    }

    return NextResponse.json(
      {
        message: "Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.",
        userId: user.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
} 