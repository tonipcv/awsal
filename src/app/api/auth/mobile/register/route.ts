import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default-secret";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Criptografar a senha
    const hashedPassword = await hash(password, 12);

    // Gerar código de verificação
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    // Criar o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    });

    // Salvar o código de verificação
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationCode,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      }
    });

    // Enviar email com código de verificação
    // Aqui você implementaria a lógica de envio de email
    // Comentado para simplificar este exemplo
    // await sendVerificationEmail(email, verificationCode);

    // Criar token JWT para o cliente mobile
    const token = sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      message: "Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.",
      userId: user.id,
      token,
      // Retornamos o código para facilitar testes, em produção seria enviado apenas por email
      verificationCode
    });
  } catch (error) {
    console.error("Erro no registro mobile:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
} 