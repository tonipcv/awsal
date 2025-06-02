'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  PlusIcon,
  EyeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface ProtocolAssignment {
  id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE';
  protocol: {
    id: string;
    name: string;
    duration: number;
    description?: string;
  };
}

interface CourseAssignment {
  id: string;
  startDate: Date;
  status: 'active' | 'inactive' | 'unavailable' | 'completed' | 'paused';
  course: {
    id: string;
    name: string;
    description?: string;
    _count: {
      modules: number;
      lessons: number;
    };
  };
}

interface Course {
  id: string;
  name: string;
  description?: string;
  _count: {
    modules: number;
    lessons: number;
  };
}

interface Patient {
  id: string;
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  referralCode?: string;
  assignedProtocols: ProtocolAssignment[];
  assignedCourses?: CourseAssignment[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isAssigningCourse, setIsAssigningCourse] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [showCourseModal, setShowCourseModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadPatient(params.id as string);
      loadAvailableCourses();
    }
  }, [params.id]);

  const loadPatient = async (patientId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
        // Load patient's assigned courses
        loadPatientCourses(patientId);
      } else {
        router.push('/doctor/patients');
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      router.push('/doctor/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const courses = await response.json();
        setAvailableCourses(courses);
      }
    } catch (error) {
      console.error('Error loading available courses:', error);
    }
  };

  const loadPatientCourses = async (patientId: string) => {
    try {
      const response = await fetch(`/api/courses/assign?patientId=${patientId}`);
      if (response.ok) {
        const assignments = await response.json();
        setPatient(prev => prev ? { ...prev, assignedCourses: assignments } : null);
      }
    } catch (error) {
      console.error('Error loading patient courses:', error);
    }
  };

  const assignCourse = async () => {
    if (!selectedCourseId || !patient) return;

    try {
      setIsAssigningCourse(true);
      const response = await fetch('/api/courses/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          patientId: patient.id,
          status: 'active'
        })
      });

      if (response.ok) {
        // Reload patient courses
        await loadPatientCourses(patient.id);
        setShowCourseModal(false);
        setSelectedCourseId('');
      } else {
        const error = await response.json();
        alert(`Error assigning course: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Error assigning course');
    } finally {
      setIsAssigningCourse(false);
    }
  };

  const getPatientInitials = (name?: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getActiveProtocols = () => {
    return patient?.assignedProtocols.filter(p => p.status === 'ACTIVE') || [];
  };

  const getCompletedProtocols = () => {
    return patient?.assignedProtocols.filter(p => p.status === 'INACTIVE') || [];
  };

  const getUnavailableProtocols = () => {
    return patient?.assignedProtocols.filter(p => p.status === 'UNAVAILABLE') || [];
  };

  const getActiveCourses = () => {
    return patient?.assignedCourses?.filter(c => c.status === 'active') || [];
  };

  const getCompletedCourses = () => {
    return patient?.assignedCourses?.filter(c => c.status === 'completed') || [];
  };

  const getCourseStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">Paused</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs">Inactive</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs">{status}</Badge>;
    }
  };

  const getAvailableCoursesForAssignment = () => {
    if (!patient) return [];
    return availableCourses.filter(course => 
      !patient.assignedCourses?.some(assignment => assignment.course.id === course.id)
    );
  };

  const safeFormatDate = (dateValue: any, fallback: string = 'Invalid date') => {
    if (!dateValue) return fallback;
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return fallback;
      }
      return format(date, 'MMM dd, yyyy', { locale: enUS });
    } catch (error) {
      console.error('Error formatting date:', error, 'Value:', dateValue);
      return fallback;
    }
  };

  const getProtocolProgress = (assignment: ProtocolAssignment) => {
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);
    const currentDate = new Date();
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = currentDate.getTime() - startDate.getTime();
    
    const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    
    return {
      progress: Math.round(progress),
      daysRemaining: Math.max(Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">Active</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">Completed</Badge>;
      case 'UNAVAILABLE':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs">Unavailable</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200 text-xs">{status}</Badge>;
    }
  };

  const copyReferralCode = () => {
    if (patient?.referralCode) {
      navigator.clipboard.writeText(patient.referralCode);
      alert('Referral code copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-100 rounded-2xl"></div>
                <div className="grid lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-gray-100 rounded-2xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Client not found</h2>
              <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl">
                <Link href="/doctor/patients">Back to Clients</Link>
          </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeProtocols = getActiveProtocols();
  const completedProtocols = getCompletedProtocols();
  const totalProtocols = patient.assignedProtocols.length;
  const activeCourses = getActiveCourses();
  const completedCourses = getCompletedCourses();
  const totalCourses = patient.assignedCourses?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
        
        {/* Header */}
          <div className="flex items-center gap-6 mb-8">
            <Button 
              variant="outline" 
              asChild 
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2 rounded-xl"
            >
            <Link href="/doctor/patients">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
            </Link>
          </Button>
          <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Client Details
            </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {patient.name || patient.email}
                </span>
              <span>•</span>
                <span className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  {totalProtocols} protocols
                </span>
              <span>•</span>
                <span className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  {activeProtocols.length} active
                </span>
              <span>•</span>
                <span className="flex items-center gap-2">
                  <BookOpenIcon className="h-4 w-4" />
                  {totalCourses} courses
                </span>
              </div>
            </div>
            <div className="flex gap-3">
            <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
              <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                  >
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                    Assign Course
                </Button>
              </DialogTrigger>
                <DialogContent className="bg-white border border-gray-200 shadow-xl rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">Assign Course to Client</DialogTitle>
                </DialogHeader>
                  <div className="space-y-6 p-2">
                  <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">
                        Select Course
                    </label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                        <SelectTrigger className="border-gray-300 bg-white text-gray-900 h-12 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200">
                          <SelectValue placeholder="Choose a course..." />
                      </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 shadow-lg rounded-xl">
                        {getAvailableCoursesForAssignment().map((course) => (
                          <SelectItem 
                            key={course.id} 
                            value={course.id} 
                              className="hover:bg-gray-50 focus:bg-gray-50 text-gray-900 cursor-pointer p-3"
                          >
                            <div>
                                <div className="font-semibold text-gray-900">{course.name}</div>
                                <div className="text-sm text-gray-600">
                                  {course._count?.modules || 0} modules • {course._count?.lessons || 0} lessons
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                    <div className="flex justify-end gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCourseModal(false)}
                        className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button 
                      onClick={assignCourse}
                      disabled={!selectedCourseId || isAssigningCourse}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                    >
                        {isAssigningCourse ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Assigning...</span>
                          </div>
                        ) : (
                          'Assign Course'
                        )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
              <Button 
                asChild 
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
              >
              <Link href={`/doctor/patients/${patient.id}/assign`}>
                <PlusIcon className="h-4 w-4 mr-2" />
                  Assign Protocol
              </Link>
            </Button>
          </div>
        </div>

          <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Patient Info Card */}
            <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-8">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="h-24 w-24 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl font-bold text-teal-600">
                    {getPatientInitials(patient.name)}
                  </div>
                </div>
                
                {/* Patient Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {patient.name || 'Name not provided'}
                      </h2>
                        <div className="flex items-center gap-3 text-base text-gray-600 mb-6">
                          <EnvelopeIcon className="h-5 w-5" />
                        <span>{patient.email}</span>
                        {patient.emailVerified ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-2 px-3 py-1 rounded-full">
                              <ShieldCheckIcon className="h-4 w-4" />
                              Verified
                          </Badge>
                        ) : (
                            <Badge className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-2 px-3 py-1 rounded-full">
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              Pending
                          </Badge>
                        )}
                      </div>
                      {patient.referralCode && (
                          <div className="flex items-center gap-3 text-base text-gray-600 mb-6">
                            <ClipboardDocumentIcon className="h-5 w-5" />
                            <span>Referral code: <strong className="text-gray-900">{patient.referralCode}</strong></span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={copyReferralCode}
                              className="h-8 px-3 text-sm border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg"
                          >
                              Copy
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{totalProtocols}</div>
                        <div className="text-sm text-gray-600 font-medium">Protocols</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">{activeProtocols.length}</div>
                        <div className="text-sm text-gray-600 font-medium">P. Active</div>
                    </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">{completedProtocols.length}</div>
                        <div className="text-sm text-gray-600 font-medium">P. Completed</div>
                    </div>
                      <div className="text-center p-4 bg-teal-50 rounded-xl">
                        <div className="text-2xl font-bold text-teal-600">{totalCourses}</div>
                        <div className="text-sm text-gray-600 font-medium">Courses</div>
                    </div>
                      <div className="text-center p-4 bg-teal-50 rounded-xl">
                        <div className="text-2xl font-bold text-teal-600">{activeCourses.length}</div>
                        <div className="text-sm text-gray-600 font-medium">C. Active</div>
                    </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">{completedCourses.length}</div>
                        <div className="text-sm text-gray-600 font-medium">C. Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            <div className="grid lg:grid-cols-3 gap-8">
            {/* Active Protocols */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="p-6 border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    Active Protocols
                    <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {activeProtocols.length}
                  </Badge>
                </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Protocols in progress</p>
              </CardHeader>
                <CardContent className="p-6 space-y-4">
                {activeProtocols.length === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-4">
                        No active protocols
                    </p>
                      <Button 
                        asChild 
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                      >
                      <Link href={`/doctor/patients/${patient.id}/assign`}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                          Assign First Protocol
                      </Link>
                    </Button>
                  </div>
                ) : (
                  activeProtocols.map((assignment) => {
                    const progress = getProtocolProgress(assignment);
                    
                    return (
                        <Card key={assignment.id} className="bg-white border border-gray-200 shadow-sm rounded-xl">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-base font-semibold text-gray-900">
                                  {assignment.protocol.name}
                                </h3>
                                {getStatusBadge(assignment.status)}
                              </div>
                              {assignment.protocol.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                  {assignment.protocol.description}
                                </p>
                              )}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{assignment.protocol.duration} days</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <CalendarDaysIcon className="h-4 w-4" />
                                  <span>
                                      Started {safeFormatDate(assignment.startDate)}
                                  </span>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild 
                                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-xl"
                              >
                              <Link href={`/doctor/protocols/${assignment.protocol.id}`}>
                                  <EyeIcon className="h-4 w-4 mr-1" />
                                  View
                              </Link>
                            </Button>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-medium">Progress</span>
                                <span className="text-teal-600 font-semibold">{progress.progress}%</span>
                            </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                  className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Active Courses */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="p-6 border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <AcademicCapIcon className="h-6 w-6 text-teal-600" />
                    Active Courses
                    <Badge className="bg-teal-50 text-teal-700 border-teal-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {activeCourses.length}
                  </Badge>
                </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">Courses in progress</p>
              </CardHeader>
                <CardContent className="p-6 space-y-4">
                {activeCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-4">
                        No active courses
                    </p>
                    <Button 
                      onClick={() => setShowCourseModal(true)}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                        Assign First Course
                    </Button>
                  </div>
                ) : (
                  activeCourses.map((assignment) => (
                      <Card key={assignment.id} className="bg-white border border-gray-200 shadow-sm rounded-xl">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-gray-900">
                                {assignment.course.name}
                              </h3>
                              {getCourseStatusBadge(assignment.status)}
                            </div>
                            {assignment.course.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                {assignment.course.description}
                              </p>
                            )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                  <BookOpenIcon className="h-4 w-4" />
                                  <span>{assignment.course._count?.modules || 0} modules</span>
                              </div>
                              <div className="flex items-center gap-1">
                                  <CalendarDaysIcon className="h-4 w-4" />
                                <span>
                                    Started {safeFormatDate(assignment.startDate)}
                                </span>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild 
                              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-xl"
                            >
                            <Link href={`/doctor/courses/${assignment.course.id}`}>
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

              {/* Complete History */}
              <Card className="bg-white border border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="p-6 border-b border-gray-200">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                    Complete History
                    <Badge className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1 rounded-full text-sm font-semibold">
                    {totalProtocols + totalCourses}
                  </Badge>
                </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">All assigned protocols and courses</p>
              </CardHeader>
                <CardContent className="p-6 space-y-4">
                {totalProtocols === 0 && totalCourses === 0 ? (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-4">
                        No protocols or courses assigned yet
                    </p>
                      <div className="flex gap-3 justify-center">
                        <Button 
                          asChild 
                          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                        >
                        <Link href={`/doctor/patients/${patient.id}/assign`}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                            Assign Protocol
                        </Link>
                      </Button>
                      <Button 
                        onClick={() => setShowCourseModal(true)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                          Assign Course
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Protocol History */}
                    {patient.assignedProtocols.map((assignment) => (
                        <Card key={`protocol-${assignment.id}`} className="bg-white border border-gray-200 shadow-sm rounded-xl">
                          <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                assignment.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-600' 
                                  : assignment.status === 'INACTIVE'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}>
                                  <DocumentTextIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold text-gray-900">{assignment.protocol.name}</p>
                                  {getStatusBadge(assignment.status)}
                                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">Protocol</Badge>
                                </div>
                                  <p className="text-sm text-gray-600">
                                  {assignment.status === 'INACTIVE' 
                                      ? `Completed ${safeFormatDate(assignment.endDate)}`
                                      : `Started ${safeFormatDate(assignment.startDate)}`
                                  }
                                </p>
                              </div>
                            </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild 
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-10 w-10 p-0 rounded-xl"
                              >
                              <Link href={`/doctor/protocols/${assignment.protocol.id}`}>
                                  <EyeIcon className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Course History */}
                    {(patient.assignedCourses || []).map((assignment) => (
                        <Card key={`course-${assignment.id}`} className="bg-white border border-gray-200 shadow-sm rounded-xl">
                          <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                                assignment.status === 'active' 
                                    ? 'bg-teal-100 text-teal-600' 
                                  : assignment.status === 'completed'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}>
                                  <AcademicCapIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold text-gray-900">{assignment.course.name}</p>
                                  {getCourseStatusBadge(assignment.status)}
                                    <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">Course</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    Started {safeFormatDate(assignment.startDate)}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild 
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-10 w-10 p-0 rounded-xl"
                              >
                              <Link href={`/doctor/courses/${assignment.course.id}`}>
                                  <EyeIcon className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 