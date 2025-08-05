import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAvailableTimeSlots } from '@/lib/googleCalendar';

// GET - Get available appointment slots for a doctor
export async function GET(
  req: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    // Get session and verify patient role
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PATIENT') {
      return NextResponse.json(
        { success: false, message: 'Only patients can access this endpoint' },
        { status: 403 }
      );
    }

    const doctorId = params.doctorId;

    // Check if doctor exists
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Check if patient has a relationship with this doctor
    const relationship = await prisma.doctorPatientRelationship.findFirst({
      where: {
        doctorId,
        patientId: session.user.id,
      },
    });

    if (!relationship) {
      return NextResponse.json(
        { success: false, message: 'You are not a patient of this doctor' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json(
        { success: false, message: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    
    // Check if doctor has Google Calendar connected
    const googleCalendarConnected = await prisma.googleCalendarCredentials.findUnique({
      where: { doctorId },
    });

    let availableSlots = [];

    if (googleCalendarConnected) {
      // Get available slots from Google Calendar
      try {
        availableSlots = await getAvailableTimeSlots(doctorId, date);
      } catch (error) {
        console.error('Error getting available slots from Google Calendar:', error);
        // Fall back to default slots if Google Calendar fails
        availableSlots = generateDefaultTimeSlots(date);
      }
    } else {
      // Generate default time slots if Google Calendar is not connected
      availableSlots = generateDefaultTimeSlots(date);
    }

    return NextResponse.json({
      success: true,
      data: availableSlots,
      message: 'Available slots retrieved successfully',
    });
  } catch (error: any) {
    console.error('Error retrieving available slots:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate default time slots (9 AM to 5 PM, 30-minute intervals)
function generateDefaultTimeSlots(date: Date) {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const intervalMinutes = 30;
  
  // Create a new date object to avoid modifying the original
  const slotDate = new Date(date);
  
  // Set start time to 9 AM
  slotDate.setHours(startHour, 0, 0, 0);
  
  while (slotDate.getHours() < endHour) {
    const startTime = new Date(slotDate);
    
    // Add interval for end time
    slotDate.setMinutes(slotDate.getMinutes() + intervalMinutes);
    
    const endTime = new Date(slotDate);
    
    slots.push({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      available: true,
    });
  }
  
  return slots;
}
