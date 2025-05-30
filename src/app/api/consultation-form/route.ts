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
      // Retornar um formulário padrão se não existir
      return NextResponse.json({
        id: null,
        doctorId: session.user.id,
        title: 'Formulário de Consulta',
        description: 'Preencha os dados abaixo para agendar sua consulta',
        fields: [],
        isActive: true,
        allowAnonymous: false,
        requireAuth: false,
        autoCreatePatient: true,
        emailNotifications: true,
        smsNotifications: false,
        thankYouMessage: 'Obrigado! Entraremos em contato em breve.',
        redirectUrl: null,
        customCss: null,
        // Campos de compatibilidade com o frontend
        welcomeMessage: null,
        successMessage: 'Obrigado! Entraremos em contato em breve.',
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
        requireReferralCode: false,
        autoReply: true,
        autoReplyMessage: 'Recebemos sua solicitação e entraremos em contato em breve.'
      });
    }

    // Transformar para formato esperado pelo frontend
    const transformedForm = {
      ...form,
      // Extrair campos do JSON fields para compatibilidade
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
      requireReferralCode: false,
      autoReply: form.emailNotifications,
      autoReplyMessage: form.thankYouMessage || 'Recebemos sua solicitação e entraremos em contato em breve.'
    };

    return NextResponse.json(transformedForm);
  } catch (error) {
    console.error('Erro ao buscar formulário:', error instanceof Error ? error.message : 'Erro desconhecido');
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
    if (!data.title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    // Criar campos baseados nos dados recebidos
    const fields = [];
    
    if (data.nameLabel) {
      fields.push({
        type: 'text',
        name: 'name',
        label: data.nameLabel,
        required: true,
        placeholder: 'Digite seu nome completo'
      });
    }
    
    if (data.emailLabel) {
      fields.push({
        type: 'email',
        name: 'email',
        label: data.emailLabel,
        required: true,
        placeholder: 'Digite seu e-mail'
      });
    }
    
    if (data.whatsappLabel) {
      fields.push({
        type: 'tel',
        name: 'whatsapp',
        label: data.whatsappLabel,
        required: true,
        placeholder: 'Digite seu WhatsApp'
      });
    }
    
    if (data.showAgeField) {
      fields.push({
        type: 'number',
        name: 'age',
        label: data.ageLabel || 'Idade',
        required: data.ageRequired || false,
        placeholder: 'Digite sua idade'
      });
    }
    
    if (data.showSpecialtyField) {
      fields.push({
        type: 'select',
        name: 'specialty',
        label: data.specialtyLabel || 'Especialidade',
        required: data.specialtyRequired || false,
        options: data.specialtyOptions || []
      });
    }
    
    if (data.showMessageField) {
      fields.push({
        type: 'textarea',
        name: 'message',
        label: data.messageLabel || 'Mensagem',
        required: data.messageRequired || false,
        placeholder: 'Digite sua mensagem'
      });
    }

    // Criar ou atualizar formulário
    const form = await prisma.consultationForm.upsert({
      where: { doctorId: session.user.id },
      update: {
        title: data.title,
        description: data.description || null,
        fields: fields,
        isActive: data.isActive !== undefined ? data.isActive : true,
        allowAnonymous: !data.requireReferralCode,
        requireAuth: false,
        autoCreatePatient: true,
        emailNotifications: data.autoReply !== undefined ? data.autoReply : true,
        smsNotifications: false,
        thankYouMessage: data.successMessage || data.autoReplyMessage || 'Obrigado! Entraremos em contato em breve.',
        redirectUrl: null,
        customCss: data.primaryColor || data.backgroundColor || data.textColor ? 
          `:root { --primary-color: ${data.primaryColor || '#3B82F6'}; --bg-color: ${data.backgroundColor || '#FFFFFF'}; --text-color: ${data.textColor || '#1F2937'}; }` : 
          null
      },
      create: {
        doctorId: session.user.id,
        title: data.title,
        description: data.description || null,
        fields: fields,
        isActive: data.isActive !== undefined ? data.isActive : true,
        allowAnonymous: !data.requireReferralCode,
        requireAuth: false,
        autoCreatePatient: true,
        emailNotifications: data.autoReply !== undefined ? data.autoReply : true,
        smsNotifications: false,
        thankYouMessage: data.successMessage || data.autoReplyMessage || 'Obrigado! Entraremos em contato em breve.',
        redirectUrl: null,
        customCss: data.primaryColor || data.backgroundColor || data.textColor ? 
          `:root { --primary-color: ${data.primaryColor || '#3B82F6'}; --bg-color: ${data.backgroundColor || '#FFFFFF'}; --text-color: ${data.textColor || '#1F2937'}; }` : 
          null
      }
    });

    // Transformar resposta para formato esperado
    const transformedForm = {
      ...form,
      welcomeMessage: data.welcomeMessage,
      successMessage: form.thankYouMessage,
      nameLabel: data.nameLabel,
      emailLabel: data.emailLabel,
      whatsappLabel: data.whatsappLabel,
      showAgeField: data.showAgeField,
      ageLabel: data.ageLabel,
      ageRequired: data.ageRequired,
      showSpecialtyField: data.showSpecialtyField,
      specialtyLabel: data.specialtyLabel,
      specialtyOptions: data.specialtyOptions,
      specialtyRequired: data.specialtyRequired,
      showMessageField: data.showMessageField,
      messageLabel: data.messageLabel,
      messageRequired: data.messageRequired,
      primaryColor: data.primaryColor,
      backgroundColor: data.backgroundColor,
      textColor: data.textColor,
      requireReferralCode: !form.allowAnonymous,
      autoReply: form.emailNotifications,
      autoReplyMessage: form.thankYouMessage
    };

    return NextResponse.json(transformedForm);
  } catch (error) {
    console.error('Erro ao salvar formulário:', error instanceof Error ? error.message : 'Erro desconhecido');
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 