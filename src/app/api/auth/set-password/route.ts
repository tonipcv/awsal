import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid invite token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date()
        },
        role: 'DOCTOR' // Apenas médicos podem usar este endpoint
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "Token de convite inválido ou expirado" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);

    // Update user's password, verify email, and clear invite token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Verificar email automaticamente
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json(
      { message: "Senha definida com sucesso! Você já pode fazer login." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Set password error:", error);
    return NextResponse.json(
      { message: "Erro ao definir a senha" },
      { status: 500 }
    );
  }
} 