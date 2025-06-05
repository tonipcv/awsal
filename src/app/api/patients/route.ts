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
                    email: true,
                    logo: true
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
          subject: `Welcome! Set Your Password - ${senderName}`,
          html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to Our Platform</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                
                <!-- Header with Clinic Logo -->
                <div style="background-color: #000000; padding: 40px 30px; text-align: center;">
                  ${doctorWithClinic?.clinicMemberships?.[0]?.clinic?.logo ? `
                    <img src="${doctorWithClinic.clinicMemberships[0].clinic.logo}" alt="${senderName}" style="max-height: 60px; max-width: 200px; margin-bottom: 20px; object-fit: contain;">
                  ` : `
                    <div style="margin-bottom: 20px;">
                      <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${senderName}</h2>
                    </div>
                  `}
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 400;">Welcome to ${senderName}!</h1>
                </div>

                <!-- Main Content -->
                <div style="padding: 40px 30px; background-color: #ffffff;">
                  <div style="margin-bottom: 30px;">
                    <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hello ${patient.name},</h2>
                    <p style="color: #666666; margin: 0 0 16px 0; font-size: 16px;">
                      Your doctor has created an account for you on our healthcare platform. To start using the system, you need to set your password.
                    </p>
                  </div>

                  <!-- Set Password Button -->
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${resetUrl}" 
                       style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 4px; font-weight: 600; font-size: 16px;">
                      Set My Password
                    </a>
                  </div>

                  <!-- Account Information -->
                  <div style="background-color: #f8f8f8; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #000000; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Your Account</h3>
                    <div style="color: #666666; font-size: 14px;">
                      <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${patient.email}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Healthcare Provider:</strong> ${user.name}</p>
                      <p style="margin: 0;"><strong>Clinic:</strong> ${senderName}</p>
                    </div>
                  </div>

                  <!-- Getting Started -->
                  <div style="background-color: #f8f8f8; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #000000; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Getting Started</h3>
                    <ul style="color: #666666; margin: 0; padding-left: 20px; font-size: 14px;">
                      <li style="margin-bottom: 8px;">Click the button above to set your password</li>
                      <li style="margin-bottom: 8px;">Once set, you can access your personalized healthcare dashboard</li>
                      <li>Your doctor will be able to monitor your progress and provide guidance</li>
                    </ul>
                  </div>

                  <!-- Important Notice -->
                  <div style="background-color: #f8f8f8; border-left: 4px solid #666666; padding: 20px; margin: 30px 0;">
                    <h3 style="color: #000000; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Important</h3>
                    <ul style="color: #666666; margin: 0; padding-left: 20px; font-size: 14px;">
                      <li style="margin-bottom: 8px;">This link is valid for 24 hours</li>
                      <li style="margin-bottom: 8px;">If you don't set your password within this time, please contact your doctor</li>
                      <li>Keep your login credentials secure and don't share them with others</li>
                    </ul>
                  </div>

                  <!-- Alternative Link -->
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="color: #000000; font-size: 14px; word-break: break-all; margin: 0;">
                      ${resetUrl}
                    </p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                  <div style="margin-bottom: 20px;">
                    <p style="color: #666666; font-size: 14px; margin: 0;">
                      This email was sent by <strong>${senderName}</strong>
                    </p>
                    <p style="color: #999999; font-size: 12px; margin: 8px 0 0 0;">
                      This is an automated message, please do not reply to this email.
                    </p>
                  </div>
                  
                  <!-- System Logo -->
                  <div style="padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #999999; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">
                      Powered by
                    </p>
                    <img src="${baseUrl}/logo.png" alt="CXLUS" style="height: 20px; opacity: 0.7;">
                  </div>
                </div>
              </div>
            </body>
            </html>
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