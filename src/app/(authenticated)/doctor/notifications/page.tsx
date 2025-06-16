'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BellIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  PaperAirplaneIcon
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
        const response = await fetch('/api/doctor/patients');
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Send Notifications
              </h1>
              <p className="text-gray-600 mt-2">
                Send push notifications to keep your patients informed and engaged
              </p>
            </div>
            <Button 
              asChild
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Link href="/doctor">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Notification Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-white px-6">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-turquoise" />
                    Notification Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Patient Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      Select Patient
                    </label>
                    <select
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-transparent bg-white text-gray-900 shadow-sm"
                    >
                      <option value="">Select a patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} ({patient.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                      Title (Optional)
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter notification title"
                      className="h-11 px-4 rounded-xl border-gray-200 focus:border-turquoise focus:ring-turquoise shadow-sm"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <PaperAirplaneIcon className="h-4 w-4 text-gray-500" />
                      Message
                    </label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your notification message"
                      className="min-h-[120px] px-4 py-3 rounded-xl border-gray-200 focus:border-turquoise focus:ring-turquoise shadow-sm resize-none"
                    />
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendNotification}
                    disabled={isSending || !selectedPatient || !message.trim()}
                    className="w-full h-12 bg-[#5154e7] hover:bg-[#4145d1] text-white font-semibold rounded-xl shadow-lg shadow-[#5154e7]/25 hover:shadow-[#5154e7]/40 transition-all duration-200"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending Notification...
                      </>
                    ) : (
                      <>
                        <BellIcon className="h-5 w-5 mr-2" />
                        Send Notification
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Tips & Information */}
            <div className="space-y-6">
              {/* Quick Tips */}
              <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-white px-6">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ul className="space-y-4 text-sm text-gray-600">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span>Keep messages clear and concise for better engagement</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span>Use titles to help patients quickly identify the notification</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span>Send notifications during appropriate hours to ensure better response</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card className="bg-white border-0 shadow-lg rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-gray-100 bg-white px-6">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4 text-sm text-gray-600">
                    <p className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                      </div>
                      <span>Notifications will only be delivered to patients with the app installed and notifications enabled</span>
                    </p>
                    <p className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                      </div>
                      <span>Delivery times may vary depending on the patient's device settings</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 