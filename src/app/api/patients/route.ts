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

    // Buscar pacientes através dos relacionamentos
    const relationships = await prisma.doctorPatientRelationship.findMany({
      where: {
        doctorId: session.user.id,
        isActive: true
      },
      include: {
        patient: {
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
            image: true,
            assignedProtocols: {
              where: {
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
            }
          }
        }
      }
    });

    // Transformar os relacionamentos em uma lista de pacientes
    const patients = relationships.map(rel => ({
      ...rel.patient,
      isPrimary: rel.isPrimary,
      speciality: rel.speciality,
      relationshipId: rel.id
    })).sort((a, b) => 
      (a.name || '').localeCompare(b.name || '')
    );

    return NextResponse.json(patients);
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

    const data = await request.json();
    const { email, ...patientData } = data;

    // Verificar se o email já existe
    const existingPatient = await prisma.user.findUnique({
      where: { email },
      include: {
        patientRelationships: {
          include: {
            doctor: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('🔍 Debug - Doctor trying to create patient:', {
      doctorId: session.user.id,
      doctorName: user.name,
      patientEmail: email
    });

    // Se o paciente já existe
    if (existingPatient) {
      console.log('🔍 Debug - Existing patient found:', {
        patientId: existingPatient.id,
        patientName: existingPatient.name,
        existingRelationships: existingPatient.patientRelationships.map(rel => ({
          doctorId: rel.doctorId,
          doctorName: rel.doctor.name,
          isPrimary: rel.isPrimary
        }))
      });

      // Verificar se já tem relacionamento com este médico específico
      const existingRelationshipWithThisDoctor = existingPatient.patientRelationships.find(
        rel => rel.doctorId === session.user.id
      );

      if (existingRelationshipWithThisDoctor) {
        console.log('❌ Patient already linked to this doctor');
        return NextResponse.json({ 
          error: `Este paciente já está vinculado a você. O relacionamento foi criado em ${existingRelationshipWithThisDoctor.createdAt.toLocaleDateString('pt-BR')}.` 
        }, { status: 400 });
      }

      console.log('✅ Creating new relationship for existing patient');

      // Se não tem relacionamento, criar um novo
      const result = await prisma.$transaction(async (tx) => {
        // Se o paciente já tem algum relacionamento primário, não definir o novo como primário
        const hasExistingPrimary = await tx.doctorPatientRelationship.findFirst({
          where: {
            patientId: existingPatient.id,
            isPrimary: true
          }
        });

        // Criar relacionamento médico-paciente
        const relationship = await tx.doctorPatientRelationship.create({
          data: {
            patientId: existingPatient.id,
            doctorId: session.user.id,
            isPrimary: !hasExistingPrimary // Será primário apenas se não houver outro primário
          }
        });

        // Buscar protocolos padrão do médico
        const doctorDefaultProtocols = await tx.doctorDefaultProtocol.findMany({
          where: { doctorId: session.user.id },
          include: { protocol: true }
        });

        // Atribuir protocolos padrão se existirem
        if (doctorDefaultProtocols.length > 0) {
          await tx.userProtocol.createMany({
            data: doctorDefaultProtocols.map((defaultProtocol: any) => ({
              userId: existingPatient.id,
              protocolId: defaultProtocol.protocol.id,
              status: 'UNAVAILABLE',
              startDate: new Date(),
              endDate: new Date(new Date().setDate(new Date().getDate() + (defaultProtocol.protocol.duration || 30)))
            }))
          });
        }

        return {
          ...existingPatient,
          relationship
        };
      });

      return NextResponse.json(result);
    }

    // Se o paciente não existe, criar novo
    const result = await prisma.$transaction(async (tx) => {
      // Preparar dados do paciente
      const newPatientData: any = {
        name: patientData.name,
        email: patientData.email,
        role: 'PATIENT',
        emailVerified: null, // Email will be verified after password setup
        ...patientData
      };

      // Criar paciente
      const newPatient = await tx.user.create({
        data: newPatientData,
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

      // Criar relacionamento médico-paciente
      const relationship = await tx.doctorPatientRelationship.create({
        data: {
          patientId: newPatient.id,
          doctorId: session.user.id,
          isPrimary: true // Primeiro médico será o primário
        }
      });

      // Buscar protocolos padrão do médico
      const doctorDefaultProtocols = await tx.doctorDefaultProtocol.findMany({
        where: { doctorId: session.user.id },
        include: { protocol: true }
      });

      // Atribuir protocolos padrão se existirem
      if (doctorDefaultProtocols.length > 0) {
        await tx.userProtocol.createMany({
          data: doctorDefaultProtocols.map((defaultProtocol: any) => ({
            userId: newPatient.id,
            protocolId: defaultProtocol.protocol.id,
            status: 'UNAVAILABLE',
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + (defaultProtocol.protocol.duration || 30)))
          }))
        });
      }

      return {
        ...newPatient,
        relationship
      };
    });

    // Gerar token de reset de senha
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Salvar token no banco
    await prisma.user.update({
      where: { id: result.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // URL para definir senha
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXTAUTH_URL || 
                   'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/set-password?token=${resetToken}`;

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
                      'CXLUS';

    // Verificar conexão SMTP
    await transporter.verify();

    // Enviar email
    await transporter.sendMail({
      from: {
        name: senderName,
        address: process.env.SMTP_FROM as string
      },
      to: result.email!,
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
                <h2 style="color: #000000; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Hello ${result.name},</h2>
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
                  <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${result.email}</p>
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
                <p style="color: #666666; font-size: 14px; margin: 0;">
                  CXLUS
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 });
  }
}