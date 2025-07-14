import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { createSetPasswordEmail } from '@/email-templates/auth/set-password';
import { createId } from '@paralleldrive/cuid2';

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
      // Preparar dados do paciente (remover protocolIds que não existe no modelo)
      const newPatientData = {
        id: createId(),
        name: patientData.name,
        email: email,
        role: 'PATIENT',
        emailVerified: null, // Email will be verified after password setup
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

      // Atribuir protocolos selecionados se houver
      if (patientData.protocolIds && patientData.protocolIds.length > 0) {
        const protocolAssignments = patientData.protocolIds.map((protocolId: string) => ({
          userId: newPatient.id,
          protocolId: protocolId,
          startDate: new Date(),
          endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 dias padrão
          status: 'UNAVAILABLE', // Inicialmente indisponível
          isActive: true
        }));

        await tx.userProtocol.createMany({
          data: protocolAssignments
        });
      }

      // Buscar protocolos padrão do médico se não houver protocolos selecionados
      if (!patientData.protocolIds || patientData.protocolIds.length === 0) {
        const doctorDefaultProtocols = await tx.doctorDefaultProtocol.findMany({
          where: { doctorId: session.user.id },
          include: { protocol: true }
        });

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

    // Gerar o HTML do email usando o template
    const html = createSetPasswordEmail({
      name: result.name || 'Patient',
      email: result.email || '',
      resetUrl,
      doctorName: user.name || undefined,
      clinicName: senderName,
      clinicLogo: doctorWithClinic?.clinicMemberships?.[0]?.clinic?.logo || undefined
    });

    // Enviar email
    await transporter.sendMail({
      from: {
        name: 'Cxlus',
        address: process.env.SMTP_FROM as string
      },
      to: result.email!,
      subject: `${user.name || 'Your doctor'} invited you to Cxlus`,
      html
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 });
  }
}