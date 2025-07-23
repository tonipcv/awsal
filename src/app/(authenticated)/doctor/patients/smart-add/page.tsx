'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

interface Protocol {
  id: string;
  name: string;
  description?: string;
  duration?: number;
}

export default function SmartAddPatientPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocols, setSelectedProtocols] = useState<string[]>([]);
  
  const [patient, setPatient] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      const response = await fetch('/api/v2/doctor/protocols');
      if (response.ok) {
        const { data } = await response.json();
        setProtocols(data);
      }
    } catch (error) {
      console.error('Error loading protocols:', error);
    }
  };

  const handleCreatePatient = async () => {
    try {
      setIsLoading(true);

      const patientData = {
        ...patient,
        protocolIds: selectedProtocols
      };

      const response = await fetch('/api/v2/doctor/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMessage = responseData.error || 'Failed to create patient';
        console.error('Error creating patient:', {
          status: response.status,
          error: errorMessage,
          details: responseData
        });
        throw new Error(errorMessage);
      }

      toast.success('Patient created successfully');
      router.push('/doctor/patients');
    } catch (error) {
      console.error('Error creating patient:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      });
      toast.error(error instanceof Error ? error.message : 'Error creating patient');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProtocol = (protocolId: string) => {
    setSelectedProtocols(prev => 
      prev.includes(protocolId) 
        ? prev.filter(id => id !== protocolId)
        : [...prev, protocolId]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
          {/* Header */}
          <div className="flex items-center gap-6 mb-8">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/patients">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Add New Patient
              </h1>
              <p className="text-gray-600 font-medium text-sm">
                Create a new patient and assign protocols
              </p>
            </div>
            <Button 
              onClick={handleCreatePatient} 
              disabled={isLoading || !patient.name || !patient.email}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Create Patient'}
            </Button>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-900 font-semibold">Full Name *</Label>
                    <Input
                      id="name"
                      value={patient.name}
                      onChange={(e) => setPatient({...patient, name: e.target.value})}
                      placeholder="Enter patient's full name"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-900 font-semibold">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={patient.email}
                      onChange={(e) => setPatient({...patient, email: e.target.value})}
                      placeholder="patient@example.com"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                {/* Protocol Selection */}
                <div className="space-y-4">
                  <Label className="text-gray-900 font-semibold">Select Protocols</Label>
                  <div className="grid gap-3">
                    {protocols.map((protocol) => (
                      <div
                        key={protocol.id}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedProtocols.includes(protocol.id)
                            ? 'border-[#5154e7] bg-[#5154e7]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleProtocol(protocol.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedProtocols.includes(protocol.id)}
                            onCheckedChange={() => toggleProtocol(protocol.id)}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{protocol.name}</div>
                            {protocol.duration && (
                              <div className="text-sm text-gray-500">{protocol.duration} days</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 