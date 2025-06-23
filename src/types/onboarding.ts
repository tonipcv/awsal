export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  doctorId: string;
  clinicId?: string;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  steps: OnboardingStep[];
}

export interface OnboardingStep {
  id: string;
  templateId: string;
  question: string;
  description?: string;
  type: string;
  options: string[];
  required: boolean;
  showToDoctor: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingResponse {
  id: string;
  templateId: string;
  userId?: string;
  email: string;
  token: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  answers: OnboardingAnswer[];
}

export interface OnboardingAnswer {
  id: string;
  responseId: string;
  stepId: string;
  answer: string;
  createdAt: Date;
  updatedAt: Date;
} 