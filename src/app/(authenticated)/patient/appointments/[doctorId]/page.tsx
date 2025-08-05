'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AppointmentScheduler from '@/components/AppointmentScheduler';
import styles from '../../../doctor/patients/[id]/bw-theme.module.css';

interface Doctor {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function DoctorAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.doctorId && session?.user?.id) {
      loadDoctorData();
    }
  }, [params.doctorId, session]);

  const loadDoctorData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v2/patients/doctors/${params.doctorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load doctor data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDoctor(data.data);
      } else {
        throw new Error(data.message || 'Failed to load doctor data');
      }
    } catch (error) {
      console.error('Error loading doctor data:', error);
      toast.error('Failed to load doctor data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/patient/appointments');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg text-gray-700">Doctor not found or you don't have access.</p>
              <Button onClick={handleGoBack} className="mt-4">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`container mx-auto px-4 py-8 ${styles.grayscaleTheme}`}>
      <Button 
        variant="ghost" 
        onClick={handleGoBack} 
        className="mb-6 flex items-center"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Doctors
      </Button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule Appointment with Dr. {doctor.name}</h1>
        <p className="text-gray-600 mt-1">{doctor.email}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <AppointmentScheduler 
          doctorId={doctor.id} 
          patientId={session?.user?.id || ''} 
          className="col-span-1"
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Your Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingAppointments doctorId={doctor.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UpcomingAppointments({ doctorId }: { doctorId: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      loadAppointments();
    }
  }, [session, doctorId]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v2/patients/appointments?doctorId=${doctorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load appointments');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAppointments(data.data.filter((apt: any) => 
          apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW'
        ));
      } else {
        throw new Error(data.message || 'Failed to load appointments');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: ptBR });
  };

  const formatAppointmentTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have any upcoming appointments with this doctor.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id} className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{appointment.title}</h3>
                <p className="text-sm text-gray-600">
                  {formatAppointmentDate(appointment.startTime)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatAppointmentTime(appointment.startTime)} - {formatAppointmentTime(appointment.endTime)}
                </p>
              </div>
              <div className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium">
                {appointment.status}
              </div>
            </div>
            {appointment.notes && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">{appointment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
