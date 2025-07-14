'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { 
  ArrowRightIcon, 
  ArrowLeftIcon,
  UserPlusIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Protocol {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  duration?: number;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  estimatedTime?: number;
}

interface PatientData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  approach: 'quick' | 'onboarding' | 'manual';
  selectedProtocol?: string;
  selectedTemplate?: string;
}

export default function PatientOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  
  const [patient, setPatient] = useState<PatientData>({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    approach: 'quick'
  });

  useEffect(() => {
    loadProtocols();
    loadTemplates();
  }, []);

  const loadProtocols = async () => {
    try {
      const response = await fetch('/api/protocols');
      if (response.ok) {
        const data = await response.json();
        setProtocols(data);
      }
    } catch (error) {
      console.error('Error loading protocols:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/onboarding-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleCreatePatient = async () => {
    try {
      setIsLoading(true);
      
      // Criar o paciente
      const patientData = {
        name: patient.name,
        email: patient.email,
        phone: patient.phone || undefined,
        birthDate: patient.birthDate || undefined,
        gender: patient.gender || undefined,
      };

      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });

      if (!patientResponse.ok) {
        const errorData = await patientResponse.json();
        throw new Error(errorData.error || 'Erro ao criar paciente');
      }

      const createdPatient = await patientResponse.json();
      
      // Processar baseado na abordagem selecionada
      if (patient.approach === 'quick' && patient.selectedProtocol) {
        // Atribuir protocolo imediatamente
        const assignResponse = await fetch('/api/protocols/assign', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId: createdPatient.id,
            protocolId: patient.selectedProtocol,
          }),
        });

        if (!assignResponse.ok) {
          console.error('Error assigning protocol');
        }
        
        toast.success('Patient created and protocol assigned successfully!');
      } else if (patient.approach === 'onboarding' && patient.selectedTemplate) {
        // Gerar link de onboarding
        const linkResponse = await fetch('/api/onboarding/generate-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            templateId: patient.selectedTemplate,
            patientId: createdPatient.id,
          }),
        });

        if (linkResponse.ok) {
          toast.success('Patient created and onboarding link generated!');
        } else {
          toast.success('Patient created successfully!');
        }
      } else {
        toast.success('Patient created successfully!');
      }

      // Redirecionar para o dashboard
      router.push('/doctor/dashboard');
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-blue-50">
      {/* Logo */}
      <div className="flex justify-center py-8">
        <Image
          src="/logo.png"
          alt="Logo"
          width={180}
          height={40}
          className="h-10 w-auto"
          priority
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className={`h-2 w-20 rounded-full transition-colors ${
              step === 1 ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 
              step > 1 ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`h-2 w-20 rounded-full transition-colors ${
              step === 2 ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 
              step > 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`h-2 w-20 rounded-full transition-colors ${
              step === 3 ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gray-200'
            }`} />
          </div>
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>Approach</span>
            <span>Patient Info</span>
            <span>Configuration</span>
          </div>
        </div>

        {/* Step 1: Choose Approach */}
        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                Add Your First Patient
              </h1>
              <p className="text-gray-600 max-w-lg mx-auto">
                Choose the best approach to onboard your new patient and get them started with their treatment journey.
              </p>
            </div>

            <div className="grid gap-6 mb-8">
              {/* Quick Assignment */}
              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  patient.approach === 'quick' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' 
                    : 'border-transparent hover:border-gray-200 hover:shadow-lg'
                }`}
                onClick={() => setPatient({...patient, approach: 'quick'})}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-400 to-green-500 rounded-xl">
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Quick Assignment</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Create patient and immediately assign an existing protocol. Best for patients ready to start treatment.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Fastest setup</span>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Immediate start</span>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">{protocols.length} protocols</span>
                  </div>
                </CardContent>
              </Card>

              {/* Onboarding Form */}
              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  patient.approach === 'onboarding' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' 
                    : 'border-transparent hover:border-gray-200 hover:shadow-lg'
                }`}
                onClick={() => setPatient({...patient, approach: 'onboarding'})}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Onboarding Form</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Send a customized onboarding form to gather detailed information before the first session.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">Detailed info</span>
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">Custom forms</span>
                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">{templates.length} templates</span>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Setup */}
              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  patient.approach === 'manual' 
                    ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' 
                    : 'border-transparent hover:border-gray-200 hover:shadow-lg'
                }`}
                onClick={() => setPatient({...patient, approach: 'manual'})}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl">
                      <UserPlusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Manual Setup</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Just create the patient profile without any assignments. Configure everything later.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium">
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700">Basic profile</span>
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700">Flexible setup</span>
                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700">Configure later</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!patient.approach}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6 rounded-xl font-medium text-lg shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
          </>
        )}

        {/* Step 2: Patient Information */}
        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                Patient Information
              </h1>
              <p className="text-gray-600">
                Enter the basic information about your patient
              </p>
            </div>

            <Card className="bg-white shadow-lg shadow-gray-100/50 border-0 mb-8">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={patient.name}
                        onChange={(e) => setPatient({...patient, name: e.target.value})}
                        placeholder="Enter patient's full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={patient.email}
                        onChange={(e) => setPatient({...patient, email: e.target.value})}
                        placeholder="patient@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-900">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={patient.phone}
                        onChange={(e) => setPatient({...patient, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthDate" className="text-sm font-medium text-gray-900">
                        Birth Date
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={patient.birthDate}
                        onChange={(e) => setPatient({...patient, birthDate: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-900">
                      Gender
                    </Label>
                    <Select value={patient.gender} onValueChange={(value) => setPatient({...patient, gender: value})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 py-6 rounded-xl font-medium text-lg border-2 hover:bg-gray-50"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!patient.name || !patient.email}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6 rounded-xl font-medium text-lg shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Configuration */}
        {step === 3 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-3">
                {patient.approach === 'quick' ? 'Select Protocol' :
                 patient.approach === 'onboarding' ? 'Select Onboarding Template' : 'Ready to Create'}
              </h1>
              <p className="text-gray-600">
                {patient.approach === 'quick' ? 'Choose a protocol to assign to this patient' :
                 patient.approach === 'onboarding' ? 'Choose an onboarding template to send' : 'Patient will be created without initial assignments'}
              </p>
            </div>

            <Card className="bg-white shadow-lg shadow-gray-100/50 border-0 mb-8">
              <CardContent className="p-6">
                {patient.approach === 'quick' &&
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-900">Select Protocol *</Label>
                    <div className="grid gap-3">
                      {protocols.map((protocol) => (
                        <Card 
                          key={protocol.id}
                          className={`cursor-pointer transition-all duration-200 border-2 ${
                            patient.selectedProtocol === protocol.id 
                              ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100' 
                              : 'border-transparent hover:border-gray-200 hover:shadow-md'
                          }`}
                          onClick={() => setPatient({...patient, selectedProtocol: protocol.id})}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg">
                                <DocumentTextIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{protocol.name}</h4>
                                {protocol.description && (
                                  <p className="text-sm text-gray-600 mt-1">{protocol.description}</p>
                                )}
                                {protocol.duration && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    {protocol.duration} days
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                }

                {patient.approach === 'onboarding' &&
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-900">Select Template *</Label>
                    <div className="grid gap-3">
                      {templates.map((template) => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-all duration-200 border-2 ${
                            patient.selectedTemplate === template.id 
                              ? 'border-blue-500 bg-blue-50/50 shadow-md shadow-blue-100' 
                              : 'border-transparent hover:border-gray-200 hover:shadow-md'
                          }`}
                          onClick={() => setPatient({...patient, selectedTemplate: template.id})}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg">
                                <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                {template.description && (
                                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                                )}
                                {template.estimatedTime && (
                                  <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                    ~{template.estimatedTime} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                }
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 py-6 rounded-xl font-medium text-lg border-2 hover:bg-gray-50"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleCreatePatient}
                disabled={isLoading || 
                  (patient.approach === 'quick' && !patient.selectedProtocol) ||
                  (patient.approach === 'onboarding' && !patient.selectedTemplate)
                }
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-6 rounded-xl font-medium text-lg shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Patient'}
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 