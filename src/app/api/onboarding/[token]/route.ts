import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: "Token é obrigatório" },
        { status: 400 }
      );
    }

    // Busca a resposta pelo token
    const response = await prisma.onboardingResponse.findUnique({
      where: { token },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            isPublic: true,
            welcomeTitle: true,
            welcomeDescription: true,
            welcomeItems: true,
            estimatedTime: true,
            welcomeVideoUrl: true,
            welcomeButtonText: true,
            successTitle: true,
            successDescription: true,
            successVideoUrl: true,
            successButtonText: true,
            successButtonUrl: true,
            nextSteps: true,
            contactEmail: true,
            contactPhone: true,
            steps: {
              orderBy: {
                order: "asc",
              },
            },
            doctor: {
              include: {
                clinicMemberships: {
                  where: { isActive: true },
                  include: {
                    clinic: {
                      select: {
                        name: true,
                        logo: true,
                      },
                    },
                  },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json(
        { error: "Formulário não encontrado" },
        { status: 404 }
      );
    }

    // Se já foi completado, retorna erro
    if (response.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Este formulário já foi preenchido" },
        { status: 400 }
      );
    }

    // Atualiza o status para IN_PROGRESS
    await prisma.onboardingResponse.update({
      where: { id: response.id },
      data: { status: "IN_PROGRESS" },
    });

    // Pega os dados da clínica
    const clinicData = response.template.doctor.clinicMemberships[0]?.clinic;

    // Retorna o template com os dados da clínica
    return NextResponse.json({
      ...response.template,
      clinicName: clinicData?.name,
      clinicLogo: clinicData?.logo,
    });
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    return NextResponse.json(
      { error: "Erro ao buscar template" },
      { status: 500 }
    );
  }
} 