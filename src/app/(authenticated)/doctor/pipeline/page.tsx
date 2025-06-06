'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { PhoneIcon, CalendarIcon, PencilIcon, LinkIcon, ArrowPathIcon, PlusIcon, UserGroupIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

// Dynamic import to resolve server rendering issues
const DragDropContextLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.DragDropContext),
  { ssr: false }
);

const DroppableLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Droppable),
  { ssr: false }
);

const DraggableLib = dynamic(
  () => import('@hello-pangea/dnd').then(mod => mod.Draggable),
  { ssr: false }
);

// Types for dynamic import case
type DroppableProvided = any;
type DraggableProvided = any;
type DropResult = any;

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  status?: string;
  appointmentDate?: string;
  createdAt?: string;
  source?: string;
  referralScore?: number;
  conversionProbability?: number;
  lastActivity?: string;
  indication?: {
    name?: string;
    slug: string;
  };
}

interface Pipeline {
  id: string;
  name: string;
  description?: string;
  columns?: {
    id: string;
    title: string;
  }[];
}

// Referral-based pipeline columns
const columns = [
  { id: 'prospect', title: 'Prospects', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'contacted', title: 'Contacted', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'qualified', title: 'Qualified', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'converted', title: 'Converted', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'lost', title: 'Lost', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const statusMap: { [key: string]: string } = {
  'prospect': 'Prospect',
  'contacted': 'Contacted',
  'qualified': 'Qualified',
  'converted': 'Converted',
  'lost': 'Lost'
};

export default function PipelinePage() {
  const { data: session, status } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dashboardData, setDashboardData] = useState<{ 
    totalLeads: number;
    totalIndications: number;
    conversionRate: number;
    avgReferralScore: number;
  } | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [currentPipelineId, setCurrentPipelineId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.id) {
      fetchPipelines();
      fetchDashboardData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setLeads([]);
    }
  }, [session, status]);

  useEffect(() => {
    if (currentPipelineId) {
      fetchLeads();
    }
  }, [currentPipelineId]);

  const fetchPipelines = async () => {
    try {
      // Mock data for referral pipeline
      const mockPipelines = [
        { id: '1', name: 'Referral Pipeline', description: 'Patient referral management system' }
      ];
      setPipelines(mockPipelines);
      setCurrentPipelineId('1');
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      toast.error('Unable to load pipelines. Please try again.');
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // Mock referral data
      const mockLeads: Lead[] = [
        {
          id: '1',
          name: 'Sarah Johnson',
          phone: '+1 (555) 123-4567',
          email: 'sarah.j@email.com',
          status: 'Prospect',
          interest: 'Cosmetic Surgery',
          source: 'Instagram',
          referralScore: 85,
          conversionProbability: 75,
          lastActivity: 'Today',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Michael Chen',
          phone: '+1 (555) 234-5678',
          email: 'michael.c@email.com',
          status: 'Contacted',
          interest: 'Dental Implants',
          source: 'Google Ads',
          referralScore: 92,
          conversionProbability: 88,
          lastActivity: '1 day ago',
          appointmentDate: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '3',
          name: 'Emma Davis',
          phone: '+1 (555) 345-6789',
          email: 'emma.d@email.com',
          status: 'Qualified',
          interest: 'Orthodontics',
          source: 'Referral',
          referralScore: 78,
          conversionProbability: 65,
          lastActivity: '2 days ago',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '4',
          name: 'James Wilson',
          phone: '+1 (555) 456-7890',
          email: 'james.w@email.com',
          status: 'Converted',
          interest: 'General Consultation',
          source: 'Website',
          referralScore: 95,
          conversionProbability: 100,
          lastActivity: '3 days ago',
          createdAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: '5',
          name: 'Lisa Anderson',
          phone: '+1 (555) 567-8901',
          email: 'lisa.a@email.com',
          status: 'Lost',
          interest: 'Teeth Whitening',
          source: 'Facebook',
          referralScore: 45,
          conversionProbability: 0,
          lastActivity: '1 week ago',
          createdAt: new Date(Date.now() - 604800000).toISOString()
        }
      ];

      setLeads(mockLeads);
      toast.success('Pipeline data updated successfully');
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads. Please refresh the page.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Mock dashboard data
      setDashboardData({
        totalLeads: 24,
        totalIndications: 8,
        conversionRate: 32,
        avgReferralScore: 78
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = statusMap[destination.droppableId];
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    // Update local state immediately
    setLeads(leads.map(l => 
      l.id === draggableId ? { ...l, status: newStatus } : l
    ));

    // Professional toast messages without emojis
    const statusMessages: { [key: string]: string } = {
      'Prospect': `${lead.name} moved to prospects`,
      'Contacted': `${lead.name} marked as contacted`,
      'Qualified': `${lead.name} qualified successfully`,
      'Converted': `${lead.name} converted to patient`,
      'Lost': `${lead.name} moved to lost opportunities`
    };

    toast.success(statusMessages[newStatus] || `${lead.name} moved to ${newStatus}`);
  };

  const getColumnLeads = (columnId: string) => {
    if (!Array.isArray(leads)) return [];
    
    try {
      return leads.filter(lead => {
        if (columnId === 'prospect') {
          return lead.status === 'Prospect' || !lead.status;
        }
        return lead.status === statusMap[columnId];
      });
    } catch (error) {
      console.error('Error filtering leads for column:', columnId, error);
      return [];
    }
  };

  const getLeadInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-2xl"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-96 bg-gray-100 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DragDropContextLib onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6 lg:mb-8">
              <div className="space-y-1 lg:space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Referral Pipeline
                </h1>
                <p className="text-sm lg:text-base text-gray-600 font-medium">
                  Manage patient referrals and conversions
                </p>
              </div>
              
              <div className="flex gap-2 lg:gap-3">
                <Button 
                  className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-4 lg:px-6 shadow-md font-semibold text-sm lg:text-base"
                  onClick={() => {
                    toast.success('Refreshing pipeline data...');
                    fetchLeads();
                  }}
                >
                  <ArrowPathIcon className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            {dashboardData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                <Card className="bg-white border-blue-200 shadow-lg rounded-2xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 lg:p-3 bg-blue-100 rounded-xl">
                        <UserGroupIcon className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs lg:text-sm text-gray-500 font-semibold">Total Referrals</p>
                        <p className="text-xl lg:text-2xl font-bold text-blue-600">{dashboardData.totalLeads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-emerald-200 shadow-lg rounded-2xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 lg:p-3 bg-emerald-100 rounded-xl">
                        <SparklesIcon className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs lg:text-sm text-gray-500 font-semibold">Conversion Rate</p>
                        <p className="text-xl lg:text-2xl font-bold text-emerald-600">{dashboardData.conversionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-purple-200 shadow-lg rounded-2xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 lg:p-3 bg-purple-100 rounded-xl">
                        <CalendarIcon className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs lg:text-sm text-gray-500 font-semibold">Avg. Score</p>
                        <p className="text-xl lg:text-2xl font-bold text-purple-600">{dashboardData.avgReferralScore}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-yellow-200 shadow-lg rounded-2xl">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center gap-3 lg:gap-4">
                      <div className="p-2 lg:p-3 bg-yellow-100 rounded-xl">
                        <PlusIcon className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs lg:text-sm text-gray-500 font-semibold">Active Leads</p>
                        <p className="text-xl lg:text-2xl font-bold text-yellow-600">{leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost').length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Pipeline Board */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
              {columns.map((column) => (
                <Card key={column.id} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="p-4 lg:p-6 pb-3 lg:pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base lg:text-lg font-bold text-gray-900">{column.title}</CardTitle>
                      <Badge className={`${column.color} text-xs font-semibold border`}>
                        {getColumnLeads(column.id).length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 lg:p-6 pt-0">
                    <DroppableLib droppableId={column.id} key={column.id}>
                      {(provided: DroppableProvided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3 min-h-[400px]"
                        >
                          {getColumnLeads(column.id).map((lead, index) => (
                            <DraggableLib key={lead.id} draggableId={lead.id} index={index}>
                              {(provided: DraggableProvided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200"
                                  onDoubleClick={() => {
                                    setEditingLead(lead);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                                          {getLeadInitials(lead.name)}
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-gray-900 text-sm">{lead.name}</h4>
                                          <p className="text-xs text-gray-500">{lead.lastActivity}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {lead.interest && (
                                      <div className="text-xs text-gray-600">
                                        <span className="font-medium">Interest:</span> {lead.interest}
                                      </div>
                                    )}

                                    {lead.referralScore && (
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-500">Referral Score</span>
                                          <span className={`text-xs font-bold ${getScoreColor(lead.referralScore)}`}>
                                            {lead.referralScore}
                                          </span>
                                        </div>
                                        <Progress value={lead.referralScore} className="h-2" />
                                      </div>
                                    )}

                                    {lead.conversionProbability !== undefined && (
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-500">Conversion</span>
                                          <span className={`text-xs font-bold ${getScoreColor(lead.conversionProbability)}`}>
                                            {lead.conversionProbability}%
                                          </span>
                                        </div>
                                        <Progress value={lead.conversionProbability} className="h-2" />
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <PhoneIcon className="h-3 w-3" />
                                        <span className="truncate">{lead.phone}</span>
                                      </div>
                                      {lead.source && (
                                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                                          {lead.source}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DraggableLib>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </DroppableLib>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal - keeping the existing modal structure */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) setIsEditMode(false);
      }}>
        <DialogPortal>
          <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] lg:max-w-[800px] p-0 overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-3xl">
            <DialogHeader className="p-4 sm:p-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex flex-row justify-between items-start">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 sm:w-2 sm:h-2 rounded-full ${
                  editingLead?.status === 'Contacted' ? 'bg-yellow-500' :
                  editingLead?.status === 'Qualified' ? 'bg-purple-500' :
                  editingLead?.status === 'Converted' ? 'bg-emerald-500' :
                  editingLead?.status === 'Lost' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}></div>
                <div>
                  <DialogTitle className="text-lg sm:text-base font-bold text-gray-900 tracking-[-0.03em] font-inter">{editingLead?.name}</DialogTitle>
                  <DialogDescription className="text-sm sm:text-xs text-gray-600 tracking-[-0.03em] font-inter">Status: {editingLead?.status || 'Prospect'}</DialogDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-800 h-8 w-8 sm:h-7 sm:w-7 p-0"
              >
                <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogHeader>

            {editingLead && (
              <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-4">
                <div className="space-y-5 sm:space-y-4">
                  {/* Referral Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 bg-white/80 backdrop-blur-sm p-5 sm:p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                    <div>
                      <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Phone</h4>
                      <p className="flex items-center truncate text-gray-800 text-base sm:text-sm">
                        <PhoneIcon className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1.5 flex-shrink-0 text-gray-500" />
                        <a href={`tel:${editingLead.phone}`} className="hover:text-gray-700 truncate">{editingLead.phone}</a>
                      </p>
                    </div>
                    
                    {editingLead.email && (
                      <div>
                        <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Email</h4>
                        <p className="truncate text-gray-800 text-base sm:text-sm">
                          <a href={`mailto:${editingLead.email}`} className="hover:text-gray-700">{editingLead.email}</a>
                        </p>
                      </div>
                    )}

                    {editingLead.interest && (
                      <div>
                        <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Interest</h4>
                        <p className="truncate text-gray-800 text-base sm:text-sm">{editingLead.interest}</p>
                      </div>
                    )}

                    {editingLead.source && (
                      <div>
                        <h4 className="text-sm sm:text-xs font-medium text-gray-500 mb-1">Source</h4>
                        <p className="truncate text-gray-800 text-base sm:text-sm">{editingLead.source}</p>
                      </div>
                    )}
                  </div>

                  {/* Referral Scores */}
                  {(editingLead.referralScore || editingLead.conversionProbability) && (
                    <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-4 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0">
                      <h3 className="text-base sm:text-sm font-bold text-gray-900 tracking-[-0.03em] font-inter mb-4 sm:mb-3">
                        Referral Analytics
                      </h3>
                      
                      <div className="space-y-4">
                        {editingLead.referralScore && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Referral Score</span>
                              <span className={`text-sm font-bold ${getScoreColor(editingLead.referralScore)}`}>
                                {editingLead.referralScore}/100
                              </span>
                            </div>
                            <Progress value={editingLead.referralScore} className="h-3" />
                          </div>
                        )}

                        {editingLead.conversionProbability !== undefined && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Conversion Probability</span>
                              <span className={`text-sm font-bold ${getScoreColor(editingLead.conversionProbability)}`}>
                                {editingLead.conversionProbability}%
                              </span>
                            </div>
                            <Progress value={editingLead.conversionProbability} className="h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-end space-x-3 pt-4 sm:pt-3 mt-2 sm:mt-1 border-t border-gray-200">
                    <Button 
                      variant="outline"
                      className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-10 sm:h-8 text-sm sm:text-xs font-medium"
                      onClick={() => window.open(`https://wa.me/${editingLead.phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="w-4 h-4 sm:w-3.5 sm:h-3.5 mr-2 sm:mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                      </svg>
                      WhatsApp
                    </Button>
                    
                    <Button 
                      className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-10 sm:h-8 text-sm sm:text-xs font-medium"
                      onClick={() => setIsEditMode(true)}
                    >
                      <PencilIcon className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-2 sm:mr-1.5 flex-shrink-0" />
                      Edit Referral
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </DragDropContextLib>
  );
} 