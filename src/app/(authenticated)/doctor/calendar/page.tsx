'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/notion-calendar.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { CalendarDaysIcon, LinkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { AppointmentStatus } from '@/types/appointment';

// Set up the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Status options for appointments
const statusOptions = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No Show' },
] as const;

// Status colors for calendar events
const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: '#3b82f6', // blue
  CONFIRMED: '#10b981', // green
  COMPLETED: '#6366f1', // indigo
  CANCELLED: '#ef4444', // red
  NO_SHOW: '#f59e0b', // amber
};

interface Patient {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  title: string;
  notes?: string;
  googleEventId?: string;
  patient?: Patient;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: AppointmentStatus;
  appointment: Appointment;
}

interface FormData {
  patientId: string;
  startTime: string;
  endTime: string;
  title: string;
  notes: string;
  status: AppointmentStatus;
}

// Helper function to debug calendar events
const debugCalendarEvents = (events: CalendarEvent[]): void => {
  console.log('===== DEBUG CALENDAR EVENTS =====');
  console.log('Total events:', events.length);
  events.forEach((event: CalendarEvent, index: number) => {
    console.log(`Event ${index + 1}:`);
    console.log('- Title:', event.title);
    console.log('- Start:', event.start.toISOString());
    console.log('- End:', event.end.toISOString());
    console.log('- Status:', event.status);
  });
  console.log('================================');
};

// Event style getter for calendar events
const eventStyleGetter = (event: CalendarEvent) => {
  return {
    style: {
      backgroundColor: statusColors[event.status] || '#64748b',
    }
  };
};

export default function DoctorCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [googleConnectUrl, setGoogleConnectUrl] = useState<string | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isNewAppointment, setIsNewAppointment] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    startTime: '',
    endTime: '',
    title: 'Consultation',
    notes: '',
    status: 'SCHEDULED',
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    checkGoogleConnection();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/v2/doctor/appointments');
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const result = await response.json();
      const appointmentsData = result.data || [];
      setAppointments(appointmentsData);
      
      // Convert appointments to calendar events
      const calendarEvents = appointmentsData.map((appointment: Appointment) => ({
        id: appointment.id,
        title: appointment.title,
        start: new Date(appointment.startTime),
        end: new Date(appointment.endTime),
        status: appointment.status,
        appointment: appointment,
      }));
      
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/v2/doctor/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      const result = await response.json();
      const patientsData = result.data || [];
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    }
  };

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch('/api/v2/doctor/calendar/status');
      if (!response.ok) throw new Error('Failed to check Google connection');
      const result = await response.json();
      console.log('Google Calendar status:', result); // Debug log
      setIsGoogleConnected(result.data?.isConnected || false);
      setGoogleConnectUrl(result.data?.authUrl || null);
    } catch (error) {
      console.error('Error checking Google connection:', error);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedAppointment(event.appointment);
    setIsNewAppointment(false);
    setFormData({
      patientId: event.appointment.patientId,
      startTime: moment(event.start).format('YYYY-MM-DDTHH:mm'),
      endTime: moment(event.end).format('YYYY-MM-DDTHH:mm'),
      title: event.title,
      notes: event.appointment.notes || '',
      status: event.status,
    });
    setIsAppointmentModalOpen(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedAppointment(null);
    setIsNewAppointment(true);
    setFormData({
      patientId: '',
      startTime: moment(start).format('YYYY-MM-DDTHH:mm'),
      endTime: moment(end).format('YYYY-MM-DDTHH:mm'),
      title: 'Consultation',
      notes: '',
      status: 'SCHEDULED',
    });
    setIsAppointmentModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isNewAppointment ? '/api/v2/doctor/appointments' : `/api/v2/doctor/appointments/${selectedAppointment?.id}`;
      const method = isNewAppointment ? 'POST' : 'PUT';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save appointment');
      
      toast.success(isNewAppointment ? 'Appointment created' : 'Appointment updated');
      setIsAppointmentModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Failed to save appointment');
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(`/api/v2/doctor/appointments/${selectedAppointment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to cancel appointment');
      
      toast.success('Appointment cancelled');
      setIsAppointmentModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  return (
    <div className="container py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium text-gray-900">Calendar</h1>
        <div className="flex items-center gap-3">
          {!isGoogleConnected && googleConnectUrl && (
            <Button variant="outline" size="sm" className="h-9 text-sm font-medium" asChild>
              <a href={googleConnectUrl} target="_blank" rel="noopener noreferrer">
                <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                Connect Google Calendar
              </a>
            </Button>
          )}
          <Button size="sm" className="h-9 text-sm font-medium bg-primary hover:bg-primary/90" onClick={() => handleSelectSlot({ start: new Date(), end: new Date(Date.now() + 30 * 60000) })}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </div>
      </div>

      {isGoogleConnected && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-md mb-6">
          <CalendarDaysIcon className="h-5 w-5 text-green-600" />
          <span className="text-sm text-green-700">Google Calendar connected. Appointments will automatically sync.</span>
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden">
        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 'calc(100vh - 180px)' }}
            className="notion-calendar"
            views={['month', 'agenda']}
            defaultView="month"
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable={true}
            popup={true}
            longPressThreshold={10}
            step={30}
            timeslots={2}
            showMultiDayTimes={true}
            formats={{
              timeGutterFormat: (date: Date, culture?: string) => localizer.format(date, 'HH:mm', culture),
              eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture?: string) => 
                `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`,
              dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }, culture?: string) =>
                `${localizer.format(start, 'DD MMM', culture)} - ${localizer.format(end, 'DD MMM', culture)}`,
            }}
          />
        </div>
      </div>

      {/* Appointment Modal */}
      <Dialog open={isAppointmentModalOpen} onOpenChange={setIsAppointmentModalOpen}>
        <DialogContent className="sm:max-w-[550px] p-6 rounded-xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-medium text-gray-900">
              {isNewAppointment ? 'Create New Appointment' : 'Edit Appointment'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 mt-1">
              {isNewAppointment ? 'Schedule a new appointment with a patient.' : 'View or modify the appointment details.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="patientId" className="text-right text-sm font-medium text-gray-700 col-span-1">
                  Patient
                </Label>
                <Select
                  value={formData.patientId}
                  onValueChange={(value) => handleSelectChange('patientId', value)}
                  disabled={!isNewAppointment}
                >
                  <SelectTrigger className="col-span-4 h-10 rounded-md border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="title" className="text-right text-sm font-medium text-gray-700 col-span-1">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="col-span-4 h-10 rounded-md border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-5 items-center gap-4">
                <Label htmlFor="startTime" className="text-right text-sm font-medium text-gray-700 col-span-1">
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="col-span-4 h-10 rounded-md border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endTime" className="text-right">
                  End Time
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value as AppointmentStatus)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {!isNewAppointment && (
                <Button type="button" variant="destructive" onClick={handleCancelAppointment}>
                  Cancel Appointment
                </Button>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAppointmentModalOpen(false)}>
                  Close
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
