import { prisma } from '@/lib/prisma';

// ========== TIPOS ==========
export interface ClinicWithDetails {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  ownerId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
  };
  members: {
    id: string;
    role: string;
    isActive: boolean;
    joinedAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
    };
  }[];
  subscription?: {
    id: string;
    status: string;
    maxDoctors: number;
    startDate: Date;
    endDate: Date | null;
    plan: {
      name: string;
      maxPatients: number | null;
      maxProtocols: number | null;
      maxCourses: number | null;
    };
  } | null;
}

export interface ClinicData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  logo?: string | null;
}

// ========== FUNÇÕES DE CLÍNICA ==========

/**
 * Buscar clínica do usuário (como owner ou membro)
 */
export async function getUserClinic(userId: string): Promise<ClinicWithDetails | null> {
  // Primeiro, verificar se é owner de alguma clínica
  let clinic = await prisma.clinic.findFirst({
    where: { ownerId: userId },
    include: {
      owner: {
        select: { id: true, name: true, email: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      },
      subscription: {
        include: {
          plan: {
            select: { name: true, maxPatients: true, maxProtocols: true, maxCourses: true }
          }
        }
      }
    }
  });

  // Se não é owner, verificar se é membro
  if (!clinic) {
    const membership = await prisma.clinicMember.findFirst({
      where: { 
        userId: userId,
        isActive: true 
      },
      include: {
        clinic: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true }
                }
              }
            },
            subscription: {
              include: {
                plan: {
                  select: { name: true, maxPatients: true, maxProtocols: true, maxCourses: true }
                }
              }
            }
          }
        }
      }
    });

    clinic = membership?.clinic || null;
  }

  return clinic;
}

/**
 * Verificar se usuário pode adicionar mais médicos na clínica
 */
export async function canAddDoctorToClinic(clinicId: string): Promise<boolean> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      subscription: true,
      members: {
        where: { isActive: true }
      }
    }
  });

  if (!clinic?.subscription) return false;

  const currentDoctors = clinic.members.length;
  return currentDoctors < clinic.subscription.maxDoctors;
}

/**
 * Verificar se usuário pode criar mais protocolos
 */
export async function canCreateProtocol(userId: string): Promise<boolean> {
  const clinic = await getUserClinic(userId);
  if (!clinic?.subscription) return false;

  // Contar protocolos criados por qualquer membro da clínica
  const memberIds = clinic.members.map(m => m.user.id);
  const protocolCount = await prisma.protocol.count({
    where: {
      doctorId: { in: memberIds }
    }
  });

  const maxProtocols = clinic.subscription.plan.maxProtocols ?? 0;
  return protocolCount < maxProtocols;
}

/**
 * Verificar se usuário pode adicionar mais pacientes
 */
export async function canAddPatient(userId: string): Promise<boolean> {
  const clinic = await getUserClinic(userId);
  if (!clinic?.subscription) return false;

  // Contar pacientes de todos os membros da clínica
  const memberIds = clinic.members.map(m => m.user.id);
  const patientCount = await prisma.user.count({
    where: {
      role: 'PATIENT',
      doctorId: { in: memberIds }
    }
  });

  const maxPatients = clinic.subscription.plan.maxPatients ?? 0;
  return patientCount < maxPatients;
}

/**
 * Adicionar médico à clínica
 */
