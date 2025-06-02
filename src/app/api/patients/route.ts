import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configuração do transporter de email
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
  console.warn('Missing SMTP configuration environment variables');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false, // false para porta 2525 do SendPulse
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// GET /api/patients - Listar pacientes do médico
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem acessar lista de pacientes.' }, { status: 403 });
    }

    const patients = await prisma.user.findMany({
      where: {
        doctorId: session.user.id,
        role: 'PATIENT'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        medicalHistory: true,
        allergies: true,
        medications: true,
        notes: true,
        emailVerified: true,
        image: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Buscar protocolos ativos para cada paciente separadamente
    const patientsWithProtocols = await Promise.all(
      patients.map(async (patient) => {
        const activeProtocols = await prisma.userProtocol.findMany({
          where: {
            userId: patient.id,
            isActive: true
          },
          include: {
            protocol: {
              select: {
                id: true,
                name: true,
                duration: true
              }
            }
          }
        });

        return {
          ...patient,
          assignedProtocols: activeProtocols
        };
      })
    );

    return NextResponse.json(patientsWithProtocols);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Erro ao buscar pacientes' }, { status: 500 });
  }
}

// POST /api/patients - Criar novo paciente
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
      return NextResponse.json({ error: 'Acesso negado. Apenas médicos podem criar pacientes.' }, { status: 403 });
    }

    const { 
      name, 
      email, 
      password, 
      sendCredentials,
      phone,
      birthDate,
      gender,
      address,
      emergencyContact,
      emergencyPhone,
      medicalHistory,
      allergies,
      medications,
      notes
    } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    // Validações adicionais
    if (phone && !/^[\d\s\(\)\-\+]+$/.test(phone)) {
      return NextResponse.json({ error: 'Formato de telefone inválido' }, { status: 400 });
    }

    if (emergencyPhone && !/^[\d\s\(\)\-\+]+$/.test(emergencyPhone)) {
      return NextResponse.json({ error: 'Formato de telefone de emergência inválido' }, { status: 400 });
    }

    if (gender && !['M', 'F', 'Outro'].includes(gender)) {
      return NextResponse.json({ error: 'Gênero deve ser M, F ou Outro' }, { status: 400 });
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 400 });
    }

    // Preparar dados do paciente
    const patientData: any = {
      name,
      email,
      role: 'PATIENT',
      doctorId: session.user.id,
      emailVerified: sendCredentials ? null : new Date() // Only auto-verify if not sending credentials
    };

    // Only set password if sendCredentials is false (manual password setup)
    if (!sendCredentials) {
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await hash(tempPassword, 12);
      patientData.password = hashedPassword;
    }

    // Adicionar campos opcionais se fornecidos
    if (phone) patientData.phone = phone;
    if (birthDate) patientData.birthDate = new Date(birthDate);
    if (gender) patientData.gender = gender;
    if (address) patientData.address = address;
    if (emergencyContact) patientData.emergencyContact = emergencyContact;
    if (emergencyPhone) patientData.emergencyPhone = emergencyPhone;
    if (medicalHistory) patientData.medicalHistory = medicalHistory;
    if (allergies) patientData.allergies = allergies;
    if (medications) patientData.medications = medications;
    if (notes) patientData.notes = notes;

    // Criar paciente
    const patient = await prisma.user.create({
      data: patientData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        gender: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        emailVerified: true,
        image: true
      }
    });

    console.log('🔍 DEBUG API: Created patient:', patient);
    console.log('🔍 DEBUG API: Patient email:', patient.email);
    console.log('🔍 DEBUG API: Send credentials:', sendCredentials);

    // Enviar email com credenciais se sendCredentials for true
    if (sendCredentials) {
      try {
        // Gerar token de reset de senha
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        // Salvar token no banco
        await prisma.user.update({
          where: { id: patient.id },
          data: {
            resetToken,
            resetTokenExpiry
          }
        });

        // URL para definir senha
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.NEXTAUTH_URL || 
                       'http://localhost:3000';
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

        // Buscar informações da clínica do médico para personalizar o email
        const doctorWithClinic = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              },
              take: 1
            }
          }
        });

        // Determinar nome do remetente (clínica ou médico)
        const senderName = doctorWithClinic?.clinicMemberships?.[0]?.clinic?.name || 
                          user.name || 
                          'BOOP';

        // Verificar conexão SMTP
        await transporter.verify();
        console.log('SMTP connection verified for patient creation');

        // Enviar email
        await transporter.sendMail({
          from: {
            name: senderName,
            address: process.env.SMTP_FROM as string
          },
          to: patient.email!,
          subject: `Bem-vindo! Defina sua senha de acesso - ${senderName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1e293b; text-align: center; margin-bottom: 30px;">Bem-vindo ao ${senderName}!</h1>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Olá <strong>${patient.name}</strong>,
              </p>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Seu médico criou uma conta para você em nossa plataforma. Para começar a usar o sistema, você precisa definir sua senha.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 15px 30px; background-color: #5154e7; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  Definir Minha Senha
                </a>
              </div>
              
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #059669; margin: 0 0 10px 0;">📋 Sua Conta</h3>
                <p style="color: #475569; margin: 0; font-size: 14px;">
                  <strong>Email:</strong> ${patient.email}<br>
                  <strong>Médico:</strong> ${user.name}<br>
                  <strong>Clínica:</strong> ${senderName}
                </p>
              </div>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                <strong>Importante:</strong> Este link é válido por 24 horas. Se você não definir sua senha dentro deste prazo, será necessário solicitar um novo link ao seu médico.
              </p>
              
              <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
                Se você não solicitou esta conta, pode ignorar este email com segurança.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                ${senderName} - Plataforma Médica<br>
                Este é um email automático, não responda.
              </p>
            </div>
          `
        });
        
        console.log(`✅ Email de credenciais enviado para ${patient.email} em nome de ${senderName}`);
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de credenciais:', emailError);
        // Não falhar a criação do paciente se o email falhar
        console.log(`⚠️ Paciente criado mas email não foi enviado para ${patient.email}`);
      }
    }

    const responseData = {
      patient,
      email: patient.email, // Explicitly include email in response
      sendCredentials: sendCredentials
    };
    
    console.log('🔍 DEBUG API: Response data:', responseData);

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 });
  }
} 