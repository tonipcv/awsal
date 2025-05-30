import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

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

    // Gerar senha temporária se não fornecida
    const tempPassword = password || Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(tempPassword, 12);

    // Preparar dados do paciente
    const patientData: any = {
      name,
      email,
      password: hashedPassword,
      role: 'PATIENT',
      doctorId: session.user.id,
      emailVerified: new Date() // Auto-verificar para pacientes criados pelo médico
    };

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

    // TODO: Implementar envio de email com credenciais se sendCredentials for true
    if (sendCredentials) {
      console.log(`Credenciais para ${email}: ${tempPassword}`);
      // Aqui você implementaria o envio de email com as credenciais
    }

    return NextResponse.json({
      patient,
      temporaryPassword: sendCredentials ? tempPassword : undefined
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Erro ao criar paciente' }, { status: 500 });
  }
} 