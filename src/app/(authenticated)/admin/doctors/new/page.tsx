'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, UserPlusIcon, InformationCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewDoctorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subscriptionType: 'TRIAL' // Padrão é TRIAL
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Nome e email são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Médico criado com sucesso! Um email de convite foi enviado para definir a senha.');
        router.push('/admin/doctors');
      } else {
        setError(data.error || 'Erro ao criar médico');
      }
    } catch (error) {
      console.error('Erro ao criar médico:', error);
      setError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                Create New Doctor
              </h1>
              <p className="text-gray-600 mt-1">
                Add a new doctor to the system with trial subscription
              </p>
            </div>
            <Button 
              asChild
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            >
              <Link href="/admin/doctors">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Doctors
              </Link>
            </Button>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Form Section */}
              <div className="lg:col-span-2">
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UserPlusIcon className="h-5 w-5 text-turquoise" />
                      Doctor Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Personal Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                            <Input
                              id="name"
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              placeholder="Dr. John Smith"
                              required
                              className="mt-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-turquoise focus:ring-turquoise"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              placeholder="john@example.com"
                              required
                              className="mt-2 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-turquoise focus:ring-turquoise"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Subscription Configuration */}
                      <div className="space-y-4 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Subscription Settings</h3>
                        
                        <div>
                          <Label htmlFor="subscriptionType" className="text-sm font-medium text-gray-700">Subscription Type</Label>
                          <select
                            id="subscriptionType"
                            value={formData.subscriptionType}
                            onChange={(e) => handleInputChange('subscriptionType', e.target.value)}
                            className="mt-2 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise focus:border-turquoise"
                          >
                            <option value="TRIAL">Trial (7 days free)</option>
                            <option value="ACTIVE">Active Subscription</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-2">
                            {formData.subscriptionType === 'TRIAL' 
                              ? 'Doctor will have 7 days to test all features for free.'
                              : 'Doctor will start with an active subscription and be charged immediately.'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-6">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating Doctor...
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="h-4 w-4 mr-2" />
                              Create Doctor & Send Invite
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push('/admin/doctors')}
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Information Sidebar */}
              <div className="space-y-6">
                
                {/* Email Invitation Info */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                      Email Invitation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Automatic Invitation</p>
                          <p className="text-xs text-gray-600 mt-1">
                            An email will be sent to the doctor with a secure link to set their password and access the platform.
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                        ✓ Secure and automated process
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trial Plan Info */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <InformationCircleIcon className="h-5 w-5 text-green-600" />
                      Trial Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        All new doctors start with a 7-day trial that includes:
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-xs text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          Up to 50 patients
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          Up to 10 protocols
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          Up to 5 courses
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          Up to 30 products
                        </div>
                      </div>
                      <div className="text-xs text-turquoise bg-turquoise/10 p-2 rounded-lg font-medium">
                        ✓ Full access for 7 days
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 