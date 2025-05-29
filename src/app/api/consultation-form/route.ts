import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/consultation-form - Buscar formulário do médico
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar.' }, { status: 403 });
    }

    // Buscar formulário existente
    const form = await prisma.consultationForm.findUnique({
      where: { doctorId: session.user.id }
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Erro ao buscar formulário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/consultation-form - Criar ou atualizar formulário
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é médico
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || user.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar.' }, { status: 403 });
    }

    const data = await request.json();

    // Validar dados obrigatórios
    if (!data.title || !data.description || !data.nameLabel || !data.emailLabel || !data.whatsappLabel) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 });
    }

    // Criar ou atualizar formulário
    const form = await prisma.consultationForm.upsert({
      where: { doctorId: session.user.id },
      update: {
        title: data.title,
        description: data.description,
        welcomeMessage: data.welcomeMessage || null,
        successMessage: data.successMessage,
        nameLabel: data.nameLabel,
        emailLabel: data.emailLabel,
        whatsappLabel: data.whatsappLabel,
        showAgeField: data.showAgeField,
        ageLabel: data.ageLabel,
        ageRequired: data.ageRequired,
        showSpecialtyField: data.showSpecialtyField,
        specialtyLabel: data.specialtyLabel,
        specialtyOptions: data.specialtyOptions || null,
        specialtyRequired: data.specialtyRequired,
        showMessageField: data.showMessageField,
        messageLabel: data.messageLabel,
        messageRequired: data.messageRequired,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        isActive: data.isActive,
        requireReferralCode: data.requireReferralCode,
        autoReply: data.autoReply,
        autoReplyMessage: data.autoReplyMessage || null,
      },
      create: {
        doctorId: session.user.id,
        title: data.title,
        description: data.description,
        welcomeMessage: data.welcomeMessage || null,
        successMessage: data.successMessage,
        nameLabel: data.nameLabel,
        emailLabel: data.emailLabel,
        whatsappLabel: data.whatsappLabel,
        showAgeField: data.showAgeField,
        ageLabel: data.ageLabel,
        ageRequired: data.ageRequired,
        showSpecialtyField: data.showSpecialtyField,
        specialtyLabel: data.specialtyLabel,
        specialtyOptions: data.specialtyOptions || null,
        specialtyRequired: data.specialtyRequired,
        showMessageField: data.showMessageField,
        messageLabel: data.messageLabel,
        messageRequired: data.messageRequired,
        primaryColor: data.primaryColor,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        isActive: data.isActive,
        requireReferralCode: data.requireReferralCode,
        autoReply: data.autoReply,
        autoReplyMessage: data.autoReplyMessage || null,
      }
    });

    return NextResponse.json(form);
  } catch (error) {
    console.error('Erro ao salvar formulário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 