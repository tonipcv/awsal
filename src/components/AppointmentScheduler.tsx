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
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { AppointmentStatus } from '@/types/appointment';

interface AppointmentSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface AppointmentSchedulerProps {
  doctorId: string;
  patientId: string;
  className?: string;
}

export default function AppointmentScheduler({ doctorId, patientId, className = '' }: AppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
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

  // Fetch available slots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!doctorId) return;
      
      setIsLoading(true);
      try {
        // Fetch available slots for selected doctor and date
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/v2/patients/doctors/${doctorId}/slots?date=${formattedDate}`);
        
        if (response.ok) {
          const data = await response.json();
          setAvailableSlots(data.data);
        } else {
          toast.error('Failed to load available time slots');
        }
      } catch (error) {
        console.error('Error fetching available slots:', error);
        toast.error('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [doctorId, selectedDate]);

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
    
    if (!doctorId || !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      const response = await fetch('/api/v2/patients/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          title: appointmentDetails.title,
          notes: appointmentDetails.notes,
        }),
      });

      if (response.ok) {
        toast.success('Appointment booked successfully');
        setIsBookingModalOpen(false);
        // Refresh available slots
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const slotsResponse = await fetch(`/api/v2/patients/doctors/${doctorId}/slots?date=${formattedDate}`);
        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          setAvailableSlots(slotsData.data);
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
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Schedule an Appointment</CardTitle>
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

      {/* Booking Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBookAppointment}>
            <div className="grid gap-4 py-4">
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
