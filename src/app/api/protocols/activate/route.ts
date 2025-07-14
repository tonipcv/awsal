import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    // Buscar o paciente pelo token
    const patient = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token ainda válido
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    // Ativar todos os protocolos UNAVAILABLE do paciente
    const updatedProtocols = await prisma.userProtocol.updateMany({
      where: {
        userId: patient.id,
        status: 'UNAVAILABLE'
      },
      data: {
        status: 'ACTIVE',
        isActive: true
      }
    });

    // Limpar o token após uso
    await prisma.user.update({
      where: { id: patient.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Protocolos ativados com sucesso!',
      activatedCount: updatedProtocols.count
    });

  } catch (error) {
    console.error('Error activating protocols:', error);
    return NextResponse.json({ error: 'Erro ao ativar protocolos' }, { status: 500 });
  }
} 