'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  CheckCircleIcon,
  UserIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  LockClosedIcon,
  EyeIcon,
  PlayIcon,
  StarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import ProtocolModal from '@/components/ProtocolModal';
import { toast } from 'sonner';

// Translations for internationalization
const translations = {
  pt: {
    greeting: (name: string) => `Olá, ${name}!`,
    yourProtocols: 'Seus Protocolos',
    trackProgress: 'Acompanhe seu progresso e continue seu tratamento',
    activeProtocol: 'Protocolo Ativo',
    activeProtocols: 'Protocolos Ativos',
    totalAvailable: 'Total Disponível',
    averageProgress: 'Progresso Médio',
    noProtocolsAvailable: 'Nenhum protocolo disponível',
    contactDoctor: 'Entre em contato com seu médico para obter um protocolo personalizado.',
    activeProtocolsSection: 'Protocolos Ativos',
    unavailableProtocolsSection: 'Protocolos Indisponíveis',
    inactiveProtocolsSection: 'Protocolos Inativos',
    soonProtocolsSection: 'Protocolos Em Breve',
    active: 'Ativo',
    completed: 'Concluído',
    unavailable: 'Indisponível',
    inactive: 'Inativo',
    soon: 'Em Breve',
    responsibleDoctor: 'Médico Responsável',
    duration: 'Duração',
    tasks: 'Tarefas',
    days: 'dias',
    dayOf: (current: number, total: number) => `Dia ${current} de ${total}`,
    continue: 'Continuar',
    seeDetails: 'Ver detalhes',
    viewProgress: 'Ver Progresso',
    loading: 'Carregando...',
    consultation: 'Consulta',
    fillOnboard: 'Preencher onboard',
    waitingForConsultation: 'Aguardando consulta',
    onboardingCompleted: 'Onboarding preenchido'
  },
  en: {
    greeting: (name: string) => `Hi, ${name}!`,
    yourProtocols: 'Your Protocols',
    trackProgress: 'Track your progress and continue your treatment',
    activeProtocol: 'Active Protocol',
    activeProtocols: 'Active Protocols',
    totalAvailable: 'Total Available',
    averageProgress: 'Average Progress',
    noProtocolsAvailable: 'No protocols available',
    contactDoctor: 'Contact your doctor to get a personalized protocol.',
    activeProtocolsSection: 'Active Protocols',
    unavailableProtocolsSection: 'Unavailable Protocols',
    inactiveProtocolsSection: 'Inactive Protocols',
    soonProtocolsSection: 'Coming Soon Protocols',
    active: 'Active',
    completed: 'Completed',
    unavailable: 'Unavailable',
    inactive: 'Inactive',
    soon: 'Coming Soon',
    responsibleDoctor: 'Responsible Doctor',
    duration: 'Duration',
    tasks: 'Tasks',
    days: 'days',
    dayOf: (current: number, total: number) => `Day ${current} of ${total}`,
    continue: 'Continue',
    seeDetails: 'See details',
    viewProgress: 'View Progress',
    loading: 'Loading...',
    consultation: 'Consultation',
    fillOnboard: 'Fill onboard',
    waitingForConsultation: 'Waiting for consultation',
    onboardingCompleted: 'Onboarding completed'
  }
};

interface ProtocolTask {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
  completed?: boolean;
}

interface ProtocolSession {
  id: string;
  sessionNumber: number;
  title: string;
  description?: string;
  tasks: ProtocolTask[];
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  sessions: ProtocolSession[];
}

