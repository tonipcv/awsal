import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// POST /api/consultation-submission - Enviar formulário de consulta
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      formId, 
      doctorId, 
      name, 
      email, 
      whatsapp, 
      age, 
      specialty, 
      message, 
      referralCode 
    } = data;

    // Validar dados obrigatórios
    if (!formId || !doctorId || !name || !email || !whatsapp) {
      return NextResponse.json({ error: 'Dados obrigatórios não preenchidos' }, { status: 400 });
    }

    // Verificar se o formulário existe e está ativo
    const form = await prisma.consultationForm.findUnique({
      where: { 
        id: formId,
        doctorId,
        isActive: true
      },
      include: {
        doctor: true
      }
    });

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado ou inativo' }, { status: 404 });
    }

    // Verificar código de indicação se fornecido
    let referrer = null;
    if (referralCode) {
      referrer = await prisma.user.findUnique({
        where: { referralCode }
      });

      if (!referrer && form.requireReferralCode) {
        return NextResponse.json({ error: 'Código de indicação inválido' }, { status: 400 });
      }
    }

    // Obter IP e User Agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Criar submissão
    const submission = await prisma.consultationSubmission.create({
      data: {
        formId,
        name,
        email,
        whatsapp,
        age: age || null,
        specialty: specialty || null,
        message: message || null,
        referralCode: referralCode || null,
        ipAddress,
        userAgent,
        status: 'NEW'
      }
    });

    // Enviar email para o médico
    try {
      const doctorEmailSubject = `Nova solicitação de consulta - ${name}`;
      const doctorEmailBody = `
        <h2>Nova Solicitação de Consulta</h2>
        <p>Você recebeu uma nova solicitação de consulta através do seu formulário online.</p>
        
        <h3>Dados do Paciente:</h3>
        <ul>
          <li><strong>Nome:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>WhatsApp:</strong> ${whatsapp}</li>
          ${age ? `<li><strong>Idade:</strong> ${age} anos</li>` : ''}
          ${specialty ? `<li><strong>Especialidade:</strong> ${specialty}</li>` : ''}
          ${message ? `<li><strong>Mensagem:</strong> ${message}</li>` : ''}
          ${referralCode ? `<li><strong>Indicado por:</strong> ${referrer?.name || 'Código: ' + referralCode}</li>` : ''}
        </ul>
        
        <p>Entre em contato com o paciente o mais breve possível para agendar a consulta.</p>
        
        <p><strong>Data da solicitação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: form.doctor.email!,
        subject: doctorEmailSubject,
        html: doctorEmailBody
      });
    } catch (emailError) {
      console.error('Erro ao enviar email para o médico:', emailError);
    }

    // Enviar resposta automática se configurada
    if (form.autoReply && form.autoReplyMessage) {
      try {
        const patientEmailSubject = `Confirmação de solicitação de consulta - ${form.doctor.name}`;
        const patientEmailBody = `
          <h2>Obrigado por sua solicitação!</h2>
          <p>Olá ${name},</p>
          
          <p>${form.autoReplyMessage}</p>
          
          <h3>Resumo da sua solicitação:</h3>
          <ul>
            <li><strong>Médico:</strong> ${form.doctor.name}</li>
            <li><strong>Data da solicitação:</strong> ${new Date().toLocaleString('pt-BR')}</li>
            ${specialty ? `<li><strong>Especialidade:</strong> ${specialty}</li>` : ''}
          </ul>
          
          <p>Em breve entraremos em contato através do WhatsApp: ${whatsapp}</p>
          
          <p>Atenciosamente,<br>Equipe ${form.doctor.name}</p>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: email,
          subject: patientEmailSubject,
          html: patientEmailBody
        });
      } catch (emailError) {
        console.error('Erro ao enviar resposta automática:', emailError);
      }
    }

    // Se há código de indicação válido, criar crédito para o indicador
    if (referrer) {
      try {
        await prisma.referralCredit.create({
          data: {
            userId: referrer.id,
            amount: 1,
            type: 'CONSULTATION_REFERRAL',
            status: 'PENDING'
          }
        });
      } catch (creditError) {
        console.error('Erro ao criar crédito de indicação:', creditError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      submissionId: submission.id,
      message: 'Formulário enviado com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao processar submissão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 