import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar todas as clínicas com detalhes
    const clinics = await prisma.clinic.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        subscription: {
          include: {
            plan: {
              select: {
                name: true,
                maxPatients: true,
                maxProtocols: true,
                maxCourses: true,
                maxProducts: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular estatísticas para cada clínica
    const clinicsWithStats = await Promise.all(
      clinics.map(async (clinic) => {
        const memberIds = clinic.members.map(m => m.user.id);
        
        const [protocolCount, patientCount, courseCount] = await Promise.all([
          prisma.protocol.count({
            where: { doctorId: { in: memberIds } }
          }),
          prisma.user.count({
            where: {
              role: 'PATIENT',
              doctorId: { in: memberIds }
            }
          }),
          prisma.course.count({
            where: { doctorId: { in: memberIds } }
          })
        ]);

        return {
          ...clinic,
          stats: {
            totalDoctors: clinic.members.length,
            totalPatients: patientCount,
            totalProtocols: protocolCount,
            totalCourses: courseCount
          }
        };
      })
    );

    return NextResponse.json({ clinics: clinicsWithStats });
  } catch (error) {
    console.error('Erro ao buscar clínicas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se é super admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { name, description, ownerEmail } = await request.json();

    if (!name || !ownerEmail) {
      return NextResponse.json({ error: 'Nome e email do proprietário são obrigatórios' }, { status: 400 });
    }

    // Verificar se o proprietário existe e é médico
    const owner = await prisma.user.findUnique({
      where: { email: ownerEmail }
    });

    if (!owner) {
      return NextResponse.json({ error: 'Médico proprietário não encontrado' }, { status: 404 });
    }

    if (owner.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Proprietário deve ser um médico' }, { status: 400 });
    }

    // Verificar se o médico já possui uma clínica
    const existingClinic = await prisma.clinic.findFirst({
      where: { ownerId: owner.id }
    });

    if (existingClinic) {
      return NextResponse.json({ error: 'Este médico já possui uma clínica' }, { status: 400 });
    }

    // Buscar plano padrão
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true }
    });

    if (!defaultPlan) {
      return NextResponse.json({ error: 'Plano padrão não encontrado' }, { status: 500 });
    }

    // Criar clínica
    const clinic = await prisma.clinic.create({
      data: {
        name,
        description,
        ownerId: owner.id
      }
    });

    // Criar subscription trial para a clínica
    const now = new Date();
    const trialDays = defaultPlan.trialDays || 7; // Default to 7 days if null
    await prisma.clinicSubscription.create({
      data: {
        clinicId: clinic.id,
        planId: defaultPlan.id,
        status: 'TRIAL',
        maxDoctors: 3, // Padrão para trial
        trialEndDate: new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({ 
      success: true, 
      clinic,
      message: 'Clínica criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar clínica:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 