interface Protocol {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  showDoctorInfo?: boolean;
  modalTitle?: string;
  modalVideoUrl?: string;
  modalDescription?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
  coverImage?: string;
  onboardingTemplateId?: string;
  days: ProtocolDay[];
  doctor: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

interface ActiveProtocol {
  id: string;
  userId: string;
  protocolId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: string;
  currentDay: number;
  preConsultationStatus?: string;
  protocol: Protocol;
  progress?: {
    [taskId: string]: {
      isCompleted: boolean;
      date: string;
    };
  };
}

export default function ProtocolsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [protocols, setProtocols] = useState<ActiveProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    videoUrl?: string;
    buttonText?: string;
    buttonUrl?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    videoUrl: '',
    buttonText: '',
    buttonUrl: ''
  });

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'pt';
    const detectedLang = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt';
    setLanguage(detectedLang);
  }, []);

  const t = translations[language];

  useEffect(() => {
    const loadProtocols = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Tentar detectar o slug da clínica do localStorage ou sessionStorage
        let clinicSlug = null;
        if (typeof window !== 'undefined') {
          clinicSlug = sessionStorage.getItem('clinicSlug') || localStorage.getItem('clinicSlug');
        }

        // Se não encontrou no storage, tentar buscar via API
        if (!clinicSlug) {
          try {
            const clinicResponse = await fetch('/api/patient/clinic-slug');
            if (clinicResponse.ok) {
              const clinicData = await clinicResponse.json();
              clinicSlug = clinicData.clinicSlug;
            }
          } catch (error) {
            console.log('Could not fetch clinic slug, using default behavior');
          }
        }

        // Construir URL da API com ou sem clinicSlug
        let apiUrl = '/api/protocols/assign';
        if (clinicSlug) {
          apiUrl += `?clinicSlug=${encodeURIComponent(clinicSlug)}`;
        }

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch protocols');
        }

        const data = await response.json();
        console.log('Loaded protocols:', data.map((p: any) => ({
          id: p.protocol.id,
          name: p.protocol.name,
          status: p.status,
          onboardingTemplateId: p.protocol.onboardingTemplateId
        })));
        setProtocols(data || []);
      } catch (error) {
        console.error('Error loading protocols:', error);
        setError('Erro ao carregar protocolos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadProtocols();
  }, [session]);

  // Debug: Log protocols when they change
  useEffect(() => {
    console.log('Active protocols:', protocols.filter(p => p.status === 'ACTIVE').map(p => ({
      id: p.protocol.id,
      name: p.protocol.name,
      status: p.status,
      onboardingTemplateId: p.protocol.onboardingTemplateId
    })));
    console.log('Soon protocols:', protocols.filter(p => p.status === 'SOON').map(p => ({
      id: p.protocol.id,
      name: p.protocol.name,
      status: p.status,
      onboardingTemplateId: p.protocol.onboardingTemplateId
    })));
  }, [protocols]);

  // Debug: Log doctor data when protocols are loaded
  useEffect(() => {
    if (protocols.length > 0) {
      protocols.forEach(assignment => {
        if (assignment.protocol.showDoctorInfo && assignment.protocol.doctor) {
          console.log('Doctor data:', assignment.protocol.doctor);
        }
      });
    }
  }, [protocols]);

  const getProtocolProgress = (protocol: any) => {
    const totalDays = protocol.protocol.days?.length || 0;
    const currentDay = protocol.currentDay || 1;
    const progressPercentage = Math.min(Math.round((currentDay / totalDays) * 100), 100);

    return {
      currentDay,
      totalDays,
      progressPercentage
    };
  };

  const getTotalTasks = (protocol: Protocol) => {
    return protocol.days.reduce((acc, day) => {
      return acc + day.sessions.reduce((sessionAcc: number, session) => {
        return sessionAcc + (session.tasks?.length || 0);
      }, 0);
    }, 0);
  };

  const getCompletedTasks = (assignment: ActiveProtocol) => {
    if (!assignment.progress) return 0;
    
    let completedTasks = 0;
    assignment.protocol.days.forEach(day => {
      day.sessions.forEach(session => {
        session.tasks.forEach(task => {
          if (assignment.progress?.[task.id]?.isCompleted) {
            completedTasks++;
          }
        });
      });
    });
    return completedTasks;
  };

  const isProtocolCompleted = (assignment: ActiveProtocol) => {
    const totalTasks = getTotalTasks(assignment.protocol);
    const completedTasks = getCompletedTasks(assignment);
    return totalTasks > 0 && completedTasks === totalTasks;
  };

  const openModal = (protocol: Protocol) => {
    // Only open modal if there's at least some modal content configured
    const hasModalContent = protocol.modalTitle || protocol.modalDescription || protocol.modalVideoUrl;
    
    if (!hasModalContent) {
      return; // Don't open modal if no content is configured
    }
    
    setModalData({
      isOpen: true,
      title: protocol.modalTitle || protocol.name,
      description: protocol.modalDescription,
      videoUrl: protocol.modalVideoUrl,
      buttonText: protocol.modalButtonText || t.seeDetails,
      buttonUrl: protocol.modalButtonUrl
    });
  };

  const closeModal = () => {
    setModalData(prev => ({ ...prev, isOpen: false }));
  };

  // Helper function to check if protocol has modal content
  const hasModalContent = (protocol: Protocol) => {
    return protocol.modalTitle || protocol.modalDescription || protocol.modalVideoUrl;
  };

  // Função para obter o médico principal dos protocolos ativos
  const getPrimaryDoctor = () => {
    // Procura pelo primeiro protocolo ativo que tem informações do médico
    const protocolWithDoctor = protocols.find(assignment => 
      assignment.protocol.showDoctorInfo && assignment.protocol.doctor
    );
    
    return protocolWithDoctor?.protocol.doctor || null;
  };

  // Separar protocolos por status com hierarquia de prioridade
  // Prioridade: UNAVAILABLE > INACTIVE > SOON > ACTIVE
  const unavailableProtocols = protocols.filter(p => p.status === 'UNAVAILABLE');
  const soonProtocols = protocols.filter(p => p.status === 'SOON' && p.isActive);
  const activeProtocols = protocols.filter(p => 
    p.status === 'ACTIVE' && p.isActive
  );
  const inactiveProtocols = protocols.filter(p => 
    p.status !== 'UNAVAILABLE' && (p.status === 'INACTIVE' || !p.isActive)
  );

  const handleOnboardClick = async (templateId: string, patientId: string) => {
    try {
      const response = await fetch('/api/onboarding/generate-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          patientId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate onboarding link');
      }

      const data = await response.json();
      router.push(`/onboarding/${data.token}`);
    } catch (error) {
      console.error('Error generating onboarding link:', error);
      toast.error('Error generating onboarding link');
    }
  };

  const handleOnboardButtonClick = (templateId: string, patientId: string) => {
    if (!templateId || !patientId) return;
    handleOnboardClick(templateId, patientId).catch(error => {
      console.error('Error in handleOnboardButtonClick:', error);
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101010' }}>
        <span className="text-xs text-gray-400">{t.loading}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
        {/* Padding para header no topo e menu em baixo */}
        <div className="pt-[88px] pb-32 lg:pt-20 lg:pb-24">
          
          {/* Hero Section Compacto */}
          <div className="relative overflow-hidden">
            <div className="relative py-4 lg:py-6">
              <div className="max-w-6xl mx-auto px-3 lg:px-6">
                <div className="text-center max-w-3xl mx-auto">
                  <div className="mb-4 lg:mb-6">
                    <div className="h-10 lg:h-14 bg-gray-800/50 rounded-lg w-56 mx-auto mb-2 lg:mb-3 animate-pulse"></div>
                    <div className="h-6 lg:h-8 bg-gray-700/50 rounded-lg w-40 mx-auto mb-3 lg:mb-4 animate-pulse"></div>
                    <div className="h-4 lg:h-6 bg-gray-700/50 rounded w-64 mx-auto mb-6 lg:mb-8 animate-pulse"></div>
                    
                    {/* Stats Skeleton */}
                    <div className="flex items-center justify-center gap-6 lg:gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="text-center">
                          <div className="h-6 lg:h-8 bg-gray-800/50 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                          <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101010' }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const totalProtocols = protocols.length;
  const primaryDoctor = getPrimaryDoctor();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
      {/* Padding para header no topo e menu em baixo */}
      <div className="pt-[88px] pb-32 lg:pt-20 lg:pb-24">
        
        {/* Hero Section Compacto */}
        <div className="relative overflow-hidden">
          <div className="relative py-4 lg:py-6">
            <div className="max-w-6xl mx-auto px-3 lg:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-4 lg:mb-6">
                  <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 tracking-tight">
                    {t.greeting(session?.user?.name || 'Paciente')}
                  </h1>
                  <h2 className="text-lg lg:text-xl font-light text-turquoise tracking-tight">
                    {t.yourProtocols}
                  </h2>
                </div>
                
                {/* Stats Compactas */}
                <div className="flex items-center justify-center gap-4 lg:gap-8">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-white mb-0.5">
                    {activeProtocols.length + soonProtocols.length}
                  </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {(activeProtocols.length + soonProtocols.length) === 1 ? t.activeProtocol : t.activeProtocols}
                </div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-700" />
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-white mb-0.5">
                    {totalProtocols}
                  </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {t.totalAvailable}
                </div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-700" />
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-turquoise mb-0.5">
                    {activeProtocols.length > 0 
                      ? Math.round(activeProtocols.reduce((acc, p) => acc + getProtocolProgress(p).progressPercentage, 0) / activeProtocols.length)
                      : 0}%
                  </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {t.averageProgress}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
        <div className="max-w-6xl mx-auto px-3 lg:px-6 pb-8 lg:pb-12">
        {totalProtocols === 0 ? (
          /* Empty State */
            <div className="text-center py-12 lg:py-16">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                </div>
                <h3 className="text-lg lg:text-xl font-light text-white mb-2 lg:mb-3">
                {t.noProtocolsAvailable}
              </h3>
                <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                {t.contactDoctor}
              </p>
            </div>
          </div>
        ) : (
            <div className="space-y-6 lg:space-y-8">
            {/* Active Protocols */}
            {activeProtocols.length > 0 && (
              <section>
                  <h2 className="text-lg lg:text-xl font-light text-white mb-3 lg:mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 lg:h-5 lg:w-5 text-turquoise" />
                    {t.activeProtocolsSection}
                </h2>
                
                  <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {activeProtocols.map(assignment => {
                    const progress = getProtocolProgress(assignment);
                    const totalTasks = getTotalTasks(assignment.protocol);
                    const isCompleted = isProtocolCompleted(assignment);
                    const hasModal = assignment.protocol.modalTitle || assignment.protocol.modalVideoUrl;
                    
                    console.log('Protocol:', {
                      id: assignment.protocol.id,
                      name: assignment.protocol.name,
                      onboardingTemplateId: assignment.protocol.onboardingTemplateId
                    });

                    return (
                        <div 
                        key={assignment.id} 
                          className="group bg-gray-900/40 border border-gray-800/40 rounded-xl hover:border-turquoise/30 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                      >
                          {/* Cover Image */}
                          {assignment.protocol.coverImage && (
                            <div className="relative w-full h-32 lg:h-40 overflow-hidden">
                              <Image
                                src={assignment.protocol.coverImage}
                                alt={assignment.protocol.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                            </div>
                          )}
                          
                          <div className="p-3 lg:p-4">
                            <div className="space-y-3 lg:space-y-4">
                              <div>
                                <div className="mb-2">
                                  <h3 className="text-sm lg:text-base font-medium text-white group-hover:text-turquoise transition-colors line-clamp-2 mb-2">
                                    {assignment.protocol.name}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    {/* Status Badge */}
                                    {isCompleted ? (
                                      <Badge 
                                        variant="outline" 
                                        className="bg-green-500/10 text-green-500 border-green-500/20 gap-1 pl-1.5"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        {t.completed}
                                      </Badge>
                                    ) : (
                                      <Badge 
                                        variant="outline" 
                                        className="bg-turquoise/10 text-turquoise border-turquoise/20 gap-1 pl-1.5"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-turquoise" />
                                        {t.active}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Doctor Info - Only show if showDoctorInfo is true */}
                                {assignment.protocol.showDoctorInfo && assignment.protocol.doctor && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                      {assignment.protocol.doctor.image ? (
                                        <img 
                                          src={assignment.protocol.doctor.image} 
                                          alt={assignment.protocol.doctor.name || t.responsibleDoctor}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (fallback) {
                                              fallback.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div 
                                        className="w-full h-full bg-gray-600 flex items-center justify-center"
                                        style={{ display: assignment.protocol.doctor.image ? 'none' : 'flex' }}
                                      >
                                        <span className="text-xs text-gray-300 font-medium">
                                          {assignment.protocol.doctor.name?.charAt(0) || 'M'}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {assignment.protocol.doctor.name || t.responsibleDoctor}
                                    </span>
                                  </div>
                                )}
                                
                                {assignment.protocol.description && (
                                  <p className="text-xs lg:text-sm text-gray-300 leading-relaxed line-clamp-2">
                                    {assignment.protocol.description}
                                  </p>
                                )}
                              </div>

                              {/* Protocol Stats Compactas */}
                              <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
                                <div className="flex items-center gap-1.5 lg:gap-2">
                                  <CalendarDaysIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                                <div>
                                    <div className="text-gray-400">{t.duration}</div>
                                  <div className="text-white font-medium">
                                    {assignment.protocol.duration} {t.days}
                                  </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1.5 lg:gap-2">
                                  <DocumentTextIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                                <div>
                                    <div className="text-gray-400">{t.tasks}</div>
                                  <div className="text-white font-medium">
                                      {totalTasks}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Progress Compacto */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs lg:text-sm">
                                  <span className="text-gray-300">
                                    {t.dayOf(progress.currentDay, progress.totalDays)}
                                  </span>
                                  <span className="text-turquoise font-medium">
                                    {progress.progressPercentage}%
                                  </span>
                                </div>
                                <Progress 
                                  value={progress.progressPercentage} 
                                  className="h-1.5 lg:h-2 bg-gray-800"
                                />
                            </div>

                              {/* Action Button */}
                              <div className="pt-1">
                                {isCompleted ? (
                                  <Link href={`/patient/checklist/${assignment.protocol.id}`}>
                                    <button 
                                      type="button"
                                      className="w-full bg-green-500 hover:bg-green-600 text-white font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 rounded-md"
                                    >
                                      {t.viewProgress}
                                    </button>
                                  </Link>
                                ) : assignment.protocol.onboardingTemplateId ? (
                                  assignment.preConsultationStatus === 'COMPLETED' ? (
                                    <Link href={`/patient/checklist/${assignment.protocol.id}`}>
                                      <button 
                                        type="button"
                                        className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200 rounded-md"
                                      >
                                        {t.continue}
                                      </button>
                                    </Link>
                                  ) : (
                                    <button 
                                      type="button"
                                      className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200 rounded-md"
                                      onClick={() => {
                                        if (session?.user?.id) {
                                          handleOnboardClick(assignment.protocol.onboardingTemplateId!, session.user.id);
                                        }
                                      }}
                                    >
                                      {t.fillOnboard}
                                    </button>
                                  )
                                ) : (
                                  <Link href={`/patient/checklist/${assignment.protocol.id}`}>
                                    <button 
                                      type="button"
                                      className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200 rounded-md"
                                    >
                                      {t.continue}
                                    </button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Soon Protocols */}
            {soonProtocols.length > 0 && (
              <section>
                <h2 className="text-lg lg:text-xl font-light text-white mb-3 lg:mb-4 flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4 lg:h-5 lg:w-5 text-turquoise" />
                  {t.soonProtocolsSection}
                </h2>
                
                <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {soonProtocols.map(assignment => {
                    const progress = getProtocolProgress(assignment);
                    const totalTasks = getTotalTasks(assignment.protocol);
                    const isCompleted = isProtocolCompleted(assignment);
                    const hasModal = assignment.protocol.modalTitle || assignment.protocol.modalVideoUrl;
                    
                    return (
                      <div 
                        key={assignment.id} 
                        className="group bg-gray-900/40 border border-gray-800/40 rounded-xl hover:border-turquoise/30 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                      >
                        {/* Cover Image */}
                        {assignment.protocol.coverImage && (
                          <div className="relative w-full h-32 lg:h-40 overflow-hidden">
                            <Image
                              src={assignment.protocol.coverImage}
                              alt={assignment.protocol.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                          </div>
                        )}
                        
                        <div className="p-3 lg:p-4">
                          <div className="space-y-3 lg:space-y-4">
                            <div>
                              <div className="mb-2">
                                <h3 className="text-sm lg:text-base font-medium text-white group-hover:text-turquoise transition-colors line-clamp-2 mb-2">
                                  {assignment.protocol.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className="bg-turquoise/10 text-turquoise border-turquoise/20 gap-1 pl-1.5"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-turquoise" />
                                    {t.soon}
                                  </Badge>
                                </div>
                              </div>

                              {/* Doctor Info - Only show if showDoctorInfo is true */}
                              {assignment.protocol.showDoctorInfo && assignment.protocol.doctor && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                    {assignment.protocol.doctor.image ? (
                                      <img 
                                        src={assignment.protocol.doctor.image} 
                                        alt={assignment.protocol.doctor.name || t.responsibleDoctor}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className="w-full h-full bg-gray-600 flex items-center justify-center"
                                      style={{ display: assignment.protocol.doctor.image ? 'none' : 'flex' }}
                                    >
                                      <span className="text-xs text-gray-300 font-medium">
                                        {assignment.protocol.doctor.name?.charAt(0) || 'M'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {assignment.protocol.doctor.name || t.responsibleDoctor}
                                  </span>
                                </div>
                              )}
                              
                              {assignment.protocol.description && (
                                <p className="text-xs lg:text-sm text-gray-300 leading-relaxed line-clamp-2">
                                  {assignment.protocol.description}
                                </p>
                              )}
                            </div>

                            {/* Protocol Stats Compactas */}
                            <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
                              <div className="flex items-center gap-1.5 lg:gap-2">
                                <CalendarDaysIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                                <div>
                                  <div className="text-gray-400">{t.duration}</div>
                                  <div className="text-white font-medium">
                                    {assignment.protocol.duration} {t.days}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 lg:gap-2">
                                <DocumentTextIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                                <div>
                                  <div className="text-gray-400">{t.tasks}</div>
                                  <div className="text-white font-medium">
                                    {totalTasks}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-1">
                              {isCompleted ? (
                                <Link href={`/patient/checklist/${assignment.protocol.id}`}>
                                  <button 
                                    type="button"
                                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-200 rounded-md"
                                  >
                                    {t.viewProgress}
                                  </button>
                                </Link>
                              ) : assignment.protocol.onboardingTemplateId ? (
                                assignment.preConsultationStatus === 'COMPLETED' ? (
                                  <Link href={`/patient/checklist/${assignment.protocol.id}`}>
                                    <button 
                                      type="button"
                                      className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200 rounded-md"
                                    >
                                      {t.continue}
                                    </button>
                                  </Link>
                                ) : (
                                  <button 
                                    type="button"
                                    className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200 rounded-md"
                                    onClick={() => {
                                      if (session?.user?.id) {
                                        handleOnboardClick(assignment.protocol.onboardingTemplateId!, session.user.id);
                                      }
                                    }}
                                  >
                                    {t.fillOnboard}
                                  </button>
                                )
                              ) : (
                                <button 
                                  type="button"
                                  disabled
                                  className="w-full bg-gray-700/50 text-gray-400 font-medium text-xs lg:text-sm h-8 lg:h-9 cursor-not-allowed rounded-md"
                                >
                                  {t.waitingForConsultation}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Unavailable Protocols */}
            {unavailableProtocols.length > 0 && (
              <section>
                <h2 className="text-lg lg:text-xl font-light text-white mb-3 lg:mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  {t.unavailableProtocolsSection}
                </h2>
                
                <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {unavailableProtocols.map(assignment => {
                    const totalTasks = getTotalTasks(assignment.protocol);
                    const hasModal = hasModalContent(assignment.protocol);
                    
                    return (
                      <div 
                        key={assignment.id} 
                        className={`group bg-gray-900/20 border border-gray-800/30 rounded-xl hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm ${hasModal ? 'cursor-pointer' : ''}`}
                        onClick={hasModal ? () => openModal(assignment.protocol) : undefined}
                      >
                        {/* Cover Image */}
                        {assignment.protocol.coverImage && (
                          <div className="relative w-full h-32 lg:h-40 overflow-hidden">
                            <Image
                              src={assignment.protocol.coverImage}
                              alt={assignment.protocol.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300 grayscale"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                          </div>
                        )}
                        
                        <div className="p-3 lg:p-4">
                          <div className="space-y-3">
                            <div>
                              <div className="mb-2">
                                <h3 className="text-sm lg:text-base font-medium text-white group-hover:text-gray-300 transition-colors line-clamp-2 mb-2">
                                  {assignment.protocol.name}
                                </h3>
                                <Badge className="bg-gray-700/20 text-gray-400 border-gray-700/30 text-xs px-1.5 py-0.5 lg:px-2 lg:py-1">
                                  {t.unavailable}
                                </Badge>
                              </div>

                              {/* Doctor Info - Only show if showDoctorInfo is true */}
                              {assignment.protocol.showDoctorInfo && assignment.protocol.doctor && (
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                    {assignment.protocol.doctor.image ? (
                                      <img 
                                        src={assignment.protocol.doctor.image} 
                                        alt={assignment.protocol.doctor.name || t.responsibleDoctor}
                                        className="w-full h-full object-cover grayscale"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className="w-full h-full bg-gray-600 flex items-center justify-center"
                                      style={{ display: assignment.protocol.doctor.image ? 'none' : 'flex' }}
                                    >
                                      <span className="text-xs text-gray-300 font-medium">
                                        {assignment.protocol.doctor.name?.charAt(0) || 'M'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {assignment.protocol.doctor.name || t.responsibleDoctor}
                                  </span>
                                </div>
                              )}
                              
                              {assignment.protocol.description && (
                                <p className="text-xs lg:text-sm text-gray-400 leading-relaxed line-clamp-2">
                                  {assignment.protocol.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 lg:gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <CalendarDaysIcon className="h-3 w-3 text-gray-500" />
                                  <span>{assignment.protocol.duration} {t.days}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DocumentTextIcon className="h-3 w-3 text-gray-500" />
                                  <span>{totalTasks} {t.tasks}</span>
                                </div>
                              </div>

                              {hasModal && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs h-6 lg:h-7 px-2 lg:px-3"
                                >
                                  {t.seeDetails}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Inactive Protocols */}
            {inactiveProtocols.length > 0 && (
              <section>
                <h2 className="text-lg lg:text-xl font-light text-white mb-3 lg:mb-4 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  {t.inactiveProtocolsSection}
                </h2>
                
                <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {inactiveProtocols.map(assignment => {
                    const totalTasks = getTotalTasks(assignment.protocol);
                    const hasModal = hasModalContent(assignment.protocol);
                    
                    return (
                        <div 
                        key={assignment.id} 
                          className={`group bg-gray-900/20 border border-gray-800/30 rounded-xl hover:border-gray-700/50 transition-all duration-300 backdrop-blur-sm grayscale hover:grayscale-0 ${hasModal ? 'cursor-pointer' : ''}`}
                        onClick={hasModal ? () => openModal(assignment.protocol) : undefined}
                      >
                          {/* Cover Image */}
                          {assignment.protocol.coverImage && (
                            <div className="relative w-full h-32 lg:h-40 overflow-hidden">
                              <Image
                                src={assignment.protocol.coverImage}
                                alt={assignment.protocol.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300 grayscale"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                            </div>
                          )}
                          
                          <div className="p-3 lg:p-4">
                            <div className="space-y-3">
                            <div>
                              <div className="mb-2">
                                  <h3 className="text-sm lg:text-base font-medium text-gray-400 group-hover:text-gray-300 transition-colors line-clamp-2 mb-2">
                                  {assignment.protocol.name}
                                </h3>
                                  <Badge className="bg-gray-700/20 text-gray-500 border-gray-700/30 text-xs px-1.5 py-0.5 lg:px-2 lg:py-1">
                                  {t.inactive}
                                </Badge>
                              </div>

                              {/* Doctor Info - Only show if showDoctorInfo is true */}
                              {assignment.protocol.showDoctorInfo && assignment.protocol.doctor && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                                    {assignment.protocol.doctor.image ? (
                                      <img 
                                        src={assignment.protocol.doctor.image} 
                                        alt={assignment.protocol.doctor.name || t.responsibleDoctor}
                                        className="w-full h-full object-cover grayscale"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                        className="w-full h-full bg-gray-600 flex items-center justify-center"
                                      style={{ display: assignment.protocol.doctor.image ? 'none' : 'flex' }}
                                    >
                                        <span className="text-xs text-gray-400 font-medium">
                                        {assignment.protocol.doctor.name?.charAt(0) || 'M'}
                                      </span>
                                    </div>
                                  </div>
                                    <span className="text-xs text-gray-500">
                                    {assignment.protocol.doctor.name || t.responsibleDoctor}
                                  </span>
                                </div>
                              )}
                              
                              {assignment.protocol.description && (
                                  <p className="text-xs lg:text-sm text-gray-500 leading-relaxed line-clamp-2">
                                  {assignment.protocol.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 lg:gap-4 text-xs text-gray-600">
                                  <div className="flex items-center gap-1">
                                    <CalendarDaysIcon className="h-3 w-3 text-gray-600" />
                                <span>{assignment.protocol.duration} {t.days}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DocumentTextIcon className="h-3 w-3 text-gray-600" />
                                <span>{totalTasks} {t.tasks}</span>
                                  </div>
                              </div>

                              {hasModal && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-500 hover:bg-gray-700 hover:text-white hover:border-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs h-6 lg:h-7 px-2 lg:px-3"
                                >
                                  {t.seeDetails}
                                </Button>
                              )}
                              </div>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Modal */}
      <ProtocolModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        title={modalData.title}
        description={modalData.description}
        videoUrl={modalData.videoUrl}
        buttonText={modalData.buttonText}
        buttonUrl={modalData.buttonUrl}
      />
    </div>
  );
} 