'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UsersIcon, 
  DocumentTextIcon, 
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  CalendarDaysIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Patient {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  assignedProtocols: Array<{
    id: string;
    protocol: {
      id: string;
      name: string;
      duration: number;
    };
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }>;
}

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
    isActive: boolean;
  }>;
}

interface DashboardStats {
  totalPatients: number;
  activeProtocols: number;
  totalProtocols: number;
  completedToday: number;
}

export default function DoctorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    activeProtocols: 0,
    totalProtocols: 0,
    completedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Load dashboard summary stats
        const dashboardResponse = await fetch('/api/v2/doctor/dashboard-summary');
        if (!dashboardResponse.ok) {
          console.error('Error loading dashboard stats:', dashboardResponse.status);
          return;
        }
        const dashboardData = await dashboardResponse.json();
        
        // Load clients with default parameters
        const patientsResponse = await fetch('/api/v2/doctor/patients?limit=20&offset=0');
        if (!patientsResponse.ok) {
          console.error('Error loading clients:', patientsResponse.status);
          return;
        }
        const patientsData = await patientsResponse.json();
        
        // Load protocols
        const protocolsResponse = await fetch('/api/protocols');
        if (!protocolsResponse.ok) {
          console.error('Error loading protocols:', protocolsResponse.status);
          return;
        }
        const protocolsData = await protocolsResponse.json();

        // Transform patients data to match expected format
        const transformedPatients = patientsData.patients?.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          image: p.image || null,
          assignedProtocols: p.activePrescriptions?.map((prescription: any) => ({
            id: prescription.id,
            protocol: {
              id: prescription.protocol.id,
              name: prescription.protocol.name,
              duration: 30 // Default duration if not provided
            },
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            isActive: prescription.status === 'ACTIVE'
          })) || []
        })) || [];

        // Transform protocols data to match expected format
        const transformedProtocols = Array.isArray(protocolsData) ? protocolsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          duration: p.duration || 30,
          isTemplate: p.is_template,
          assignments: p.assignments?.map((assignment: any) => ({
            id: assignment.id,
            user: assignment.user,
            isActive: assignment.isActive
          })) || []
        })) : [];

        setPatients(transformedPatients);
        setProtocols(transformedProtocols);

        // Set dashboard statistics from the dashboard endpoint
        if (dashboardData.success && dashboardData.data) {
          setStats({
            totalPatients: dashboardData.data.totalPatients,
            activeProtocols: dashboardData.data.activeProtocols,
            totalProtocols: dashboardData.data.totalProtocols,
            completedToday: dashboardData.data.completedToday
          });
        } else {
          // Fallback to calculated stats if dashboard endpoint fails
          const totalPatients = transformedPatients.length || 0;
          const totalProtocols = transformedProtocols.length || 0;
          const activeProtocols = transformedPatients.reduce(
            (count: number, patient: Patient) => count + patient.assignedProtocols.filter((p: {isActive: boolean}) => p.isActive).length, 
            0
          );
          
          setStats({
            totalPatients,
            activeProtocols,
            totalProtocols,
            completedToday: 0
          });
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

  const getPatientInitials = (name?: string) => {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveProtocolForPatient = (patient: Patient) => {
    return patient.assignedProtocols.find(p => p.isActive);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-100 rounded-xl w-36 animate-pulse"></div>
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
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-7 bg-gray-100 rounded w-8 animate-pulse"></div>
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
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-8 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
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
                        <div className="flex items-center gap-3">
                          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-5 bg-gray-100 rounded-lg w-16 animate-pulse"></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
                          <div className="h-3 bg-gray-100 rounded w-16 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div className="mt-8 bg-white border border-gray-200 shadow-lg rounded-2xl">
              <div className="p-6 pb-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <div className="p-6 pt-0">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-100 rounded w-16 animate-pulse"></div>
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

  // Show onboarding if no protocols exist
  if (!isLoading && protocols.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Welcome to CXLUS
                </h1>
                <p className="text-gray-600 font-medium">
                  Let's set up your first protocol to get started
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Protocols</p>
                      <h3 className="text-2xl font-bold text-gray-900">0</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                      <UsersIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Patients</p>
                      <h3 className="text-2xl font-bold text-gray-900">0</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active</p>
                      <h3 className="text-2xl font-bold text-gray-900">0</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <ClockIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <h3 className="text-2xl font-bold text-gray-900">0</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Quick Start Card */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl col-span-2">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Quick Start Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white rounded-xl">
                          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Create Your First Protocol</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Start by creating your first protocol template with customized sessions and tasks.
                      </p>
                      <Button
                        onClick={() => router.push('/doctor/onboarding')}
                        className="w-full bg-white text-blue-600 hover:bg-blue-50 border border-blue-200"
                      >
                        Create Your First Protocol
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white rounded-xl">
                          <UserPlusIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Add Patients</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        After creating a protocol, you can start adding patients and assigning protocols.
                      </p>
                      <Button
                        disabled
                        className="w-full bg-white text-gray-400 border border-gray-200 cursor-not-allowed"
                      >
                        Add Patient
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white rounded-xl">
                          <CalendarDaysIcon className="w-6 h-6 text-gray-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Track Progress</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Monitor patient progress and manage their treatment protocols effectively.
                      </p>
                      <Button
                        disabled
                        className="w-full bg-white text-gray-400 border border-gray-200 cursor-not-allowed"
                      >
                        View Progress
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Help Section */}
            <div className="mt-8">
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-gray-900">Need Help?</h3>
                      <p className="text-sm text-gray-600">
                        Check out our documentation or contact support for assistance
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Link 
                        href="/help"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Documentation
                      </Link>
                      <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        Contact Support
                      </Link>
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

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
        
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-large font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 font-medium">
                Welcome, {session?.user?.name}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  // Intelligent routing based on current state
                  if (stats.totalPatients === 0 && stats.totalProtocols === 0) {
                    // First time user - go to protocol onboarding first
                    router.push('/doctor/onboarding');
                  } else if (stats.totalPatients === 0 && stats.totalProtocols > 0) {
                    // Has protocols but no patients - use smart patient onboarding
                    router.push('/doctor/patients/onboarding');
                  } else {
                    // Regular add patient flow
                    router.push('/doctor/patients/smart-add');
                  }
                }}
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
              >
                <UserPlusIcon className="h-4 w-4 mr-2" />
                New Client
              </Button>
              <Button 
                asChild
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-6 shadow-md font-semibold"
              >
                <Link href="/doctor/protocols">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Protocol
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#5154e7]/10 rounded-xl">
                    <UsersIcon className="h-6 w-6 text-[#5154e7]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Clients</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-xl">
                    <ClockIcon className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Active Protocols</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeProtocols}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-100 rounded-xl">
                    <DocumentTextIcon className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Total Protocols</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalProtocols}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500 font-semibold">Completed Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Active Clients */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Active Clients</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-semibold">
                  <Link href="/doctor/patients">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {patients.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4 font-medium">No clients registered</p>
                    <Button className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold" size="sm" asChild>
                      <Link href="/doctor/patients/smart-add">Add first client</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patients.slice(0, 5).map((patient) => {
                      const activeProtocol = getActiveProtocolForPatient(patient);
                      
                      return (
                        <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-4">
                            {/* Simple Avatar */}
                            <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-sm font-bold text-teal-600">
                              {getPatientInitials(patient.name)}
                            </div>
                            <div className="space-y-1">
                              <p className="font-bold text-gray-900">{patient.name || 'No name'}</p>
                              <p className="text-sm text-gray-500 font-medium">{patient.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {activeProtocol ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm bg-teal-100 text-teal-700 border border-teal-200 font-semibold">
                                {activeProtocol.protocol.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm bg-gray-100 text-gray-600 border border-gray-200 font-medium">
                                No protocol
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Created Protocols */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Created Protocols</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-semibold">
                  <Link href="/doctor/protocols">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {protocols.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4 font-medium">No protocols created</p>
                    <Button className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold" size="sm" asChild>
                      <Link href="/doctor/protocols">Create first protocol</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {protocols.slice(0, 5).map((protocol) => {
                      const activeAssignments = protocol.assignments.filter(a => a.isActive).length;
                      
                      return (
                        <div key={protocol.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-gray-900">{protocol.name}</p>
                              {protocol.isTemplate && (
                                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-[#5154e7]/10 text-[#5154e7] border border-[#5154e7]/20 font-semibold">
                                  Template
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500 font-medium">
                                  {protocol.duration} days
                                </span>
                              </div>
                              {activeAssignments > 0 && (
                                <span className="text-sm text-teal-600 font-semibold">
                                  {activeAssignments} active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8 bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-bold text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-3 border-gray-300 bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 rounded-2xl shadow-md font-semibold"
                  onClick={() => {
                    if (stats.totalPatients === 0 && stats.totalProtocols > 0) {
                      router.push('/doctor/patients/onboarding');
                    } else {
                      router.push('/doctor/patients/smart-add');
                    }
                  }}
                >
                  <UserPlusIcon className="h-8 w-8" />
                  <span className="text-sm">Add Client</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-3 border-gray-300 bg-white text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-300 rounded-2xl shadow-md font-semibold"
                  asChild
                >
                  <Link href="/doctor/protocols">
                    <PlusIcon className="h-8 w-8" />
                    <span className="text-sm">Create Protocol</span>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-3 border-gray-300 bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 rounded-2xl shadow-md font-semibold"
                  asChild
                >
                  <Link href="/doctor/templates">
                    <DocumentTextIcon className="h-8 w-8" />
                    <span className="text-sm">Templates</span>
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-24 flex-col gap-3 border-gray-300 bg-white text-gray-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 rounded-2xl shadow-md font-semibold"
                  asChild
                >
                  <Link href="/doctor/patients">
                    <UsersIcon className="h-8 w-8" />
                    <span className="text-sm">View Clients</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 