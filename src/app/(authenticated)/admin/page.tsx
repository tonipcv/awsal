'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UsersIcon, 
  CheckIcon,
  DocumentTextIcon, 
  BookOpenIcon, 
  ShoppingBagIcon, 
  StarIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  BuildingOffice2Icon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface SystemMetrics {
  totalDoctors: number;
  totalPatients: number;
  totalProtocols: number;
  totalCourses: number;
  totalProducts: number;
  totalClinics: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  activeClinicSubscriptions: number;
  trialClinicSubscriptions: number;
  expiringSoon: number;
}

interface RecentDoctor {
  id: string;
  name: string;
  email: string;
  subscription?: {
    status: string;
    plan: { name: string };
  };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalDoctors: 0,
    totalPatients: 0,
    totalProtocols: 0,
    totalCourses: 0,
    totalProducts: 0,
    totalClinics: 0,
    activeSubscriptions: 0,
    trialSubscriptions: 0,
    activeClinicSubscriptions: 0,
    trialClinicSubscriptions: 0,
    expiringSoon: 0
  });
  const [recentDoctors, setRecentDoctors] = useState<RecentDoctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Load metrics (you can implement a specific API)
        const response = await fetch('/api/admin/dashboard-metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics || metrics);
          setRecentDoctors(data.recentDoctors || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadDashboardData();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-48 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-36 animate-pulse"></div>
              </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-xl animate-pulse">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-7 bg-gray-100 rounded w-12 animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Skeleton */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Card Skeleton */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <div className="flex flex-row items-center justify-between p-6 pb-4">
                  <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
                  <div className="h-8 bg-gray-100 rounded-xl w-24 animate-pulse"></div>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-40 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Card Skeleton */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <div className="flex flex-row items-center justify-between p-6 pb-4">
                  <div className="h-6 bg-gray-200 rounded w-36 animate-pulse"></div>
                  <div className="h-8 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-36 animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
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
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {session?.user?.name || 'Administrator'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
              >
                <Link href="/admin/doctors/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Doctor
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Link href="/admin/clinics">
                  <BuildingOffice2Icon className="h-4 w-4 mr-2" />
                  Clinics
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline"
                className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
              >
                <Link href="/admin/subscriptions">
                  <StarIcon className="h-4 w-4 mr-2" />
                  Subscriptions
                </Link>
              </Button>
            </div>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <CheckIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Doctors</p>
                    <p className="text-2xl font-light text-gray-900">{metrics.totalDoctors}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.activeSubscriptions} active, {metrics.trialSubscriptions} trial
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <UsersIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Patients</p>
                    <p className="text-2xl font-light text-gray-900">{metrics.totalPatients}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Average of {Math.round(metrics.totalPatients / Math.max(metrics.totalDoctors, 1))} per doctor
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Protocols</p>
                    <p className="text-2xl font-light text-gray-900">{metrics.totalProtocols}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created by doctors
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <BuildingOffice2Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 font-medium">Clinics</p>
                    <p className="text-2xl font-light text-gray-900">{metrics.totalClinics}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.activeClinicSubscriptions} active
                    </p>
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
                    <p className="text-sm text-gray-600 font-medium">Expiring</p>
                    <p className="text-2xl font-light text-gray-900">{metrics.expiringSoon}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Next 3 days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Doctors */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Recent Doctors
                </CardTitle>
                <Button 
                  asChild
                  variant="outline" 
                  size="sm"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Link href="/admin/doctors">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {recentDoctors.length > 0 ? (
                    recentDoctors.slice(0, 5).map((doctor) => (
                      <div key={doctor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-turquoise rounded-xl flex items-center justify-center text-black font-semibold">
                            {getDoctorInitials(doctor.name)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doctor.name}</p>
                            <p className="text-sm text-gray-600">{doctor.email}</p>
                          </div>
                        </div>
                        {doctor.subscription && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doctor.subscription.status)}`}>
                            {doctor.subscription.status}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No doctors found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <Link 
                    href="/admin/doctors/new"
                    className="flex items-center gap-4 p-4 bg-turquoise/10 rounded-xl border border-turquoise/20 hover:bg-turquoise/20 transition-colors group"
                  >
                    <div className="p-3 bg-turquoise rounded-xl group-hover:scale-110 transition-transform">
                      <PlusIcon className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create New Doctor</p>
                      <p className="text-sm text-gray-600">Add doctor to the system</p>
                    </div>
                  </Link>

                  <Link 
                    href="/admin/clinics"
                    className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="p-3 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                      <BuildingOffice2Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Manage Clinics</p>
                      <p className="text-sm text-gray-600">View and edit clinics</p>
                    </div>
                  </Link>

                  <Link 
                    href="/admin/subscriptions"
                    className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors group"
                  >
                    <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform">
                      <StarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Subscriptions</p>
                      <p className="text-sm text-gray-600">Manage plans and subscriptions</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 