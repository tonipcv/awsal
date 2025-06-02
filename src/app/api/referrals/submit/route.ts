import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  generateUniqueReferralCode, 
  isExistingPatient, 
  getUserByReferralCode,
  REFERRAL_STATUS,
  CREDIT_STATUS,
  CREDIT_TYPE
} from '@/lib/referral-utils';
import { sendReferralNotification } from '@/lib/referral-email-service';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, doctorId, referrerCode } = body;

    // Validações básicas
    if (!name || !email || !doctorId) {
      return NextResponse.json(
        { error: 'Nome, email e médico são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Buscar médico
    const doctor = await prisma.user.findFirst({
      where: {
        id: doctorId,
        role: 'DOCTOR'
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Médico não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já é paciente existente
    const isExisting = await isExistingPatient(email, doctorId);
    if (isExisting) {
      return NextResponse.json(
        { error: 'Esta pessoa já é paciente deste médico' },
        { status: 400 }
      );
    }

    // Verificar se já existe indicação pendente
    const existingLead = await prisma.referralLead.findFirst({
      where: {
        email,
        doctorId,
        status: { in: ['PENDING', 'CONTACTED'] }
      }
    });

    if (existingLead) {
      return NextResponse.json(
        { error: 'Já existe uma indicação pendente para este email' },
        { status: 400 }
      );
    }

    // Buscar quem está indicando (se fornecido)
    let referrer = null;
    if (referrerCode) {
      referrer = await getUserByReferralCode(referrerCode);
      
      if (!referrer) {
        return NextResponse.json(
          { error: 'Código de indicação inválido' },
          { status: 400 }
        );
      }

      // Verificar se o referrer é paciente do mesmo médico
      if (referrer.doctorId !== doctorId) {
        return NextResponse.json(
          { error: 'Código de indicação não válido para este médico' },
          { status: 400 }
        );
      }
    }

    // Gerar código único para esta indicação
    let leadReferralCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      leadReferralCode = generateUniqueReferralCode();
      
      const existing = await prisma.referralLead.findFirst({
        where: { referralCode: leadReferralCode }
      });
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Erro interno: não foi possível gerar código único' },
        { status: 500 }
      );
    }

    // Criar a indicação
    const referralLead = await prisma.referralLead.create({
      data: {
        name,
        email,
        phone,
        referralCode: leadReferralCode!,
        status: REFERRAL_STATUS.PENDING,
        doctorId,
        referrerId: referrer?.id || null,
        source: 'referral_form'
      }
    });

    // Enviar notificações
    sendReferralNotification(referralLead.id).catch(error => {
      console.error('Erro ao enviar notificação de indicação:', error instanceof Error ? error.message : 'Erro desconhecido');
    });

    return NextResponse.json({
      success: true,
      message: 'Indicação enviada com sucesso!',
      referralCode: leadReferralCode,
      hasReferrer: !!referrer
    });

  } catch (error) {
    console.error('Erro ao processar indicação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 