export async function addDoctorToClinic(
  clinicId: string, 
  doctorEmail: string, 
  role: 'DOCTOR' | 'ADMIN' = 'DOCTOR'
): Promise<{ success: boolean; message: string; member?: any }> {
  try {
    // Verificar se pode adicionar mais médicos
    const canAdd = await canAddDoctorToClinic(clinicId);
    if (!canAdd) {
      return { success: false, message: 'Limite de médicos atingido para esta clínica' };
    }

    // Buscar o médico pelo email
    const doctor = await prisma.user.findUnique({
      where: { email: doctorEmail }
    });

    if (!doctor) {
      return { success: false, message: 'Médico não encontrado' };
    }

    if (doctor.role !== 'DOCTOR') {
      return { success: false, message: 'Usuário não é um médico' };
    }

    // Verificar se já é membro
    const existingMember = await prisma.clinicMember.findUnique({
      where: {
        clinicId_userId: {
          clinicId,
          userId: doctor.id
        }
      }
    });

    if (existingMember) {
      return { success: false, message: 'Médico já é membro desta clínica' };
    }

    // Adicionar como membro
    const member = await prisma.clinicMember.create({
      data: {
        clinicId,
        userId: doctor.id,
        role
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return { 
      success: true, 
      message: 'Médico adicionado com sucesso', 
      member 
    };

  } catch (error) {
    console.error('Erro ao adicionar médico à clínica:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}

/**
 * Remover médico da clínica
 */
export async function removeDoctorFromClinic(
  clinicId: string, 
  doctorId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar se é o owner da clínica
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    if (clinic?.ownerId === doctorId) {
      return { success: false, message: 'Não é possível remover o proprietário da clínica' };
    }

    // Remover membro
    await prisma.clinicMember.delete({
      where: {
        clinicId_userId: {
          clinicId,
          userId: doctorId
        }
      }
    });

    return { success: true, message: 'Médico removido com sucesso' };

  } catch (error) {
    console.error('Erro ao remover médico da clínica:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}

/**
 * Verificar se usuário é admin da clínica
 */
export async function isClinicAdmin(userId: string, clinicId?: string): Promise<boolean> {
  if (!clinicId) {
    const clinic = await getUserClinic(userId);
    clinicId = clinic?.id;
  }

  if (!clinicId) return false;

  // Verificar se é owner
  const clinic = await prisma.clinic.findFirst({
    where: { 
      id: clinicId,
      ownerId: userId 
    }
  });

  if (clinic) return true;

  // Verificar se é membro com role ADMIN
  const member = await prisma.clinicMember.findFirst({
    where: {
      clinicId,
      userId,
      role: 'ADMIN',
      isActive: true
    }
  });

  return !!member;
}

/**
 * Garantir que médico tenha clínica - criar automaticamente se necessário
 */
export async function ensureDoctorHasClinic(doctorId: string): Promise<{ success: boolean; clinic?: any; message: string }> {
  try {
    // Verificar se é médico
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return { success: false, message: 'Usuário não é um médico' };
    }

    // Verificar se já possui clínica (como owner OU como membro)
    const existingClinic = await getUserClinic(doctorId);
    if (existingClinic) {
      return { success: true, clinic: existingClinic, message: 'Médico já possui clínica' };
    }

    // Buscar plano padrão
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isDefault: true }
    });

    if (!defaultPlan) {
      return { success: false, message: 'Plano padrão não encontrado' };
    }

    // Criar clínica automática APENAS se não for membro de nenhuma clínica
    const clinic = await prisma.clinic.create({
      data: {
        name: `${doctor.name} Clinic`,
        description: `Personal clinic of ${doctor.name}`,
        ownerId: doctorId
      }
    });

    // Criar subscription trial para a clínica
    const now = new Date();
    const trialDays = defaultPlan.trialDays ?? 30; // Default to 30 days if null
    await prisma.clinicSubscription.create({
      data: {
        clinicId: clinic.id,
        planId: defaultPlan.id,
        status: 'TRIAL',
        maxDoctors: 3,
        trialEndDate: new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000)
      }
    });

    // Adicionar o médico como membro da própria clínica
    await prisma.clinicMember.create({
      data: {
        clinicId: clinic.id,
        userId: doctorId,
        role: 'ADMIN'
      }
    });

    // Buscar clínica completa para retornar
    const fullClinic = await getUserClinic(doctorId);

    return { 
      success: true, 
      clinic: fullClinic, 
      message: 'Clínica criada automaticamente com sucesso' 
    };

  } catch (error) {
    console.error('Erro ao garantir clínica para médico:', error);
    return { success: false, message: 'Erro interno do servidor' };
  }
}

/**
 * Obter estatísticas da clínica
 */
export async function getClinicStats(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      members: {
        where: { isActive: true },
        include: { user: true }
      }
    }
  });

  if (!clinic) return null;

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
    totalDoctors: clinic.members.length,
    totalProtocols: protocolCount,
    totalPatients: patientCount,
    totalCourses: courseCount
  };
}

// Função para gerar slug a partir do nome
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

// Função para garantir slug único
export async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.clinic.findFirst({
      where: {
        slug: slug,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Função para gerar slug único para uma clínica
export async function generateUniqueSlugForClinic(name: string, excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(name);
  return await ensureUniqueSlug(baseSlug, excludeId);
} 