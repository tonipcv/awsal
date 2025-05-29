import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const subscriptionId = resolvedParams.id;

    // Buscar a subscription
    const subscription = await prisma.doctorSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            maxPatients: true,
            maxProtocols: true,
            maxCourses: true,
            maxProducts: true,
            trialDays: true
          }
        }
      }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Erro ao buscar subscription:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const resolvedParams = await params;
    const subscriptionId = resolvedParams.id;
    const body = await request.json();
    const { planId, status, endDate, trialEndDate, autoRenew } = body;

    // Validações
    if (!planId || !status) {
      return NextResponse.json({ error: 'Plano e status são obrigatórios' }, { status: 400 });
    }

    // Verificar se o plano existe
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 400 });
    }

    // Verificar se a subscription existe
    const existingSubscription = await prisma.doctorSubscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Subscription não encontrada' }, { status: 404 });
    }

    // Preparar dados para atualização
    const updateData: any = {
      planId,
      status,
      autoRenew: autoRenew ?? true,
      updatedAt: new Date()
    };

    // Configurar datas baseado no status
    if (status === 'TRIAL') {
      if (trialEndDate) {
        updateData.trialEndDate = new Date(trialEndDate);
      }
      updateData.endDate = null;
    } else if (status === 'ACTIVE') {
      if (endDate) {
        updateData.endDate = new Date(endDate);
      }
      updateData.trialEndDate = null;
    } else {
      // Para outros status (SUSPENDED, CANCELLED, EXPIRED)
      updateData.endDate = null;
      updateData.trialEndDate = null;
    }

    // Atualizar a subscription
    const updatedSubscription = await prisma.doctorSubscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        plan: {
          select: {
            name: true,
            price: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription,
      message: 'Subscription atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar subscription:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 