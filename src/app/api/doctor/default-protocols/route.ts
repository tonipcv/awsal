import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/doctor/default-protocols - Buscar protocolos padrão do médico
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar protocolos padrão.' }, { status: 403 });
    }

    // Buscar protocolos padrão do médico
    const defaultProtocols = await prisma.doctorDefaultProtocol.findMany({
      where: { doctorId: session.user.id },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true
          }
        }
      }
    });

    return NextResponse.json(defaultProtocols);
  } catch (error) {
    console.error('Error fetching default protocols:', error);
    return NextResponse.json({ error: 'Erro ao buscar protocolos padrão' }, { status: 500 });
  }
}

// POST /api/doctor/default-protocols - Adicionar protocolo padrão
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem gerenciar protocolos padrão.' }, { status: 403 });
    }

    const { protocolId } = await request.json();

    if (!protocolId) {
      return NextResponse.json({ error: 'ID do protocolo é obrigatório' }, { status: 400 });
    }

    // Verificar se o protocolo pertence ao médico
    const protocol = await prisma.protocol.findFirst({
      where: {
        id: protocolId,
        doctorId: session.user.id
      }
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocolo não encontrado ou não pertence ao médico' }, { status: 404 });
    }

    // Verificar se já existe
    const existing = await prisma.doctorDefaultProtocol.findUnique({
      where: {
        doctorId_protocolId: {
          doctorId: session.user.id,
          protocolId: protocolId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Este protocolo já está configurado como padrão' }, { status: 400 });
    }

    // Criar protocolo padrão
    const defaultProtocol = await prisma.doctorDefaultProtocol.create({
      data: {
        doctorId: session.user.id,
        protocolId: protocolId
      },
      include: {
        protocol: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true
          }
        }
      }
    });

    return NextResponse.json(defaultProtocol, { status: 201 });
  } catch (error) {
    console.error('Error creating default protocol:', error);
    return NextResponse.json({ error: 'Erro ao adicionar protocolo padrão' }, { status: 500 });
  }
}

// DELETE /api/doctor/default-protocols - Remover protocolo padrão
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem gerenciar protocolos padrão.' }, { status: 403 });
    }

    const { protocolId } = await request.json();

    if (!protocolId) {
      return NextResponse.json({ error: 'ID do protocolo é obrigatório' }, { status: 400 });
    }

    // Verificar se existe
    const existing = await prisma.doctorDefaultProtocol.findUnique({
      where: {
        doctorId_protocolId: {
          doctorId: session.user.id,
          protocolId: protocolId
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Protocolo padrão não encontrado' }, { status: 404 });
    }

    // Remover protocolo padrão
    await prisma.doctorDefaultProtocol.delete({
      where: {
        doctorId_protocolId: {
          doctorId: session.user.id,
          protocolId: protocolId
        }
      }
    });

    return NextResponse.json({ message: 'Protocolo padrão removido com sucesso' });
  } catch (error) {
    console.error('Error deleting default protocol:', error);
    return NextResponse.json({ error: 'Erro ao remover protocolo padrão' }, { status: 500 });
  }
} 