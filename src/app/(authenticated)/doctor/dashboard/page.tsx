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
  CalendarDaysIcon
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

        // Load clients
        const patientsResponse = await fetch('/api/patients');
        if (!patientsResponse.ok) {
          console.error('Error loading clients:', patientsResponse.status);
          return;
        }
        const patientsData = await patientsResponse.json();
        
        // Load protocols
        const protocolsResponse = await fetch('/api/protocols');
        const protocolsData = await protocolsResponse.json();

        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setProtocols(Array.isArray(protocolsData) ? protocolsData : []);

        // Calculate statistics
        const totalPatients = patientsData.length || 0;
        const activeProtocols = patientsData.reduce((acc: number, patient: Patient) => {
          return acc + patient.assignedProtocols.filter(p => p.isActive).length;
        }, 0);
        const totalProtocols = protocolsData.length || 0;

        setStats({
          totalPatients,
          activeProtocols,
          totalProtocols,
          completedToday: 0 // TODO: Implement daily completion statistics
        });

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
        
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="text-gray-500 font-medium">
                Welcome, {session?.user?.name}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                asChild
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
              >
                <Link href="/doctor/patients">
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  New Client
                </Link>
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
                      <Link href="/doctor/patients">Add first client</Link>
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
                  asChild
                >
                  <Link href="/doctor/patients">
                    <UserPlusIcon className="h-8 w-8" />
                    <span className="text-sm">Add Client</span>
                  </Link>
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