'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  PencilIcon,
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ShoppingBagIcon,
  LinkIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CheckinQuestionsManager from '@/components/protocol/checkin-questions-manager';
import CheckinResponsesDashboard from '@/components/checkin/checkin-responses-dashboard';
import { toast } from 'react-hot-toast';
import { ProtocolTaskModal } from '@/components/protocol/protocol-task-modal';

interface ProtocolTask {
  id: string;
  title: string;
  description?: string;
  order: number;
  hasMoreInfo?: boolean;
  videoUrl?: string;
  fullExplanation?: string;
  modalTitle?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  title: string;
  sessions: ProtocolSession[];
}

interface ProtocolSession {
  id: string;
  title: string;
  tasks: ProtocolTask[];
}

interface Assignment {
  id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  imageUrl?: string;
  originalPrice?: number;
  discountPrice?: number;
  purchaseUrl?: string;
}

interface ProtocolProduct {
  id: string;
  productId: string;
  order: number;
  isRequired: boolean;
  notes?: string;
  product: Product;
}

interface Protocol {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  show_doctor_info?: boolean;
  modal_title?: string;
  modal_video_url?: string;
  modal_description?: string;
  modal_button_text?: string;
  modal_button_url?: string;
  cover_image?: string;
  onboarding_template_id?: string;
  days: ProtocolDay[];
  doctor: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  is_template: boolean;
  is_recurring: boolean;
  recurring_interval: string;
  recurring_days: number[];
  prescriptions: Assignment[];
  products?: ProtocolProduct[];
}

