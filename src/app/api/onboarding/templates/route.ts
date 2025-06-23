import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const templates = await prisma.onboardingTemplate.findMany({
      where: {
        doctorId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        doctorId: true,
        clinicId: true,
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
        createdAt: true,
        updatedAt: true,
        steps: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao buscar templates:", error);
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      steps,
      welcomeTitle,
      welcomeDescription,
      welcomeItems,
      estimatedTime,
      welcomeVideoUrl,
      welcomeButtonText,
      successTitle,
      successDescription,
      successVideoUrl,
      successButtonText,
      successButtonUrl,
      nextSteps,
      contactEmail,
      contactPhone,
    } = body;

    if (!name || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Cria o template
    const template = await prisma.onboardingTemplate.create({
      data: {
        name,
        description,
        doctorId: session.user.id,
        isActive: true,
        isPublic: false,
        welcomeTitle,
        welcomeDescription,
        welcomeItems: welcomeItems || [],
        estimatedTime,
        welcomeVideoUrl,
        welcomeButtonText,
        successTitle,
        successDescription,
        successVideoUrl,
        successButtonText,
        successButtonUrl,
        nextSteps: nextSteps || [],
        contactEmail,
        contactPhone,
        steps: {
          create: steps.map((step) => ({
            question: step.question,
            description: step.description,
            type: step.type,
            options: step.options,
            required: step.required,
            order: step.order,
            showToDoctor: true,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        doctorId: true,
        clinicId: true,
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
        createdAt: true,
        updatedAt: true,
        steps: true,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erro ao criar template:", error);
    return NextResponse.json(
      { error: "Erro ao criar template" },
      { status: 500 }
    );
  }
} 