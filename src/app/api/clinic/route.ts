import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserClinic, ensureDoctorHasClinic } from '@/lib/clinic-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas médicos podem acessar clínicas.' },
        { status: 403 }
      );
    }

    // Garantir que o médico tenha clínica (criar automaticamente se necessário)
    const result = await ensureDoctorHasClinic(session.user.id);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ clinic: result.clinic });

  } catch (error) {
    console.error('Erro ao buscar clínica:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 