'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  BellIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  email: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/patients');
        if (response.ok) {
          const data = await response.json();
          setPatients(data.patients || []);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
        toast.error('Error loading patients');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadPatients();
    }
  }, [session]);

  const handleSendNotification = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const patient = patients.find(p => p.id === selectedPatient);
    if (!patient?.email) {
      toast.error('Selected patient has no email');
      return;
    }

    try {
      setIsSending(true);

      const response = await fetch('https://aa-ios-notify-cxlus.dpbdp1.easypanel.host/send-notification-by-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [patient.email],
          message: message,
          title: title || undefined
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.summary.successfulEmails > 0) {
          toast.success('Notification sent successfully');
          // Reset form
          setSelectedPatient('');
          setTitle('');
          setMessage('');
        } else {
          toast.error(`Failed to send notification: ${data.failed?.[0]?.error || 'No devices found'}`);
        }
      } else {
        throw new Error(data.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error sending notification');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="animate-pulse space-y-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-64"></div>
                <div className="h-4 bg-gray-100 rounded-lg w-80"></div>
              </div>
              <div className="space-y-6">
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
                <div className="h-32 bg-gray-200 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Send Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                Send push notifications to your patients
              </p>
            </div>
            <Button 
              asChild
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Link href="/admin">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Notification Form */}
          <div className="max-w-2xl">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-turquoise" />
                  Notification Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Select Patient
                  </label>
                  <Select 
                    value={selectedPatient} 
                    onValueChange={setSelectedPatient}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex items-center gap-2">
                            <span>{patient.name}</span>
                            <span className="text-xs text-gray-500">
                              ({patient.email})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Title (Optional)
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                    className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your notification message"
                    className="border-gray-300 focus:border-turquoise focus:ring-turquoise min-h-[100px]"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendNotification}
                  disabled={isSending || !selectedPatient || !message.trim()}
                  className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <BellIcon className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 