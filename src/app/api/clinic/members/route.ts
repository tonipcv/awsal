import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserClinic, addDoctorToClinic, isClinicAdmin } from '@/lib/clinic-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { email, role = 'DOCTOR' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar clínica do usuário
    const clinic = await getUserClinic(session.user.id);
    
    if (!clinic) {
      return NextResponse.json(
        { error: 'Clínica não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se é admin da clínica
    const isAdmin = await isClinicAdmin(session.user.id, clinic.id);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem adicionar membros' },
        { status: 403 }
      );
    }

    // Adicionar médico à clínica
    const result = await addDoctorToClinic(clinic.id, email, role);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: result.message,
      member: result.member 
    });

  } catch (error) {
    console.error('Erro ao adicionar membro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 