import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserCreditsBalance } from '@/lib/referral-utils';

// GET - Dashboard do paciente (créditos, indicações, recompensas)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        role: true,
        doctorId: true,
        referralCode: true
      }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem acessar esta funcionalidade.' }, { status: 403 });
    }

    const userId = session.user.id;

    // Buscar saldo de créditos
    const creditsBalance = await getUserCreditsBalance(userId);

    // Buscar histórico de créditos
    const creditsHistory = await prisma.referralCredit.findMany({
      where: { userId },
      include: {
        lead: {
          select: { name: true, email: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Buscar indicações feitas pelo usuário
    const referralsMade = await prisma.referralLead.findMany({
      where: { referrerCode: user?.referralCode || '' },
      include: {
        doctor: {
          select: { id: true, name: true }
        },
        credits: {
          select: { id: true, amount: true, status: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Buscar recompensas disponíveis (do médico do paciente)
    let availableRewards: any[] = [];
    if (user?.doctorId) {
      availableRewards = await prisma.referralReward.findMany({
        where: {
          doctorId: user.doctorId,
          isActive: true
        },
        include: {
          _count: {
            select: { redemptions: true }
          }
        },
        orderBy: { creditsRequired: 'asc' }
      });
    }

    // Buscar histórico de resgates
    const redemptionsHistory = await prisma.rewardRedemption.findMany({
      where: { userId },
      include: {
        reward: {
          select: { title: true, description: true, creditsRequired: true }
        }
      },
      orderBy: { redeemedAt: 'desc' },
      take: 10
    });

    // Estatísticas
    const stats = {
      totalReferrals: referralsMade.length,
      convertedReferrals: referralsMade.filter(r => r.status === 'CONVERTED').length,
      totalCreditsEarned: creditsHistory.reduce((sum, credit) => sum + credit.amount, 0),
      totalCreditsUsed: redemptionsHistory.reduce((sum, redemption) => sum + redemption.creditsUsed, 0),
      currentBalance: creditsBalance
    };

    return NextResponse.json({
      stats,
      creditsBalance,
      creditsHistory,
      referralsMade,
      availableRewards,
      redemptionsHistory,
      doctorId: user?.doctorId,
      referralCode: user?.referralCode
    });

  } catch (error) {
    console.error('Erro ao buscar dados do paciente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Resgatar recompensa
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é paciente
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'PATIENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas pacientes podem resgatar recompensas.' }, { status: 403 });
    }

    const { rewardId } = await req.json();

    if (!rewardId) {
      return NextResponse.json(
        { error: 'ID da recompensa é obrigatório' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Buscar a recompensa
    const reward = await prisma.referralReward.findUnique({
      where: { id: rewardId },
      include: {
        _count: {
          select: { redemptions: true }
        }
      }
    });

    if (!reward) {
      return NextResponse.json(
        { error: 'Recompensa não encontrada' },
        { status: 404 }
      );
    }

    if (!reward.isActive) {
      return NextResponse.json(
        { error: 'Recompensa não está ativa' },
        { status: 400 }
      );
    }

    // Verificar se atingiu o limite
    if (reward.maxRedemptions && reward._count.redemptions >= reward.maxRedemptions) {
      return NextResponse.json(
        { error: 'Limite de resgates atingido para esta recompensa' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem créditos suficientes
    const creditsBalance = await getUserCreditsBalance(userId);
    if (creditsBalance < reward.creditsRequired) {
      return NextResponse.json(
        { error: `Créditos insuficientes. Você tem ${creditsBalance}, mas precisa de ${reward.creditsRequired}` },
        { status: 400 }
      );
    }

    // Verificar se o usuário já resgatou esta recompensa recentemente
    const recentRedemption = await prisma.rewardRedemption.findFirst({
      where: {
        userId,
        rewardId,
        redeemedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
        }
      }
    });

    if (recentRedemption) {
      return NextResponse.json(
        { error: 'Você já resgatou esta recompensa nas últimas 24 horas' },
        { status: 400 }
      );
    }

    // Criar o resgate
    const redemption = await prisma.rewardRedemption.create({
      data: {
        userId,
        rewardId,
        creditsUsed: reward.creditsRequired,
        status: 'PENDING'
      }
    });

    // Atualizar contador de resgates da recompensa
    await prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        currentRedemptions: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      redemption,
      message: 'Recompensa resgatada com sucesso! Aguarde a confirmação do seu médico.'
    });

  } catch (error) {
    console.error('Erro ao resgatar recompensa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 