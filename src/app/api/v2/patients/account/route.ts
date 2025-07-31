import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE_MY_ACCOUNT', {
    errorMap: () => ({ message: 'Confirmação obrigatória: "DELETE_MY_ACCOUNT"' })
  }),
  password: z.string().min(1, 'Senha é obrigatória para confirmar a exclusão')
});

// DELETE /api/v2/patients/account - Deletar conta do paciente
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validatedData = deleteAccountSchema.parse(body);

    // Verificar se a senha está correta
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        password: true,
        email: true,
        name: true
      }
    });

    if (!userWithPassword) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar senha (assumindo que você tem uma função de verificação de senha)
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(validatedData.password, userWithPassword.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Realizar soft delete ou hard delete dependendo da política da empresa
    // Aqui vou fazer um soft delete marcando o usuário como inativo
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_active: false,
        // Anonimizar dados sensíveis
        email: `deleted_${user.id}@deleted.com`,
        name: 'Conta Deletada',
        phone: null,
        address: null,
        image: null,
      }
    });

    // Opcional: Deletar dados relacionados ou marcar como inativos
    // Exemplo: prescrições, check-ins, etc.
    // Desativar prescrições de protocolo
    try {
      await prisma.$executeRaw`UPDATE protocol_prescription SET is_active = false WHERE user_id = ${user.id}`;
    } catch (err) {
      console.warn('Failed to update protocol prescriptions:', err instanceof Error ? err.message : 'Unknown error');
    }

    // Desativar respostas de check-in
    try {
      await prisma.$executeRaw`UPDATE daily_checkin_response SET is_active = false WHERE user_id = ${user.id}`;
    } catch (err) {
      console.warn('Failed to update checkin responses:', err instanceof Error ? err.message : 'Unknown error');
    }

    // Log da exclusão para auditoria
    console.log(`Account deleted for user: ${user.id} (${userWithPassword.email}) at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Conta deletada com sucesso. Lamentamos vê-lo partir.'
    });

  } catch (error) {
    console.error('Error in DELETE /api/v2/patients/account:', error instanceof Error ? error.message : 'Unknown error');

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/v2/patients/account - Obter informações da conta para confirmação de exclusão
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const accountInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true
      }
    });
    
    // Buscar contagens separadamente
    const activePrescriptionsCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM protocol_prescription 
      WHERE user_id = ${user.id} AND is_active = true
    `;
    
    const totalCheckinsCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM daily_checkin_response 
      WHERE user_id = ${user.id}
    `;

    if (!accountInfo) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      account: {
        id: accountInfo.id,
        name: accountInfo.name,
        email: accountInfo.email,
        memberSince: accountInfo.created_at,
        activePrescriptions: Number(activePrescriptionsCount[0]?.count || 0),
        totalCheckins: Number(totalCheckinsCount[0]?.count || 0),
      },
      message: 'Informações da conta obtidas com sucesso'
    });

  } catch (error) {
    console.error('Error in GET /api/v2/patients/account:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
