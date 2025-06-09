export type UserRole = 'DOCTOR' | 'PATIENT';

export type ProtocolContentType = 'VIDEO' | 'TEXT' | 'IMAGE' | 'PDF';

export interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  doctorId: string;
  createdAt: Date;
  updatedAt: Date;
  doctor?: User;
  days?: ProtocolDay[];
  assignments?: UserProtocol[];
  modalTitle?: string;
  modalVideoUrl?: string;
  modalDescription?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
  coverImage?: string;
}

export interface ProtocolDay {
  id: string;
  dayNumber: number;
  sessions: ProtocolSession[];
  tasks: ProtocolTask[];
  protocolId: string;
  createdAt: Date;
  updatedAt: Date;
  protocol?: Protocol;
  contents?: ProtocolContent[];
}

export interface ProtocolTask {
  id: string;
  title: string;
  order: number;
  hasMoreInfo?: boolean;
  videoUrl?: string;
  fullExplanation?: string;
  productId?: string;
  modalTitle?: string;
  modalButtonText?: string;
  product?: {
    id: string;
    name: string;
    description?: string;
    brand?: string;
    imageUrl?: string;
    originalPrice?: number;
    discountPrice?: number;
    purchaseUrl?: string;
  };
}

export interface ProtocolContent {
  id: string;
  type: ProtocolContentType;
  title: string;
  content: string;
  description?: string;
  protocolDayId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  protocolDay?: ProtocolDay;
}

export interface UserProtocol {
  id: string;
  userId: string;
  protocolId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  protocol?: Protocol;
}

export interface ProtocolDayProgress {
  id: string;
  userId: string;
  protocolTaskId: string;
  date: Date;
  isCompleted: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  protocolTask?: ProtocolTask;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
  doctorId?: string;
  doctor?: User;
  patients?: User[];
  createdProtocols?: Protocol[];
  assignedProtocols?: UserProtocol[];
}

// Templates de protocolos pré-definidos
export interface ProtocolTemplate {
  name: string;
  duration: number;
  description: string;
  days: {
    dayNumber: number;
    tasks: {
      title: string;
      description?: string;
    }[];
    contents?: {
      type: ProtocolContentType;
      title: string;
      content: string;
      description?: string;
    }[];
  }[];
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    name: "Pós-Preenchimento Facial",
    duration: 7,
    description: "Protocolo de cuidados após preenchimento facial",
    days: [
      {
        dayNumber: 1,
        tasks: [
          { title: "Beber 2L de água", description: "Manter hidratação adequada" },
          { title: "Aplicar sérum hidratante", description: "Aplicar suavemente sem massagear" },
          { title: "Evitar exposição solar", description: "Usar protetor solar FPS 60+" }
        ]
      },
      {
        dayNumber: 2,
        tasks: [
          { title: "Evitar maquiagem", description: "Não aplicar maquiagem na área tratada" },
          { title: "Usar protetor solar", description: "Reaplicar a cada 2 horas" },
          { title: "Compressas frias", description: "15 minutos, 3x ao dia se houver inchaço" }
        ]
      },
      {
        dayNumber: 3,
        tasks: [
          { title: "Tomar suplemento de colágeno", description: "Conforme prescrição médica" },
          { title: "Fazer drenagem facial suave", description: "Movimentos leves, sem pressão" }
        ]
      }
    ]
  },
  {
    name: "Detox Estético 21 dias",
    duration: 21,
    description: "Protocolo completo de detoxificação estética",
    days: [
      {
        dayNumber: 1,
        tasks: [
          { title: "Beber 3L de água", description: "Distribuir ao longo do dia" },
          { title: "Tomar chá verde", description: "2 xícaras por dia" },
          { title: "Aplicar máscara detox", description: "Argila verde por 15 minutos" }
        ]
      }
    ]
  },
  {
    name: "Pós-Botox",
    duration: 14,
    description: "Cuidados após aplicação de toxina botulínica",
    days: [
      {
        dayNumber: 1,
        tasks: [
          { title: "Evitar deitar por 4 horas", description: "Manter posição vertical" },
          { title: "Não massagear a área", description: "Evitar qualquer manipulação" },
          { title: "Evitar exercícios físicos", description: "Repouso nas primeiras 24h" }
        ]
      }
    ]
  }
];

export interface ProtocolSession {
  id: string;
  name: string;
  order: number;
  tasks: ProtocolTask[];
} 