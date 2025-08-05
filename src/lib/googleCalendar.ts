import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { Appointment } from '@/types/appointment';

// Create OAuth2 client
const createOAuth2Client = (credentials: {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
    expiry_date: credentials.expiresAt.getTime(),
  });

  return oAuth2Client;
};

// Get Google Calendar API
export const getCalendarApi = async (doctorId: string) => {
  const credentials = await prisma.googleCalendarCredentials.findUnique({
    where: { doctorId },
  });

  if (!credentials) {
    throw new Error('Google Calendar not connected');
  }

  const auth = createOAuth2Client({
    accessToken: credentials.accessToken,
    refreshToken: credentials.refreshToken,
    expiresAt: credentials.expiresAt,
  });

  return google.calendar({ version: 'v3', auth });
};

// Create Google Calendar event
export const createCalendarEvent = async (
  doctorId: string,
  appointment: Appointment
) => {
  try {
    const calendar = await getCalendarApi(doctorId);
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { doctorId },
    });

    if (!credentials?.calendarId) {
      throw new Error('Calendar ID not found');
    }

    const patient = await prisma.user.findUnique({
      where: { id: appointment.patientId },
      select: { name: true, email: true },
    });

    const event = {
      summary: appointment.title,
      description: appointment.notes || '',
      start: {
        dateTime: appointment.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: patient?.email || '', displayName: patient?.name || '' },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: credentials.calendarId,
      requestBody: event,
      sendUpdates: 'all',
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
};

// Update Google Calendar event
export const updateCalendarEvent = async (
  doctorId: string,
  appointment: Appointment
) => {
  try {
    if (!appointment.googleEventId) {
      throw new Error('Google Event ID not found');
    }

    const calendar = await getCalendarApi(doctorId);
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { doctorId },
    });

    if (!credentials?.calendarId) {
      throw new Error('Calendar ID not found');
    }

    const patient = await prisma.user.findUnique({
      where: { id: appointment.patientId },
      select: { name: true, email: true },
    });

    const event = {
      summary: appointment.title,
      description: appointment.notes || '',
      start: {
        dateTime: appointment.startTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: appointment.endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: patient?.email || '', displayName: patient?.name || '' },
      ],
    };

    const response = await calendar.events.update({
      calendarId: credentials.calendarId,
      eventId: appointment.googleEventId,
      requestBody: event,
      sendUpdates: 'all',
    });

    return response.data.id;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw error;
  }
};

// Delete Google Calendar event
export const deleteCalendarEvent = async (
  doctorId: string,
  googleEventId: string
) => {
  try {
    const calendar = await getCalendarApi(doctorId);
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { doctorId },
    });

    if (!credentials?.calendarId) {
      throw new Error('Calendar ID not found');
    }

    await calendar.events.delete({
      calendarId: credentials.calendarId,
      eventId: googleEventId,
      sendUpdates: 'all',
    });

    return true;
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
};

// Get available time slots
export const getAvailableTimeSlots = async (
  doctorId: string,
  date: Date,
  duration: number = 30 // minutes
) => {
  try {
    const calendar = await getCalendarApi(doctorId);
    const credentials = await prisma.googleCalendarCredentials.findUnique({
      where: { doctorId },
    });

    if (!credentials?.calendarId) {
      throw new Error('Calendar ID not found');
    }

    // Set time range for the specified date (from 8 AM to 6 PM)
    const startTime = new Date(date);
    startTime.setHours(8, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(18, 0, 0, 0);

    // Get busy slots from Google Calendar
    const busyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: credentials.calendarId }],
      },
    });

    const busySlots = busyResponse.data.calendars?.[credentials.calendarId]?.busy || [];

    // Get existing appointments from database
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startTime: { gte: startTime },
        endTime: { lte: endTime },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    });

    // Combine busy slots from Google Calendar and database
    const allBusySlots = [
      ...busySlots.map(slot => ({
        start: new Date(slot.start || ''),
        end: new Date(slot.end || ''),
      })),
      ...existingAppointments.map(appointment => ({
        start: appointment.startTime,
        end: appointment.endTime,
      })),
    ];

    // Generate available time slots
    const availableSlots = [];
    const slotDuration = duration * 60 * 1000; // Convert minutes to milliseconds
    
    let currentSlotStart = new Date(startTime);
    
    while (currentSlotStart < endTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration);
      
      // Check if slot overlaps with any busy slot
      const isOverlapping = allBusySlots.some(busySlot => 
        (currentSlotStart >= busySlot.start && currentSlotStart < busySlot.end) ||
        (currentSlotEnd > busySlot.start && currentSlotEnd <= busySlot.end) ||
        (currentSlotStart <= busySlot.start && currentSlotEnd >= busySlot.end)
      );
      
      if (!isOverlapping) {
        availableSlots.push({
          startTime: new Date(currentSlotStart),
          endTime: new Date(currentSlotEnd),
          available: true,
        });
      }
      
      // Move to next slot
      currentSlotStart = new Date(currentSlotStart.getTime() + slotDuration);
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

// Get OAuth URL for connecting Google Calendar
export const getGoogleAuthUrl = () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

// Handle OAuth callback and save credentials
export const handleGoogleAuthCallback = async (code: string, doctorId: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error('Invalid tokens received from Google');
    }

    // Save credentials to database
    const credentials = await prisma.googleCalendarCredentials.upsert({
      where: { doctorId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      },
      create: {
        doctorId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      },
    });

    // Get primary calendar ID
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find(cal => cal.primary);
    
    if (primaryCalendar?.id) {
      await prisma.googleCalendarCredentials.update({
        where: { id: credentials.id },
        data: { calendarId: primaryCalendar.id },
      });
    }

    return true;
  } catch (error) {
    console.error('Error handling Google auth callback:', error);
    throw error;
  }
};
