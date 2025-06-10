import { NextRequest, NextResponse } from "next/server";
import { verifyMobileAuth } from "@/lib/mobile-auth";

// POST /api/auth/mobile/validate - Validar token JWT mobile
export async function POST(req: NextRequest) {
  try {
    const user = await verifyMobileAuth(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado", valid: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      }
    });
  } catch (error) {
    console.error("Erro na validação do token mobile:", error);
    return NextResponse.json(
      { error: "Erro de servidor", valid: false },
      { status: 500 }
    );
  }
} 