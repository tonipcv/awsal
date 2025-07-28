import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default-secret";

export async function GET(req: NextRequest) {
  try {
    // Verificação do token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, JWT_SECRET) as any;

    // Compatibilidade com diferentes formatos de token
    const userId = decoded.user_id || decoded.sub;
    if (!userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Busca otimizada do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        doctor_id: true,
        created_at: true,
        is_active: true,
        image: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Resposta padronizada
    return NextResponse.json({
      success: true,
      user: {
        ...user,
        hasClinic: user.doctor_id !== null,
        needsClinic: user.role === "PATIENT_NOCLINIC" && user.doctor_id === null
      }
    });

  } catch (error) {
    console.error("Erro no endpoint /me:", error);
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 });
  }
}
