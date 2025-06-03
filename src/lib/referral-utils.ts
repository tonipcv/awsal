import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Gera um código único para indicação
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gera código único para nova indicação
 */
export function generateUniqueReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gera link de indicação para médico
 */
export function generateDoctorReferralLink(doctorId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/referral/${doctorId}`;
}

/**
 * Gera link de indicação personalizado para paciente
 */
export function generatePatientReferralLink(doctorId: string, patientEmail: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/referral/${doctorId}?ref=${encodeURIComponent(patientEmail)}`;
}

/**
 * Calcula o saldo de créditos de um usuário
 */
export async function getUserCreditsBalance(userId: string): Promise<number> {
  const credits = await prisma.referralCredit.findMany({
    where: {
      userId,
      isUsed: false // Apenas créditos não utilizados
    }
  });

  const totalEarned = credits.reduce((sum, credit) => sum + Number(credit.amount), 0);

  return totalEarned;
}

/**
 * Verifica se um email já é paciente de um médico
 */
export async function isExistingPatient(email: string, doctorId: string): Promise<boolean> {
  const existingPatient = await prisma.user.findFirst({
    where: {
      email,
      doctorId,
      role: 'PATIENT'
    }
  });

  return !!existingPatient;
}

/**
 * Busca usuário por código de indicação
 */
export async function getUserByReferralCode(referralCode: string) {
  return await prisma.user.findUnique({
    where: {
      referralCode
    },
    include: {
      doctor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Gerar código de indicação para usuário se não tiver
 */
export async function ensureUserHasReferralCode(userId: string): Promise<string> {
  console.log('ensureUserHasReferralCode called with userId:', userId);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true }
  });

  console.log('User found:', user);

  if (user?.referralCode) {
    console.log('User already has referral code:', user.referralCode);
    return user.referralCode;
  }

  console.log('User does not have referral code, generating new one...');

  // Gerar código único
  let referralCode;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    referralCode = generateReferralCode();
    console.log(`Attempt ${attempts + 1}: Generated code ${referralCode}`);
    
    const existing = await prisma.user.findUnique({
      where: { referralCode }
    });
    
    console.log('Existing user with this code:', existing);
    
    if (!existing) {
      isUnique = true;
      console.log('Code is unique!');
    }
    attempts++;
  }

  if (!isUnique) {
    console.error('Failed to generate unique code after 10 attempts');
    throw new Error('Não foi possível gerar código único');
  }

  console.log('Updating user with referral code:', referralCode);
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { referralCode }
  });

  console.log('User updated successfully:', updatedUser);

  return referralCode!;
}

/**
 * Constantes para status
 */
export const REFERRAL_STATUS = {
  PENDING: 'PENDING',
  CONTACTED: 'CONTACTED', 
  CONVERTED: 'CONVERTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED'
} as const;

export const CREDIT_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  USED: 'USED',
  EXPIRED: 'EXPIRED'
} as const;

export const CREDIT_TYPE = {
  SUCCESSFUL_REFERRAL: 'SUCCESSFUL_REFERRAL',
  BONUS_CREDIT: 'BONUS_CREDIT',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT'
} as const;

export const REDEMPTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED'
} as const; 