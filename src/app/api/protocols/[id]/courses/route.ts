import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// GET /api/protocols/[id]/courses - Buscar cursos associados ao protocolo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const protocolId = resolvedParams.id;

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem visualizar cursos de protocolos.' }, { status: 403 });
    }

    // Verificar se o protocolo pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    const protocolCourses = await prisma.protocolCourse.findMany({
      where: {
        protocolId: protocolId
      },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: {
                  orderBy: {
                    orderIndex: 'asc'
                  }
                }
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    return NextResponse.json(protocolCourses);
  } catch (error) {
    console.error('Error fetching protocol courses:', error);
    return NextResponse.json({ error: 'Erro ao buscar cursos do protocolo' }, { status: 500 });
  }
}

// POST /api/protocols/[id]/courses - Adicionar curso ao protocolo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const protocolId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem adicionar cursos a protocolos.' }, { status: 403 });
    }

    const body = await request.json();
    const { courseId, orderIndex = 0, isRequired = true } = body;

    // Verificar se o protocolo pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Verificar se o curso pertence ao médico
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        doctorId: session.user.id
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
    }

    // Verificar se a associação já existe
    const existingAssociation = await prisma.protocolCourse.findFirst({
      where: {
        protocolId,
        courseId
      }
    });

    if (existingAssociation) {
      return NextResponse.json({ error: 'Curso já está associado a este protocolo' }, { status: 400 });
    }

    // Criar associação
    const protocolCourse = await prisma.protocolCourse.create({
      data: {
        protocolId,
        courseId,
        orderIndex,
        isRequired
      },
      include: {
        course: true
      }
    });

    return NextResponse.json(protocolCourse);
  } catch (error) {
    console.error('Error adding course to protocol:', error);
    return NextResponse.json({ error: 'Erro ao adicionar curso ao protocolo' }, { status: 500 });
  }
}

// PUT /api/protocols/[id]/courses - Atualizar cursos do protocolo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const protocolId = resolvedParams.id;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem atualizar cursos de protocolos.' }, { status: 403 });
    }

    const body = await request.json();
    const { courses } = body;

    // Verificar se o protocolo pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Remover todos os cursos existentes
    await prisma.protocolCourse.deleteMany({
      where: {
        protocolId: protocolId
      }
    });

    // Adicionar os novos cursos
    const protocolCourses = await prisma.protocolCourse.createMany({
      data: courses.map((course: any, index: number) => ({
        protocolId,
        courseId: course.courseId,
        orderIndex: course.orderIndex || index,
        isRequired: course.isRequired ?? true
      }))
    });

    // Buscar os cursos atualizados
    const updatedCourses = await prisma.protocolCourse.findMany({
      where: {
        protocolId: protocolId
      },
      include: {
        course: true
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    return NextResponse.json(updatedCourses);
  } catch (error) {
    console.error('Error updating protocol courses:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cursos do protocolo' }, { status: 500 });
  }
}

// DELETE /api/protocols/[id]/courses/[courseId] - Remover curso do protocolo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id: protocolId, courseId } = resolvedParams;
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem remover cursos de protocolos.' }, { status: 403 });
    }

    // Verificar se o protocolo pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado' }, { status: 404 });
    }

    // Remover associação
    await prisma.protocolCourse.delete({
      where: {
        protocolId_courseId: {
          protocolId,
          courseId
        }
      }
    });

    return NextResponse.json({ message: 'Curso removido do protocolo com sucesso' });
  } catch (error) {
    console.error('Error removing course from protocol:', error);
    return NextResponse.json({ error: 'Erro ao remover curso do protocolo' }, { status: 500 });
  }
} 