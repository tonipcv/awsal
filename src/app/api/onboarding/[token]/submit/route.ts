import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Answer {
  stepId: string;
  answer: string;
}

interface OnboardingStep {
  id: string;
  required: boolean;
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { email, answers } = await request.json();

    if (!token || !email || !answers) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Busca a resposta pelo token
    const response = await prisma.onboardingResponse.findUnique({
      where: { token },
      include: {
        template: {
          include: {
            steps: true,
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

    // Valida se todas as perguntas obrigatórias foram respondidas
    const requiredSteps = response.template.steps.filter((step: OnboardingStep) => step.required);
    const answeredStepIds = answers.map((a: Answer) => a.stepId);
    const missingRequired = requiredSteps.some(
      (step: OnboardingStep) => !answeredStepIds.includes(step.id)
    );

    if (missingRequired) {
      return NextResponse.json(
        { error: "Responda todas as perguntas obrigatórias" },
        { status: 400 }
      );
    }

    // Atualiza o email e status da resposta
    await prisma.onboardingResponse.update({
      where: { id: response.id },
      data: {
        email,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Salva as respostas
    await prisma.onboardingAnswer.createMany({
      data: answers.map((answer: Answer) => ({
        responseId: response.id,
        stepId: answer.stepId,
        answer: answer.answer,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao submeter respostas:", error);
    return NextResponse.json(
      { error: "Erro ao submeter respostas" },
      { status: 500 }
    );
  }
} 