import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { REFERRAL_STATUS, CREDIT_STATUS } from '@/lib/referral-utils';
import { sendCreditNotification } from '@/lib/referral-email-service';

// GET - Listar indicações do médico
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Filtros
    const where: any = {
      doctorId: session.user.id
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Buscar indicações
    const [leads, total] = await Promise.all([
      prisma.referralLead.findMany({
        where,
        include: {
          User_referral_leads_referrerIdToUser: {
            select: { id: true, name: true, email: true }
          },
          convertedUser: {
            select: { id: true, name: true, email: true }
          },
          referral_credits: {
            select: { id: true, amount: true, isUsed: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.referralLead.count({ where })
    ]);

    // Transformar dados para formato esperado pelo frontend
    const transformedLeads = leads.map(lead => ({
      ...lead,
      referrer: lead.User_referral_leads_referrerIdToUser,
      credits: lead.referral_credits.map(credit => ({
        id: credit.id,
        amount: credit.amount,
        status: credit.isUsed ? 'USED' : 'AVAILABLE'
      }))
    }));

    // Estatísticas
    const stats = await prisma.referralLead.groupBy({
      by: ['status'],
      where: { doctorId: session.user.id },
      _count: { id: true }
    });

    const statsFormatted = {
      total: total,
      pending: stats.find(s => s.status === 'PENDING')?._count.id || 0,
      contacted: stats.find(s => s.status === 'CONTACTED')?._count.id || 0,
      converted: stats.find(s => s.status === 'CONVERTED')?._count.id || 0,
      rejected: stats.find(s => s.status === 'REJECTED')?._count.id || 0
    };

    return NextResponse.json({
      leads: transformedLeads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statsFormatted
    });

  } catch (error) {
    console.error('Erro ao buscar indicações:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status de uma indicação
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { leadId, status, notes } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json(
        { error: 'leadId e status são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a indicação pertence ao médico
    const lead = await prisma.referralLead.findFirst({
      where: {
        id: leadId,
        doctorId: session.user.id
      },
      include: {
        User_referral_leads_referrerIdToUser: { select: { id: true, name: true, email: true } }
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Indicação não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar status
    const updatedLead = await prisma.referralLead.update({
      where: { id: leadId },
      data: {
        status,
        notes: notes || lead.notes,
        lastContactDate: new Date()
      }
    });

    // Se convertido para CONVERTED, criar crédito
    if (status === REFERRAL_STATUS.CONVERTED && lead.status !== REFERRAL_STATUS.CONVERTED) {
      // Verificar se já não existe crédito
      const existingCredit = await prisma.referralCredit.findFirst({
        where: { referralLeadId: leadId }
      });

      if (!existingCredit && lead.User_referral_leads_referrerIdToUser) {
        const credit = await prisma.referralCredit.create({
          data: {
            userId: lead.User_referral_leads_referrerIdToUser.id,
            referralLeadId: lead.id,
            amount: 1,
            type: 'SUCCESSFUL_REFERRAL',
            description: 'Crédito por indicação convertida'
          }
        });

        // Enviar notificação de crédito
        sendCreditNotification(credit.id).catch(error => {
          console.error('Erro ao enviar notificação de crédito:', error instanceof Error ? error.message : 'Erro desconhecido');
        });
      }
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead
    });

  } catch (error) {
    console.error('Erro ao atualizar indicação:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 