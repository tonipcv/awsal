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

    const responses = await prisma.onboardingResponse.findMany({
      where: {
        template: {
          doctorId: session.user.id,
        },
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true,
            steps: {
              select: {
                id: true,
                question: true,
                description: true,
                type: true,
                required: true,
                order: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        answers: {
          select: {
            id: true,
            stepId: true,
            answer: true,
          },
          orderBy: {
            step: {
              order: "asc",
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("[RESPONSES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
} 