'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  UsersIcon, 
  CheckIcon,
  CalendarIcon, 
  EnvelopeIcon, 
  UserIcon, 
  ExclamationTriangleIcon,
  StarIcon,
  EyeIcon,
  PlusIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DoctorSubscription {
  status: string;
  trialEndDate?: string;
  plan?: {
    name: string;
    maxPatients: number;
    maxProtocols: number;
    maxCourses: number;
    maxProducts: number;
  };
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  subscription?: DoctorSubscription;
  patientCount: number;
}

export default function DoctorsPage() {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/doctors');
        if (response.ok) {
          const data = await response.json();
          setDoctors(data.doctors || []);
        }
      } catch (error) {
        console.error('Error loading doctors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadDoctors();
    }
  }, [session]);

  const getDoctorInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'TRIAL': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeDoctors = doctors.filter(d => d.subscription?.status === 'ACTIVE').length;
  const trialDoctors = doctors.filter(d => d.subscription?.status === 'TRIAL').length;
  const expiringSoon = doctors.filter(d => {
    if (d.subscription?.status !== 'TRIAL' || !d.subscription.trialEndDate) return false;
    const daysLeft = Math.ceil((new Date(d.subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3;
  }).length;

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
                <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-40 animate-pulse"></div>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl animate-pulse">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-7 bg-gray-100 rounded w-12 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Doctors List Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <div className="p-6 pb-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="p-6 pt-0 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-40 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="space-y-2">
                          <div className="h-6 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-100 rounded-xl w-24 animate-pulse"></div>
                          <div className="h-8 bg-gray-200 rounded-xl w-28 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                Manage Doctors
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage all registered doctors
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
              >
                <Link href="/admin/doctors/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Doctor
                </Link>
              </Button>
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
          </div>

          {/* Quick Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <UsersIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Total Doctors</p>
                    <p className="text-2xl font-light text-gray-900">{doctors.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Active Subscriptions</p>
                    <p className="text-2xl font-light text-green-600">{activeDoctors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <CalendarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">On Trial</p>
                    <p className="text-2xl font-light text-yellow-600">{trialDoctors}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Expiring Soon</p>
                    <p className="text-2xl font-light text-red-600">{expiringSoon}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctors List */}
          <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Doctors List
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {doctors.length > 0 ? (
                  doctors.map((doctor) => {
                    const subscription = doctor.subscription;
                    const isExpiringSoon = subscription?.status === 'TRIAL' && subscription.trialEndDate && 
                      Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 3;

                    return (
                      <div key={doctor.id} className={`p-4 rounded-xl border transition-colors ${
                        isExpiringSoon 
                          ? 'border-red-200 bg-red-50' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-turquoise rounded-xl flex items-center justify-center text-black font-semibold">
                              {getDoctorInitials(doctor.name || 'Unknown')}
                            </div>
                            
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {doctor.name || 'No name'}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <EnvelopeIcon className="h-4 w-4" />
                                <span>{doctor.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <UsersIcon className="h-4 w-4" />
                                <span>{doctor.patientCount} patients</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Subscription Status */}
                            <div className="text-right">
                              {subscription ? (
                                <>
                                  <Badge 
                                    className={`${getStatusColor(subscription.status)} border-0`}
                                  >
                                    {subscription.status === 'ACTIVE' ? 'Active' : 'Trial'}
                                  </Badge>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {subscription.plan?.name || 'Basic Plan'}
                                  </p>
                                  {subscription.status === 'TRIAL' && subscription.trialEndDate && (
                                    <p className={`text-xs mt-1 ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                      Expires in {Math.ceil((new Date(subscription.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                                    </p>
                                  )}
                                </>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 border-0">
                                  No Subscription
                                </Badge>
                              )}
                            </div>

                            {/* Plan Limits */}
                            {subscription?.plan && (
                              <div className="text-xs text-gray-500 text-right">
                                <div>Max: {subscription.plan.maxPatients} patients</div>
                                <div>{subscription.plan.maxProtocols} protocols</div>
                                <div>{subscription.plan.maxCourses} courses</div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Link href={`/admin/doctors/${doctor.id}`}>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                >
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </Link>
                              <Link href={`/admin/subscriptions?doctorId=${doctor.id}`}>
                                <Button 
                                  size="sm"
                                  className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold"
                                >
                                  <StarIcon className="h-4 w-4 mr-1" />
                                  Subscription
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Expiring Alert */}
                        {isExpiringSoon && (
                          <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                            <div className="flex items-center text-sm text-red-700">
                              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                              Trial expiring soon! Consider contacting the doctor.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No doctors registered yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Add your first doctor to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 