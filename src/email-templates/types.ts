// Base template types
export interface BaseTemplateProps {
  content: string;
  clinicName: string;
  clinicLogo?: string;
  doctorName?: string;
}

// Consultation request email types
export interface ConsultationRequestEmailProps {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientAge?: string;
  specialty?: string;
  message?: string;
  referrerName?: string;
  referralCode?: string;
  clinicName: string;
  clinicLogo?: string;
  doctorName?: string;
}

// Consultation confirmation email types
export interface ConsultationConfirmationEmailProps {
  patientName: string;
  doctorName: string;
  specialty?: string;
  whatsapp: string;
  message: string;
  clinicName: string;
  clinicLogo?: string;
}

// Doctor invitation email types
export interface DoctorInvitationEmailProps {
  name: string;
  inviteUrl: string;
  subscriptionType: 'TRIAL' | 'PAID';
  trialDays?: number;
  clinicName: string;
  clinicLogo?: string;
}

// Referral email types
export interface ReferralEmailProps {
  referralName: string;
  referrerName: string;
  doctorName?: string;
  clinicName: string;
  clinicLogo?: string;
  notes?: string;
}

// Credit email types
export interface CreditEmailProps {
  name: string;
  amount: number;
  type: 'CONSULTATION_REFERRAL' | 'COURSE_REFERRAL' | 'PRODUCT_REFERRAL';
  clinicName: string;
  clinicLogo?: string;
} 