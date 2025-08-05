export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  title: string;
  notes?: string;
  googleEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoogleCalendarCredentials {
  id: string;
  doctorId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  calendarId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}
