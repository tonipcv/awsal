import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { z } from 'zod';

const createReferralSchema = z.object({
  prescriptionId: z.string().min(1, 'ID da prescrição é obrigatório'),
  notes: z.string().optional(),
  indicatedPatient: z.object({
    name: z.string().min(1, 'Nome do paciente indicado é obrigatório'),
    email: z.string().email('Email do paciente indicado é inválido'),
    phone: z.string().min(1, 'Telefone do paciente indicado é obrigatório')
  })
});

// GET /api/v2/patients/referrals - Listar indicações
export async function GET(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Buscar indicações do usuário
    const referrals = await prisma.referrals.findMany({
      where: {
        patientId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        protocol: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      referrals: referrals.map(ref => ({
        id: ref.id,
        protocolId: ref.protocolId,
        protocolName: ref.protocol?.name,
        status: ref.status,
        createdAt: ref.createdAt,
        validUntil: ref.valid_until
      })),
      total: referrals.length,
      message: 'Indicações carregadas com sucesso'
    });
  } catch (error) {
    console.error('Error in GET /api/v2/patients/referrals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v2/patients/referrals - Criar indicação
export async function POST(request: NextRequest) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validatedData = createReferralSchema.parse(body);

    // Verificar se a prescrição existe e está ativa ou prescrita
    const prescription = await prisma.protocolPrescription.findFirst({
      where: {
        id: validatedData.prescriptionId,
        user_id: user.id,
        status: { in: ['ACTIVE', 'PRESCRIBED'] },
        abandoned_at: null,
        paused_at: null
      },
      include: {
        protocol: true
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescrição não encontrada ou não está ativa.' },
        { status: 403 }
      );
    }

    // Verificar se o email já existe como usuário
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.indicatedPatient.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Esta pessoa já possui uma conta no sistema' },
        { status: 400 }
      );
    }

    // Verificar se já existe uma indicação pendente para este email
    const existingLead = await prisma.referralLead.findFirst({
      where: {
        email: validatedData.indicatedPatient.email,
        status: { in: ['PENDING', 'CONTACTED'] }
      }
    });

    if (existingLead) {
      return NextResponse.json(
        { error: 'Já existe uma indicação pendente para este email' },
        { status: 400 }
      );
    }

    // Criar o lead primeiro
    const lead = await prisma.referralLead.create({
      data: {
        name: validatedData.indicatedPatient.name,
        email: validatedData.indicatedPatient.email,
        phone: validatedData.indicatedPatient.phone,
        status: 'PENDING',
        source: 'PATIENT_REFERRAL',
        referrerId: user.id,
        doctorId: prescription.prescribed_by,
        notes: validatedData.notes
      }
    });

    // Criar a indicação
    const referral = await prisma.referrals.create({
      data: {
        patientId: user.id,
        doctorId: prescription.prescribed_by,
        protocolId: prescription.protocol_id,
        status: 'PENDING',
        referral_type: 'PROTOCOL',
        priority: 'MEDIUM',
        notes: validatedData.notes || undefined,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      },
      include: {
        User_referrals_patientIdToUser: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      referral: {
        id: referral.id,
        protocolId: referral.protocolId,
        protocolName: prescription.protocol.name,
        status: referral.status,
        createdAt: referral.createdAt,
        validUntil: referral.valid_until,
        patient: {
          name: referral.User_referrals_patientIdToUser.name,
          email: referral.User_referrals_patientIdToUser.email,
          phone: referral.User_referrals_patientIdToUser.phone
        },
        indicatedPatient: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone
        }
      },
      message: 'Indicação criada com sucesso'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/v2/patients/referrals:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 