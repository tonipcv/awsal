import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/consultation-form/[doctorId] - Buscar formulário público do médico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;

    // Verificar se o médico existe
    const doctor = await prisma.user.findUnique({
      where: { 
        id: doctorId,
        role: 'DOCTOR'
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Médico não encontrado' }, { status: 404 });
    }

    // Buscar formulário ativo
    const form = await prisma.consultationForm.findUnique({
      where: { 
        doctorId,
        isActive: true
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado ou inativo' }, { status: 404 });
    }

    // Transformar para formato esperado pelo frontend
    const transformedForm = {
      ...form,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email
      },
      // Campos de compatibilidade com o frontend
      welcomeMessage: null,
      successMessage: form.thankYouMessage || 'Obrigado! Entraremos em contato em breve.',
      nameLabel: 'Nome completo',
      emailLabel: 'E-mail',
      whatsappLabel: 'WhatsApp',
      showAgeField: false,
      ageLabel: 'Idade',
      ageRequired: false,
      showSpecialtyField: false,
      specialtyLabel: 'Especialidade',
      specialtyOptions: null,
      specialtyRequired: false,
      showMessageField: true,
      messageLabel: 'Mensagem',
      messageRequired: false,
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      requireReferralCode: !form.allowAnonymous,
      autoReply: form.emailNotifications,
      autoReplyMessage: form.thankYouMessage || 'Recebemos sua solicitação e entraremos em contato em breve.'
    };

    return NextResponse.json(transformedForm);
  } catch (error) {
    console.error('Erro ao buscar formulário público:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 