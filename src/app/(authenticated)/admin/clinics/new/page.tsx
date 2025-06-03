'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  MapPinIcon,
  CreditCardIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxDoctors: number;
  features: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function NewClinicPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    website: '',
    ownerId: '',
    planId: '',
    subscriptionStatus: 'TRIAL'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load plans and users in parallel
        const [plansResponse, usersResponse] = await Promise.all([
          fetch('/api/admin/plans'),
          fetch('/api/admin/users')
        ]);

        if (plansResponse.ok) {
          const plansData = await plansResponse.json();
          setPlans(plansData.plans || []);
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error loading form data');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadData();
    }
  }, [session]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Clinic name is required');
      return;
    }

    if (!formData.ownerId) {
      toast.error('Please select a clinic owner');
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Clinic created successfully');
        router.push('/admin/clinics');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error creating clinic');
      }
    } catch (error) {
      console.error('Error creating clinic:', error);
      toast.error('Error creating clinic');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === formData.planId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-80 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-40 animate-pulse"></div>
              </div>
            </div>

            {/* Form Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
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
                Create New Clinic
              </h1>
              <p className="text-gray-600 mt-1">
                Add a new clinic to the system
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmit}
                disabled={isSaving}
                className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Create Clinic
                  </>
                )}
              </Button>
              <Button 
                asChild
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Link href="/admin/clinics">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Clinics
                </Link>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Information */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <BuildingOfficeIcon className="h-5 w-5 text-turquoise" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Clinic Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="Enter clinic name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="clinic@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        placeholder="Brief description of the clinic"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                          Website
                        </Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="https://www.clinic.com"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Address Information */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-turquoise" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Street Address
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="New York"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                          State
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="NY"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                          ZIP Code
                        </Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => handleInputChange('zipCode', e.target.value)}
                          className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                          placeholder="10001"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                        Country
                      </Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="border-gray-300 focus:border-turquoise focus:ring-turquoise"
                        placeholder="United States"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                
                {/* Clinic Owner */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-turquoise" />
                      Clinic Owner
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Select Owner *
                      </Label>
                      <Select
                        value={formData.ownerId}
                        onValueChange={(value) => handleInputChange('ownerId', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-turquoise focus:ring-turquoise">
                          <SelectValue placeholder="Select a user as owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Settings */}
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCardIcon className="h-5 w-5 text-turquoise" />
                      Initial Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Subscription Plan
                      </Label>
                      <Select
                        value={formData.planId}
                        onValueChange={(value) => handleInputChange('planId', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-turquoise focus:ring-turquoise">
                          <SelectValue placeholder="Select a plan (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name} - ${plan.price}/month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Initial Status
                      </Label>
                      <Select
                        value={formData.subscriptionStatus}
                        onValueChange={(value) => handleInputChange('subscriptionStatus', value)}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-turquoise focus:ring-turquoise">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRIAL">Trial</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Plan Info */}
                    {selectedPlan && (
                      <div className="p-3 bg-turquoise/10 border border-turquoise/20 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{selectedPlan.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">${selectedPlan.price}/month</p>
                        <p className="text-sm text-gray-600">Max Doctors: {selectedPlan.maxDoctors}</p>
                        {selectedPlan.features && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Features:</p>
                            <div className="text-xs text-gray-600">
                              {selectedPlan.features.split(',').map((feature, index) => (
                                <div key={index} className="flex items-center gap-1 mb-1">
                                  <CheckCircleIcon className="h-3 w-3 text-turquoise" />
                                  {feature.trim()}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 