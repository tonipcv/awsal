import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';

// DELETE /api/v2/patients/account - Deletar conta do paciente (versão simplificada)
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }
    
    // Buscar informações do usuário para o log
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!userInfo) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
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
    console.log(`Account deleted for user: ${user.id} (${userInfo.email}) at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Conta deletada com sucesso. Lamentamos vê-lo partir.'
    });

  } catch (error) {
    console.error('Error in DELETE /api/v2/patients/account:', error instanceof Error ? error.message : 'Unknown error');

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