export default function ProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin-questions' | 'checkin-responses'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    task: ProtocolTask;
    dayNumber: number;
    sessionTitle?: string;
  } | null>(null);
  const [expandedDayId, setExpandedDayId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      loadProtocol();
    }
  }, [params.id]);

  const loadProtocol = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/protocols/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load protocol');
      }
      
      setProtocol(data);
    } catch (error) {
      console.error('Error loading protocol:', error);
      toast.error('Failed to load protocol');
      router.push('/doctor/protocols');
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveAssignments = () => {
    return protocol?.prescriptions.filter((a: Assignment) => a.isActive) || [];
  };

  const getPatientInitials = (name?: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleConsultationDateChange = async (date: Date | null) => {
    if (!protocol) return;

    try {
      const response = await fetch(`/api/protocols/${protocol.id}/consultation-date`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationDate: date })
      });

      if (response.ok) {
        const updatedProtocol = await response.json();
        setProtocol(prev => prev ? {
          ...prev,
          consultation_date: updatedProtocol.consultation_date
        } : null);
      } else {
        console.error('Failed to update consultation date');
      }
    } catch (error) {
      console.error('Error updating consultation date:', error);
    }
  };

  const handleUpdateProtocol = async (updatedProtocol: any) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/protocols/${(protocol as Protocol).id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updatedProtocol.name,
          description: updatedProtocol.description,
          duration: updatedProtocol.duration,
          show_doctor_info: updatedProtocol.show_doctor_info,
          modal_title: updatedProtocol.modal_title,
          modal_video_url: updatedProtocol.modal_video_url,
          modal_description: updatedProtocol.modal_description,
          modal_button_text: updatedProtocol.modal_button_text,
          modal_button_url: updatedProtocol.modal_button_url,
          cover_image: updatedProtocol.cover_image,
          onboarding_template_id: updatedProtocol.onboarding_template_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update protocol');
      }

      loadProtocol();
      toast.success('Protocol updated successfully');
    } catch (error) {
      console.error('Error updating protocol:', error);
      toast.error('Failed to update protocol');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !protocol) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                </div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="border-b border-gray-200 mb-8">
              <div className="flex space-x-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 space-y-8">
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
                      <div className="space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
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

  const activeAssignments = getActiveAssignments();

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
        
          {/* Header */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/protocols">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {protocol.name}
                </h1>
                {protocol.is_template && (
                  <Badge className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                    Template
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 font-medium">
                {protocol.description || 'No description'}
              </p>
            </div>
            <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
              <Link href={`/doctor/protocols/${protocol.id}/edit`}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === 'overview'
                    ? "border-[#5154e7] text-[#5154e7]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="w-4 h-4" />
                  Overview
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('checkin-questions')}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === 'checkin-questions'
                    ? "border-[#5154e7] text-[#5154e7]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <Cog6ToothIcon className="w-4 h-4" />
                  Check-in Questions
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('checkin-responses')}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === 'checkin-responses'
                    ? "border-[#5154e7] text-[#5154e7]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4" />
                  Check-in Responses
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Protocol Info */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* Stats */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-teal-100 rounded-xl">
                        <CalendarDaysIcon className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Duration</p>
                        <p className="text-lg font-bold text-gray-900">{protocol.duration} days</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl">
                        <UsersIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Active Patients</p>
                        <p className="text-lg font-bold text-gray-900">{activeAssignments.length}</p>
                      </div>
                    </div>
                    
                    {/* Recurring Configuration */}
                    {protocol.is_recurring && (
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-medium">Recurring</p>
                          <p className="text-lg font-bold text-gray-900">
                            {protocol.recurring_interval === 'DAILY' ? 'Daily' : 'Weekly'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Patients */}
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-3">
                        <UsersIcon className="h-5 w-5" />
                        Active Patients
                      </CardTitle>
                      {activeAssignments.length > 0 && (
                        <Badge className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                          {activeAssignments.length}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeAssignments.length === 0 ? (
                      <div className="text-center py-8">
                        <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">
                          No active patients
                        </p>
                        <Button
                          asChild
                          variant="outline"
                          className="mt-4 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                        >
                          <Link href={`/doctor/protocols/${protocol.id}/assign`}>
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Assign to Patient
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeAssignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-900">
                              {getPatientInitials(assignment.user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {assignment.user.name || assignment.user.email}
                              </p>
                            </div>
                          </div>
                        ))}

                        <Button
                          asChild
                          variant="outline"
                          className="w-full mt-4 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl"
                        >
                          <Link href={`/doctor/protocols/${protocol.id}/assign`}>
                            <UserPlusIcon className="h-4 w-4 mr-2" />
                            Assign to More Patients
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Protocol Days */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-6">
                  {protocol.days.map((day) => (
                    <Card key={day.id} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                      <CardContent className="p-6">
                        <button
                          onClick={() => setExpandedDayId(expandedDayId === day.id ? null : day.id)}
                          className="w-full"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {day.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {day.sessions.length} sessions • {day.sessions.reduce((total, session) => total + session.tasks.length, 0)} tasks
                              </p>
                            </div>
                            <ChevronDownIcon 
                              className={cn(
                                "h-5 w-5 text-gray-400 transition-transform",
                                expandedDayId === day.id ? "rotate-180" : ""
                              )}
                            />
                          </div>
                        </button>

                        {/* Show sessions when day is expanded */}
                        {expandedDayId === day.id && (
                          <div className="mt-6 space-y-6">
                            {day.sessions.map((session) => (
                              <div key={session.id} className="border-t border-gray-100 pt-4">
                                <button
                                  onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                                  className="w-full text-left"
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-[#5154e7] uppercase tracking-wider">
                                      {session.title}
                                    </h4>
                                    <ChevronDownIcon 
                                      className={cn(
                                        "h-4 w-4 text-gray-400 transition-transform",
                                        expandedSessionId === session.id ? "rotate-180" : ""
                                      )}
                                    />
                                  </div>
                                </button>

                                {/* Show tasks when session is expanded */}
                                {expandedSessionId === session.id && (
                                  <div className="mt-4 space-y-3">
                                    {session.tasks.map((task) => (
                                      <button
                                        key={task.id}
                                        onClick={() => setSelectedTask({ 
                                          task, 
                                          dayNumber: day.dayNumber,
                                          sessionTitle: session.title
                                        })}
                                        className="w-full text-left p-3 bg-blue-50 rounded-xl border border-blue-200 hover:border-[#5154e7]/30 hover:bg-blue-100 transition-colors"
                                      >
                                        <div className="flex items-center justify-between gap-3">
                                          <h4 className="font-medium text-gray-900">{task.title}</h4>
                                          {(task.hasMoreInfo || task.videoUrl || task.fullExplanation || task.modalButtonUrl) && (
                                            <Badge className="bg-[#5154e7]/10 text-[#5154e7] border-[#5154e7]/20">
                                              More Info
                                            </Badge>
                                          )}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Task Details Modal */}
              {selectedTask && (
                <ProtocolTaskModal
                  isOpen={!!selectedTask}
                  onClose={() => setSelectedTask(null)}
                  task={selectedTask.task}
                  dayNumber={selectedTask.dayNumber}
                  sessionTitle={selectedTask.sessionTitle}
                />
              )}
            </div>
          )}

          {/* Check-in Questions Tab */}
          {activeTab === 'checkin-questions' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <CheckinQuestionsManager protocolId={protocol.id} />
            </div>
          )}

          {/* Check-in Responses Tab */}
          {activeTab === 'checkin-responses' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <CheckinResponsesDashboard 
                protocolId={protocol.id} 
                protocolName={protocol.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 