import { NextResponse } from "next/server";
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
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Find unverified user
    const user = await prisma.user.findFirst({
      where: {
        email,
        emailVerified: null
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado ou já verificado" },
        { status: 400 }
      );
    }

    // Delete any existing verification token
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email
      }
    });

    // Generate new verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires: codeExpiry
      }
    });

    console.log('Sending new verification code to:', email);
    // Send new verification email
    try {
      await transporter.verify();
      console.log('SMTP connection verified');

      await transporter.sendMail({
        from: {
          name: 'CXLUS',
          address: process.env.SMTP_FROM as string
        },
        to: email,
        subject: 'Novo código de verificação',
        html: `
          <h1>Novo código de verificação</h1>
          <p>Conforme solicitado, aqui está seu novo código de verificação:</p>
          <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 24px; letter-spacing: 4px; margin: 20px 0;">
            <strong>${verificationCode}</strong>
          </div>
          <p>Este código é válido por 1 hora.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
        `
      });
      console.log('New verification code sent successfully');
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw emailError;
    }

    return NextResponse.json(
      { message: "Novo código enviado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend code error:", error);
    return NextResponse.json(
      { message: "Erro ao reenviar código" },
      { status: 500 }
    );
  }
} 