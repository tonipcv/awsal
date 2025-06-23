import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, patientId } = body;

    if (!templateId || !patientId) {
      return NextResponse.json(
        { error: "ID do template e ID do paciente são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar o usuário para verificar o role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se existe um UserProtocol ativo com este template
    const userProtocol = await prisma.userProtocol.findFirst({
      where: {
        userId: patientId,
        isActive: true,
        protocol: {
          onboardingTemplateId: templateId
        }
      }
    });

    if (!userProtocol) {
      return NextResponse.json(
        { error: "Protocolo não encontrado ou não está ativo" },
        { status: 404 }
      );
    }

    // Se for paciente, verificar se o protocolo pertence a ele
    if (user.role === 'PATIENT' && patientId !== session.user.id) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Gerar um novo token
    const token = nanoid(10);

    // Atualizar o UserProtocol com o novo link
    await prisma.userProtocol.update({
      where: {
        id: userProtocol.id
      },
      data: {
        onboardingLink: token
      }
    });

    // Criar uma nova resposta vinculada ao paciente
    await prisma.onboardingResponse.create({
      data: {
        templateId,
        userId: patientId,
        token,
        email: user.email || "",
        status: "PENDING",
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Erro ao gerar link:", error);
    return NextResponse.json(
      { error: "Erro ao gerar link" },
      { status: 500 }
    );
  }
} 