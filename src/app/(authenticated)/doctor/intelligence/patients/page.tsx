'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PatientOpportunity {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'READY_FOR_UPSELL' | 'HIGH_ENGAGEMENT' | 'NEEDS_ATTENTION' | 'NEW_PATIENT';
  completionRate: number;
  engagementScore: number;
  lastActivity: string;
  upsellPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  totalSpent: number;
  joinDate: string;
  protocolsCompleted: number;
  totalProtocols: number;
}

export default function AllPatientsPage() {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<PatientOpportunity[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPatientsData();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, selectedFilter, searchTerm]);

  const loadPatientsData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call with expanded mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPatients: PatientOpportunity[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+1 (555) 123-4567',
          status: 'READY_FOR_UPSELL',
          completionRate: 95,
          engagementScore: 92,
          lastActivity: 'Today',
          upsellPotential: 'HIGH',
          recommendedAction: 'Offer premium protocol',
          riskLevel: 'LOW',
          totalSpent: 2500,
          joinDate: '2024-01-15',
          protocolsCompleted: 4,
          totalProtocols: 5
        },
        {
          id: '2',
          name: 'Michael Chen',
          email: 'michael.c@email.com',
          phone: '+1 (555) 234-5678',
          status: 'HIGH_ENGAGEMENT',
          completionRate: 88,
          engagementScore: 85,
          lastActivity: '1 day ago',
          upsellPotential: 'HIGH',
          recommendedAction: 'Schedule consultation',
          riskLevel: 'LOW',
          totalSpent: 1800,
          joinDate: '2024-02-20',
          protocolsCompleted: 3,
          totalProtocols: 4
        },
        {
          id: '3',
          name: 'Emma Davis',
          email: 'emma.d@email.com',
          phone: '+1 (555) 345-6789',
          status: 'READY_FOR_UPSELL',
          completionRate: 92,
          engagementScore: 89,
          lastActivity: 'Today',
          upsellPotential: 'MEDIUM',
          recommendedAction: 'Present upgrade options',
          riskLevel: 'LOW',
          totalSpent: 3200,
          joinDate: '2023-11-10',
          protocolsCompleted: 5,
          totalProtocols: 6
        },
        {
          id: '4',
          name: 'James Wilson',
          email: 'james.w@email.com',
          phone: '+1 (555) 456-7890',
          status: 'HIGH_ENGAGEMENT',
          completionRate: 78,
          engagementScore: 82,
          lastActivity: '2 days ago',
          upsellPotential: 'MEDIUM',
          recommendedAction: 'Send personalized content',
          riskLevel: 'MEDIUM',
          totalSpent: 1200,
          joinDate: '2024-03-05',
          protocolsCompleted: 2,
          totalProtocols: 3
        },
        {
          id: '5',
          name: 'Lisa Anderson',
          email: 'lisa.a@email.com',
          phone: '+1 (555) 567-8901',
          status: 'NEEDS_ATTENTION',
          completionRate: 45,
          engagementScore: 38,
          lastActivity: '5 days ago',
          upsellPotential: 'LOW',
          recommendedAction: 'Re-engagement campaign',
          riskLevel: 'HIGH',
          totalSpent: 800,
          joinDate: '2024-01-30',
          protocolsCompleted: 1,
          totalProtocols: 3
        },
        {
          id: '6',
          name: 'David Rodriguez',
          email: 'david.r@email.com',
          phone: '+1 (555) 678-9012',
          status: 'NEW_PATIENT',
          completionRate: 25,
          engagementScore: 65,
          lastActivity: 'Today',
          upsellPotential: 'MEDIUM',
          recommendedAction: 'Welcome sequence',
          riskLevel: 'MEDIUM',
          totalSpent: 400,
          joinDate: '2024-03-20',
          protocolsCompleted: 0,
          totalProtocols: 2
        },
        {
          id: '7',
          name: 'Jennifer Kim',
          email: 'jennifer.k@email.com',
          phone: '+1 (555) 789-0123',
          status: 'HIGH_ENGAGEMENT',
          completionRate: 85,
          engagementScore: 88,
          lastActivity: '1 day ago',
          upsellPotential: 'HIGH',
          recommendedAction: 'Offer advanced program',
          riskLevel: 'LOW',
          totalSpent: 2100,
          joinDate: '2023-12-15',
          protocolsCompleted: 3,
          totalProtocols: 4
        },
        {
          id: '8',
          name: 'Robert Taylor',
          email: 'robert.t@email.com',
          phone: '+1 (555) 890-1234',
          status: 'NEEDS_ATTENTION',
          completionRate: 35,
          engagementScore: 42,
          lastActivity: '1 week ago',
          upsellPotential: 'LOW',
          recommendedAction: 'Urgent follow-up',
          riskLevel: 'CRITICAL',
          totalSpent: 600,
          joinDate: '2024-02-01',
          protocolsCompleted: 1,
          totalProtocols: 4
        }
      ];

      setPatients(mockPatients);
      
    } catch (error) {
      console.error('Error loading patients data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filter by status
    if (selectedFilter !== 'ALL') {
      filtered = filtered.filter(p => p.status === selectedFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPatients(filtered);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      READY_FOR_UPSELL: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Ready for Upsell' },
      HIGH_ENGAGEMENT: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'High Engagement' },
      NEEDS_ATTENTION: { color: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Needs Attention' },
      NEW_PATIENT: { color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'New Patient' }
    };
    const config = configs[status as keyof typeof configs];
    return <Badge className={`${config.color} text-xs font-semibold border`}>{config.label}</Badge>;
  };

  const getRiskBadge = (risk: string) => {
    const configs = {
      LOW: { color: 'bg-emerald-100 text-emerald-700', label: 'Low Risk' },
      MEDIUM: { color: 'bg-yellow-100 text-yellow-700', label: 'Medium Risk' },
      HIGH: { color: 'bg-orange-100 text-orange-700', label: 'High Risk' },
      CRITICAL: { color: 'bg-red-100 text-red-700', label: 'Critical Risk' }
    };
    const config = configs[risk as keyof typeof configs];
    return <Badge className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  const getUpsellBadge = (potential: string) => {
    const configs = {
      HIGH: { color: 'bg-emerald-100 text-emerald-700', label: 'High Potential' },
      MEDIUM: { color: 'bg-blue-100 text-blue-700', label: 'Medium Potential' },
      LOW: { color: 'bg-slate-100 text-slate-700', label: 'Low Potential' }
    };
    const config = configs[potential as keyof typeof configs];
    return <Badge className={`${config.color} text-xs font-medium`}>{config.label}</Badge>;
  };

  const getPatientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-12 bg-gray-100 rounded-xl"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
              >
                <Link href="/doctor/intelligence">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Intelligence
                </Link>
              </Button>
              <div className="space-y-1 lg:space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  All Patients
                </h1>
                <p className="text-sm lg:text-base text-gray-600 font-medium">
                  Complete patient overview with risks and opportunities
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search patients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-300"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'READY_FOR_UPSELL', 'HIGH_ENGAGEMENT', 'NEEDS_ATTENTION', 'NEW_PATIENT'].map((status) => (
                <Button
                  key={status}
                  variant={selectedFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(status)}
                  className={`rounded-xl text-xs lg:text-sm ${
                    selectedFilter === status 
                      ? 'bg-[#5154e7] text-white hover:bg-[#4145d1]' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {status === 'ALL' ? 'All' : 
                   status === 'READY_FOR_UPSELL' ? 'Ready for Upsell' :
                   status === 'HIGH_ENGAGEMENT' ? 'High Engagement' : 
                   status === 'NEEDS_ATTENTION' ? 'Needs Attention' : 'New Patient'}
                </Button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredPatients.length}</span> of <span className="font-semibold">{patients.length}</span> patients
            </p>
          </div>

          {/* Patients List */}
          {filteredPatients.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8 lg:p-12 text-center">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient) => (
                <Card key={patient.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Patient Info */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                            {getPatientInitials(patient.name)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{patient.name}</h3>
                            <p className="text-sm text-gray-500">Joined {new Date(patient.joinDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <EnvelopeIcon className="h-4 w-4" />
                            <span>{patient.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <PhoneIcon className="h-4 w-4" />
                            <span>{patient.phone}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(patient.status)}
                          {getRiskBadge(patient.riskLevel)}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Completion Rate</span>
                            <span className="text-sm font-semibold">{patient.completionRate}%</span>
                          </div>
                          <Progress value={patient.completionRate} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Engagement Score</span>
                            <span className="text-sm font-semibold">{patient.engagementScore}</span>
                          </div>
                          <Progress value={patient.engagementScore} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-lg font-bold text-blue-600">${patient.totalSpent.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">Total Spent</p>
                          </div>
                          <div className="p-3 bg-emerald-50 rounded-lg">
                            <p className="text-lg font-bold text-emerald-600">{patient.protocolsCompleted}/{patient.totalProtocols}</p>
                            <p className="text-xs text-gray-600">Protocols</p>
                          </div>
                        </div>
                      </div>

                      {/* Opportunities & Actions */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Upsell Opportunity</h4>
                          {getUpsellBadge(patient.upsellPotential)}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recommended Action</h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {patient.recommendedAction}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-2">Last Activity: {patient.lastActivity}</p>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-lg text-xs">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg text-xs">
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
} 