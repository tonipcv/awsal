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
import { ptBR } from 'date-fns/locale';

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
        alert(`Erro ao atribuir curso: ${error.error}`);
      }
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Erro ao atribuir curso');
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
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Concluído</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pausado</Badge>;
      case 'unavailable':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Indisponível</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{status}</Badge>;
    }
  };

  const getAvailableCoursesForAssignment = () => {
    const assignedCourseIds = patient?.assignedCourses?.map(ac => ac.course.id) || [];
    return availableCourses.filter(course => !assignedCourseIds.includes(course.id));
  };

  const getProtocolProgress = (assignment: ProtocolAssignment) => {
    const today = new Date();
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.endDate);
    
    if (today > endDate) {
      return { status: 'completed', progress: 100 };
    }
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
    
    return { status: 'active', progress: Math.round(progress) };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Concluído</Badge>;
      case 'UNAVAILABLE':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Indisponível</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">{status}</Badge>;
    }
  };

  const copyReferralCode = () => {
    if (patient?.referralCode) {
      navigator.clipboard.writeText(patient.referralCode);
      alert('Código de indicação copiado para a área de transferência!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-sm text-slate-600">Carregando paciente...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2 text-slate-800">Paciente não encontrado</h2>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/doctor/patients">Voltar aos pacientes</Link>
          </Button>
        </div>
      </div>
    );
  }

  const activeProtocols = getActiveProtocols();
  const completedProtocols = getCompletedProtocols();
  const unavailableProtocols = getUnavailableProtocols();
  const totalProtocols = patient.assignedProtocols.length;

  const activeCourses = getActiveCourses();
  const completedCourses = getCompletedCourses();
  const totalCourses = patient.assignedCourses?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            <Link href="/doctor/patients">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-slate-800">
              Detalhes do Paciente
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <UserIcon className="h-3 w-3" />
              <span>{patient.name || patient.email}</span>
              <span>•</span>
              <DocumentTextIcon className="h-3 w-3" />
              <span>{totalProtocols} protocolos</span>
              <span>•</span>
              <CheckCircleIcon className="h-3 w-3" />
              <span>{activeProtocols.length} ativos</span>
              <span>•</span>
              <BookOpenIcon className="h-3 w-3" />
              <span>{totalCourses} cursos</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCourseModal} onOpenChange={setShowCourseModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  Atribuir Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle className="text-slate-800">Atribuir Curso ao Paciente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      Selecionar Curso
                    </label>
                    <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                      <SelectTrigger className="border-slate-300 bg-white text-slate-800">
                        <SelectValue placeholder="Escolha um curso..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 shadow-lg">
                        {getAvailableCoursesForAssignment().map((course) => (
                          <SelectItem 
                            key={course.id} 
                            value={course.id} 
                            className="hover:bg-slate-50 focus:bg-slate-50 text-slate-800 cursor-pointer"
                          >
                            <div>
                              <div className="font-medium text-slate-800">{course.name}</div>
                              <div className="text-xs text-slate-600">
                                {course._count?.modules || 0} módulos • {course._count?.lessons || 0} aulas
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCourseModal(false)}
                      className="border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={assignCourse}
                      disabled={!selectedCourseId || isAssigningCourse}
                      className="bg-[#3455eb] hover:bg-[#2845d9] text-white"
                    >
                      {isAssigningCourse ? 'Atribuindo...' : 'Atribuir Curso'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href={`/doctor/patients/${patient.id}/assign`}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Atribuir Protocolo
              </Link>
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Patient Info Card */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-xl font-medium text-blue-600">
                    {getPatientInitials(patient.name)}
                  </div>
                </div>
                
                {/* Patient Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-slate-800 mb-1">
                        {patient.name || 'Nome não informado'}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                        <EnvelopeIcon className="h-4 w-4" />
                        <span>{patient.email}</span>
                        {patient.emailVerified ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                            <ShieldCheckIcon className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-200 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </div>
                      {patient.referralCode && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                          <ClipboardDocumentIcon className="h-4 w-4" />
                          <span>Código de indicação: <strong>{patient.referralCode}</strong></span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={copyReferralCode}
                            className="h-6 px-2 text-xs border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          >
                            Copiar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <div className="text-lg font-semibold text-slate-800">{totalProtocols}</div>
                      <div className="text-xs text-slate-600">Protocolos</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">{activeProtocols.length}</div>
                      <div className="text-xs text-slate-600">P. Ativos</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{completedProtocols.length}</div>
                      <div className="text-xs text-slate-600">P. Concluídos</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-[#3455eb]">{totalCourses}</div>
                      <div className="text-xs text-slate-600">Cursos</div>
                    </div>
                    <div className="text-center p-3 bg-teal-50 rounded-lg">
                      <div className="text-lg font-semibold text-teal-600">{activeCourses.length}</div>
                      <div className="text-xs text-slate-600">C. Ativos</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-[#3455eb]">{completedCourses.length}</div>
                      <div className="text-xs text-slate-600">C. Concluídos</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Active Protocols */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  Protocolos Ativos
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    {activeProtocols.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600">Protocolos em andamento</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeProtocols.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-4">
                      Nenhum protocolo ativo
                    </p>
                    <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                      <Link href={`/doctor/patients/${patient.id}/assign`}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Atribuir Primeiro Protocolo
                      </Link>
                    </Button>
                  </div>
                ) : (
                  activeProtocols.map((assignment) => {
                    const progress = getProtocolProgress(assignment);
                    
                    return (
                      <Card key={assignment.id} className="bg-white border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-medium text-slate-800">
                                  {assignment.protocol.name}
                                </h3>
                                {getStatusBadge(assignment.status)}
                              </div>
                              {assignment.protocol.description && (
                                <p className="text-xs text-slate-600 mb-2">
                                  {assignment.protocol.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="h-3 w-3" />
                                  <span>{assignment.protocol.duration} dias</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarDaysIcon className="h-3 w-3" />
                                  <span>
                                    Iniciado em {format(new Date(assignment.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                              <Link href={`/doctor/protocols/${assignment.protocol.id}`}>
                                <EyeIcon className="h-3 w-3 mr-1" />
                                Ver
                              </Link>
                            </Button>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Progresso</span>
                              <span className="text-blue-600 font-medium">{progress.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-[#3455eb]" />
                  Cursos Ativos
                  <Badge variant="secondary" className="bg-blue-100 text-[#3455eb] border-blue-200">
                    {activeCourses.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600">Cursos em andamento</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-4">
                      Nenhum curso ativo
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => setShowCourseModal(true)}
                      className="bg-[#3455eb] hover:bg-[#2845d9]"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Atribuir Primeiro Curso
                    </Button>
                  </div>
                ) : (
                  activeCourses.map((assignment) => (
                    <Card key={assignment.id} className="bg-white border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-slate-800">
                                {assignment.course.name}
                              </h3>
                              {getCourseStatusBadge(assignment.status)}
                            </div>
                            {assignment.course.description && (
                              <p className="text-xs text-slate-600 mb-2">
                                {assignment.course.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <BookOpenIcon className="h-3 w-3" />
                                <span>{assignment.course._count?.modules || 0} módulos</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CalendarDaysIcon className="h-3 w-3" />
                                <span>
                                  Iniciado em {format(new Date(assignment.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                            <Link href={`/doctor/courses/${assignment.course.id}`}>
                              <EyeIcon className="h-3 w-3 mr-1" />
                              Ver
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* All History */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-slate-600" />
                  Histórico Completo
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                    {totalProtocols + totalCourses}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600">Todos os protocolos e cursos atribuídos</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {totalProtocols === 0 && totalCourses === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 mb-4">
                      Nenhum protocolo ou curso atribuído ainda
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                        <Link href={`/doctor/patients/${patient.id}/assign`}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Atribuir Protocolo
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setShowCourseModal(true)}
                        className="bg-[#3455eb] hover:bg-[#2845d9]"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Atribuir Curso
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Protocol History */}
                    {patient.assignedProtocols.map((assignment) => (
                      <Card key={`protocol-${assignment.id}`} className="bg-white border-slate-200">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                assignment.status === 'ACTIVE' 
                                  ? 'bg-green-100 text-green-600' 
                                  : assignment.status === 'INACTIVE'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}>
                                <DocumentTextIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-slate-800">{assignment.protocol.name}</p>
                                  {getStatusBadge(assignment.status)}
                                  <Badge variant="outline" className="text-xs">Protocolo</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                  {assignment.status === 'INACTIVE' 
                                    ? `Concluído em ${format(new Date(assignment.endDate), 'dd/MM/yyyy', { locale: ptBR })}`
                                    : `Iniciado em ${format(new Date(assignment.startDate), 'dd/MM/yyyy', { locale: ptBR })}`
                                  }
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                              <Link href={`/doctor/protocols/${assignment.protocol.id}`}>
                                <EyeIcon className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Course History */}
                    {(patient.assignedCourses || []).map((assignment) => (
                      <Card key={`course-${assignment.id}`} className="bg-white border-slate-200">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                assignment.status === 'active' 
                                  ? 'bg-blue-100 text-[#3455eb]' 
                                  : assignment.status === 'completed'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-orange-100 text-orange-600'
                              }`}>
                                <AcademicCapIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-slate-800">{assignment.course.name}</p>
                                  {getCourseStatusBadge(assignment.status)}
                                  <Badge variant="outline" className="text-xs">Curso</Badge>
                                </div>
                                <p className="text-xs text-slate-600">
                                  Iniciado em {format(new Date(assignment.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" asChild className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                              <Link href={`/doctor/courses/${assignment.course.id}`}>
                                <EyeIcon className="h-3 w-3" />
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
  );
} 