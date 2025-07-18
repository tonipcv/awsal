import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const createReferralSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().nullable(),
  notes: z.string().nullable()
});

// POST /api/mobile/protocols/[protocolId]/referrals - Criar indicação de protocolo
export async function POST(
  request: NextRequest,
  { params }: { params: { protocolId: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verificar se o protocolo existe
    const protocol = await prisma.protocol.findUnique({
      where: {
        id: params.protocolId,
        isActive: true
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: {
                    name: true,
                    logo: true
                  }
                }
              },
              take: 1
            }
          }
        }
      }
    });

    if (!protocol) {
      return NextResponse.json(
        { error: 'Protocolo não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, notes } = createReferralSchema.parse(body);

    // Verificar se o email já existe como usuário
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Esta pessoa já possui uma conta no sistema' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma indicação pendente para este email e protocolo
    const existingReferral = await prisma.referrals.findFirst({
      where: {
        patientId: existingUser?.id,
        protocolId: params.protocolId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: 'Já existe uma indicação pendente deste protocolo para esta pessoa' },
        { status: 400 }
      );
    }

    // Criar a indicação
    const referral = await prisma.referrals.create({
      data: {
        patientId: existingUser?.id || user.id, // Se o usuário não existe, usa o ID do indicador temporariamente
        doctorId: protocol.doctor.id,
        protocolId: params.protocolId,
        status: 'PENDING',
        notes: notes || undefined,
        referral_type: 'PROTOCOL',
        priority: 'MEDIUM'
      }
    });

    // Se o usuário não existe, criar um lead
    if (!existingUser) {
      await prisma.referralLead.create({
        data: {
          name,
          email,
          phone: phone || undefined,
          notes: notes || undefined,
          referrerId: user.id,
          doctorId: protocol.doctor.id,
          status: 'PENDING',
          source: 'PROTOCOL_REFERRAL'
        }
      });
    }

    // Adicionar informações de debug em desenvolvimento
    const debug = process.env.NODE_ENV === 'development' ? {
      protocol: {
        id: protocol.id,
        name: protocol.name
      },
      doctor: {
        id: protocol.doctor.id,
        name: protocol.doctor.name
      },
      referrer: {
        id: user.id,
        email: user.email
      },
      referred: {
        exists: !!existingUser,
        email
      }
    } : undefined;

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        protocolId: referral.protocolId,
        status: referral.status,
        createdAt: referral.createdAt,
        patientEmail: email,
        patientName: name
      },
      message: 'Indicação de protocolo criada com sucesso!',
      debug
    });

  } catch (error: any) {
    console.error('Error in POST /api/mobile/protocols/[protocolId]/referrals:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error creating protocol referral' },
      { status: 500 }
    );
  }
} 