import { verify } from "jsonwebtoken";
import { prisma } from "./prisma";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "default-secret";

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  image?: string;
}

/**
 * Verifica o token JWT em uma requisição mobile e retorna os dados do usuário
 */
export async function verifyMobileAuth(req: NextRequest) {
  try {
    // Obter o token do cabeçalho Authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove "Bearer " do início
    
    // Verificar o token
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    // Validar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub }
    });

    if (!user) {
      return null;
    }

    // Retorna os dados do usuário para uso na rota
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role
    };
  } catch (error) {
    console.error("Erro na verificação de token mobile:", error);
    return null;
  }
}

/**
 * Middleware para rotas protegidas mobile
 * Uso: export async function GET(req: NextRequest) { const user = await requireMobileAuth(req); ... }
 */
export async function requireMobileAuth(req: NextRequest) {
  const user = await verifyMobileAuth(req);
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}

/**
 * Helper para criar resposta de erro de autenticação
 */
export function unauthorizedResponse(message = "Não autorizado") {
  return NextResponse.json({ error: message }, { status: 401 });
} 