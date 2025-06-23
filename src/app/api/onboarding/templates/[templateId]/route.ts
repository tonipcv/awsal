import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  context: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { templateId } = context.params;

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const template = await prisma.onboardingTemplate.findUnique({
      where: {
        id: templateId,
        doctorId: session.user.id,
      },
      include: {
        steps: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!template) {
      return new NextResponse("Template not found", { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[TEMPLATE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { templateId } = context.params;

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      steps, 
      isPublic, 
      isActive,
      // Welcome screen data
      welcomeTitle,
      welcomeDescription,
      welcomeVideoUrl,
      welcomeButtonText,
      // Success screen data
      successTitle,
      successDescription,
      successVideoUrl,
      successButtonText,
      successButtonUrl
    } = body;

    if (!name || !steps) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // First, verify the template exists and belongs to the doctor
    const existingTemplate = await prisma.onboardingTemplate.findUnique({
      where: {
        id: templateId,
        doctorId: session.user.id,
      },
    });

    if (!existingTemplate) {
      return new NextResponse("Template not found", { status: 404 });
    }

    // Update the template with type-safe fields
    const updatedTemplate = await prisma.onboardingTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        name,
        description,
        isPublic,
        isActive,
        // Welcome screen data
        welcomeItems: {
          set: [] // Reset the array since we're not using it anymore
        },
        welcomeTitle: welcomeTitle || null,
        welcomeDescription: welcomeDescription || null,
        welcomeVideoUrl: welcomeVideoUrl || null,
        welcomeButtonText: welcomeButtonText || null,
        // Success screen data
        nextSteps: {
          set: [] // Reset the array since we're not using it anymore
        },
        successTitle: successTitle || null,
        successDescription: successDescription || null,
        successVideoUrl: successVideoUrl || null,
        successButtonText: successButtonText || null,
        successButtonUrl: successButtonUrl || null,
        // Update steps
        steps: {
          deleteMany: {}, // Remove all existing steps
          create: steps.map((step: any, index: number) => ({
            question: step.question,
            description: step.description,
            type: step.type,
            options: step.options,
            required: step.required,
            order: index,
          })),
        },
      },
      include: {
        steps: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("[TEMPLATE_UPDATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 