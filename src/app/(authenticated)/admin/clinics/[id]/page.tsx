'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  PencilIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ClinicSubscription {
  id: string;
  status: string;
  maxDoctors: number;
  startDate: string;
  endDate?: string;
  trialEndDate?: string;
  plan: {
    id: string;
    name: string;
    price: number;
    features?: string;
  };
}

interface Clinic {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: Array<{
    id: string;
    role: string;
    isActive: boolean;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  subscription?: ClinicSubscription;
}

export default function ViewClinicPage() {
  const { data: session } = useSession();
  const params = useParams();
  const clinicId = params.id as string;

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClinic = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/admin/clinics/${clinicId}`);

        if (response.ok) {
          const data = await response.json();
          setClinic(data.clinic);
        }
      } catch (error) {
        console.error('Error loading clinic:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session && clinicId) {
      loadClinic();
    }
  }, [session, clinicId]);

  const getSubscriptionStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'TRIAL': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAddress = () => {
    if (!clinic) return null;
    
    const parts = [
      clinic.address,
      clinic.city,
      clinic.state,
      clinic.zipCode,
      clinic.country
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

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

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-6"></div>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-6 bg-gray-100 rounded-lg animate-pulse"></div>
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
                        <div className="h-6 bg-gray-100 rounded-lg animate-pulse"></div>
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

  if (!clinic) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 text-lg">Clinic not found.</p>
              <Button asChild className="mt-4 bg-turquoise hover:bg-turquoise/90 text-black font-semibold">
                <Link href="/admin/clinics">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Clinics
                </Link>
              </Button>
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                  {clinic.name}
                </h1>
                <Badge className={`${clinic.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} border-0`}>
                  {clinic.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-gray-600">
                View clinic details and manage settings
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
              >
                <Link href={`/admin/clinics/${clinic.id}/edit`}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Clinic
                </Link>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Clinic Name</label>
                      <p className="text-gray-900 mt-1">{clinic.name}</p>
                    </div>

                    {clinic.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="flex items-center gap-2 mt-1">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${clinic.email}`} className="text-turquoise hover:underline">
                            {clinic.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {clinic.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900 mt-1">{clinic.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clinic.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        <div className="flex items-center gap-2 mt-1">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-900">{clinic.phone}</span>
                        </div>
                      </div>
                    )}

                    {clinic.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Website</label>
                        <div className="flex items-center gap-2 mt-1">
                          <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                          <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-turquoise hover:underline">
                            {clinic.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              {formatAddress() && (
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPinIcon className="h-5 w-5 text-turquoise" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{formatAddress()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Members */}
              {clinic.members && clinic.members.length > 0 && (
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UsersIcon className="h-5 w-5 text-turquoise" />
                      Members ({clinic.members.filter(m => m.isActive).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {clinic.members.filter(m => m.isActive).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-turquoise rounded-full flex items-center justify-center">
                              <span className="text-black font-semibold text-sm">
                                {member.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{member.user.name}</p>
                              <p className="text-sm text-gray-600">{member.user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {member.role}
                            </Badge>
                            <p className="text-xs text-gray-500">
                              Joined {formatDate(member.joinedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-turquoise rounded-full flex items-center justify-center">
                      <span className="text-black font-semibold text-sm">
                        {clinic.owner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{clinic.owner.name}</p>
                      <p className="text-sm text-gray-600">{clinic.owner.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Information */}
              {clinic.subscription && (
                <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CreditCardIcon className="h-5 w-5 text-turquoise" />
                      Subscription
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <Badge className={`${getSubscriptionStatusColor(clinic.subscription.status)} border-0`}>
                        {clinic.subscription.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Plan</label>
                        <p className="text-gray-900 mt-1">{clinic.subscription.plan.name}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Price</label>
                        <p className="text-gray-900 mt-1">${clinic.subscription.plan.price}/month</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Max Doctors</label>
                        <p className="text-gray-900 mt-1">{clinic.subscription.maxDoctors}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <p className="text-gray-900 mt-1">{formatDate(clinic.subscription.startDate)}</p>
                      </div>

                      {clinic.subscription.endDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">End Date</label>
                          <p className="text-gray-900 mt-1">{formatDate(clinic.subscription.endDate)}</p>
                        </div>
                      )}

                      {clinic.subscription.trialEndDate && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Trial End Date</label>
                          <p className="text-gray-900 mt-1">{formatDate(clinic.subscription.trialEndDate)}</p>
                        </div>
                      )}
                    </div>

                    {/* Plan Features */}
                    {clinic.subscription.plan.features && (
                      <div className="pt-3 border-t border-gray-200">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Plan Features</label>
                        <div className="space-y-1">
                          {clinic.subscription.plan.features.split(',').map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircleIcon className="h-4 w-4 text-turquoise" />
                              {feature.trim()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Clinic Statistics */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-turquoise" />
                    Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-light text-gray-900">{clinic.members.filter(m => m.isActive).length}</p>
                      <p className="text-xs text-gray-600">Active Members</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-light text-gray-900">{clinic.members.length}</p>
                      <p className="text-xs text-gray-600">Total Members</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="text-gray-900 mt-1">{formatDate(clinic.createdAt)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-900 mt-1">{formatDate(clinic.updatedAt)}</p>
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