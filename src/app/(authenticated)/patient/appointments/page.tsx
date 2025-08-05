'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { CalendarDaysIcon, ClockIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { AppointmentStatus } from '@/types/appointment';

interface Doctor {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  specialty?: string;
}

interface AppointmentSlot {
  startTime: string;
  endTime: string;
  available: boolean;
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
  doctor?: Doctor;
}

export default function PatientAppointmentsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState({
    title: 'Consultation',
    notes: '',
  });

  // Date navigation
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }));
  
  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('/api/v2/patients/doctors');
        if (response.ok) {
          const data = await response.json();
          setDoctors(data.data);
          if (data.data.length > 0) {
            setSelectedDoctor(data.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to load doctors');
      }
    };

    fetchDoctors();
  }, []);

  // Fetch appointments when doctor or date changes
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!selectedDoctor) return;
      
      setIsLoading(true);
      try {
        // Fetch patient's existing appointments
        const appointmentsResponse = await fetch('/api/v2/patients/appointments');
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData.data);
        }

        // Fetch available slots for selected doctor and date
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const slotsResponse = await fetch(`/api/v2/patients/doctors/${selectedDoctor.id}/slots?date=${formattedDate}`);
        
        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          setAvailableSlots(slotsData.data);
        }
      } catch (error) {
        console.error('Error fetching appointments data:', error);
        toast.error('Failed to load appointments data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDoctor, selectedDate]);

  // Handle doctor selection
  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle slot selection
  const handleSlotSelect = (slot: AppointmentSlot) => {
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAppointmentDetails({
      ...appointmentDetails,
      [name]: value,
    });
  };

  // Handle booking submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDoctor || !selectedSlot) {
      toast.error('Please select a doctor and time slot');
      return;
    }

    try {
      const response = await fetch('/api/v2/patients/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          title: appointmentDetails.title,
          notes: appointmentDetails.notes,
        }),
      });

      if (response.ok) {
        toast.success('Appointment booked successfully');
        setIsBookingModalOpen(false);
        // Refresh appointments and slots
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const slotsResponse = await fetch(`/api/v2/patients/doctors/${selectedDoctor.id}/slots?date=${formattedDate}`);
        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          setAvailableSlots(slotsData.data);
        }
        
        const appointmentsResponse = await fetch('/api/v2/patients/appointments');
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData.data);
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('An error occurred while booking the appointment');
    }
  };

  // Generate week days for date picker
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i);
    return {
      date,
      dayName: format(date, 'EEE', { locale: ptBR }),
      dayNumber: format(date, 'd'),
    };
  });

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Schedule an Appointment</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Doctor selection */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {doctors.map((doctor) => (
                  <Button
                    key={doctor.id}
                    variant={selectedDoctor?.id === doctor.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleDoctorSelect(doctor)}
                  >
                    <UserCircleIcon className="h-5 w-5 mr-2" />
                    {doctor.name}
                  </Button>
                ))}
                {doctors.length === 0 && (
                  <p className="text-sm text-gray-500">No doctors available</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>My Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      {format(new Date(appointment.startTime), 'PPP', { locale: ptBR })}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-1" />
                      {appointment.doctor?.name}
                    </div>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
                        appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <p className="text-sm text-gray-500">No appointments scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Date and slot selection */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Select Date & Time</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextWeek}>
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Date picker */}
              <div className="flex justify-between mb-6">
                {weekDays.map(({ date, dayName, dayNumber }) => (
                  <Button
                    key={date.toString()}
                    variant={isSameDay(date, selectedDate) ? "default" : "outline"}
                    className="flex-col h-auto py-2"
                    onClick={() => handleDateSelect(date)}
                  >
                    <span className="text-xs">{dayName}</span>
                    <span className="text-lg font-bold">{dayNumber}</span>
                  </Button>
                ))}
              </div>

              {/* Time slots */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
                {isLoading ? (
                  <p>Loading available slots...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={slot.available ? "" : "opacity-50 cursor-not-allowed"}
                        disabled={!slot.available}
                        onClick={() => slot.available && handleSlotSelect(slot)}
                      >
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {formatTime(slot.startTime)}
                      </Button>
                    ))}
                    {availableSlots.length === 0 && (
                      <p className="col-span-full text-sm text-gray-500">
                        No available slots for this date
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBookAppointment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="doctor" className="text-right">
                  Doctor
                </Label>
                <div className="col-span-3">
                  {selectedDoctor?.name}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  {format(selectedDate, 'PPP', { locale: ptBR })}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <div className="col-span-3">
                  {selectedSlot && `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={appointmentDetails.title}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={appointmentDetails.notes}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Any specific concerns or information for the doctor"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Book Appointment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
