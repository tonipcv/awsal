import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/consultation-form/[doctorId] - Buscar formulário público do médico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;

    // Verificar se o médico existe
    const doctor = await prisma.user.findUnique({
      where: { 
        id: doctorId,
        role: 'DOCTOR'
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    // Buscar formulário ativo
    const form = await prisma.consultationForm.findUnique({
      where: { 
        doctorId,
        isActive: true
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado ou inativo' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Erro ao buscar formulário público:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 