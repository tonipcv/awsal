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
  AcademicCapIcon
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
    active: 'Ativo',
    completed: 'Concluído',
    unavailable: 'Indisponível',
    responsibleDoctor: 'Médico Responsável',
    duration: 'Duração',
    tasks: 'Tarefas',
    days: 'dias',
    dayOf: (current: number, total: number) => `Dia ${current} de ${total}`,
    continue: 'Continuar',
    seeDetails: 'Ver detalhes',
    loading: 'Carregando...'
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
    active: 'Active',
    completed: 'Completed',
    unavailable: 'Unavailable',
    responsibleDoctor: 'Responsible Doctor',
    duration: 'Duration',
    tasks: 'Tasks',
    days: 'days',
    dayOf: (current: number, total: number) => `Day ${current} of ${total}`,
    continue: 'Continue',
    seeDetails: 'See details',
    loading: 'Loading...'
  }
};

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  showDoctorInfo?: boolean;
  modalTitle?: string;
  modalVideoUrl?: string;
  modalDescription?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
  coverImage?: string;
  days: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description?: string;
    sessions: Array<{
      id: string;
      sessionNumber: number;
      title: string;
      description?: string;
      tasks: Array<{
        id: string;
        title: string;
        description?: string;
        orderIndex: number;
      }>;
    }>;
    tasks?: Array<{
      id: string;
      title: string;
      description?: string;
      orderIndex: number;
    }>;
  }>;
  doctor: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  assignments: Array<{
    id: string;
    userId: string;
    protocolId: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    status: string;
  }>;
}

interface ActiveProtocol {
  id: string;
  userId: string;
  protocolId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  protocol: Protocol;
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

  const getProtocolProgress = (protocol: ActiveProtocol) => {
    const today = new Date();
    const startDate = new Date(protocol.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const currentDay = Math.max(1, Math.min(diffDays, protocol.protocol.duration));
    const progressPercentage = Math.round((currentDay / protocol.protocol.duration) * 100);
    
    return {
      currentDay,
      totalDays: protocol.protocol.duration,
      progressPercentage
    };
  };

  const getTotalTasks = (protocol: Protocol | ActiveProtocol['protocol']) => {
    return protocol.days.reduce((acc, day) => {
      // Contar tarefas das sessões
      const sessionTasks = day.sessions?.reduce((sessionAcc, session) => 
        sessionAcc + (session.tasks?.length || 0), 0) || 0;
      
      // Contar tarefas diretas do dia (se existirem)
      const directTasks = day.tasks?.length || 0;
      
      return acc + sessionTasks + directTasks;
    }, 0);
  };

  const openModal = (protocol: Protocol) => {
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

  // Função para obter o médico principal dos protocolos ativos
  const getPrimaryDoctor = () => {
    // Procura pelo primeiro protocolo ativo que tem informações do médico
    const protocolWithDoctor = protocols.find(assignment => 
      assignment.protocol.showDoctorInfo && assignment.protocol.doctor
    );
    
    return protocolWithDoctor?.protocol.doctor || null;
  };

  // Separar protocolos ativos dos inativos
  const activeProtocols = protocols.filter(p => p.isActive);
  const inactiveProtocols = protocols.filter(p => !p.isActive);

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
        {/* Padding para menu lateral no desktop e header no mobile */}
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
          <div className="max-w-6xl mx-auto px-3 py-2 lg:px-6 lg:py-4">
            
            {/* Hero Skeleton */}
            <div className="mb-6 lg:mb-8">
              <div className="text-center max-w-3xl mx-auto">
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

            {/* Protocols Grid Skeleton */}
            <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 lg:p-4">
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="h-5 lg:h-6 bg-gray-800/50 rounded w-32 animate-pulse"></div>
                      <div className="h-4 bg-gray-700/50 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-700/50 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-3/4 animate-pulse"></div>
                    
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <div>
                        <div className="h-3 bg-gray-800/50 rounded w-8 mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-12 animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-800/50 rounded w-12 mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="h-8 lg:h-9 bg-gray-800/50 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                ))}
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
      {/* Padding para menu lateral no desktop e header no mobile */}
      <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
        
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
                    {activeProtocols.length}
                  </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {activeProtocols.length === 1 ? t.activeProtocol : t.activeProtocols}
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
        <div className="max-w-6xl mx-auto px-3 lg:px-6">
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
                    const isActive = assignment.isActive;
                    const isCompleted = progress.currentDay >= progress.totalDays;
                    
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
                                    {isActive && (
                                      <Badge className="bg-turquoise/15 text-turquoise border-turquoise/25 text-xs px-1.5 py-0.5 lg:px-2 lg:py-1">
                                        {t.active}
                                      </Badge>
                                    )}
                                    {isCompleted && (
                                      <Badge className="bg-gray-600/20 text-gray-300 border-gray-600/30 text-xs px-1.5 py-0.5 lg:px-2 lg:py-1">
                                        {t.completed}
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

                              {/* Action Button Compacto */}
                              <div className="pt-1">
                              <Button 
                                asChild
                                  className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200"
                              >
                                <Link href={`/patient/checklist/${assignment.protocolId}`}>
                                    <PlayIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
                                  {t.continue}
                                </Link>
                              </Button>
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
                    Protocolos Inativos
                </h2>
                
                  <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {inactiveProtocols.map(assignment => {
                    const totalTasks = getTotalTasks(assignment.protocol);
                    
                    return (
                        <div 
                        key={assignment.id} 
                          className="group bg-gray-900/20 border border-gray-800/30 rounded-xl hover:border-gray-700/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                        onClick={() => openModal(assignment.protocol)}
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
                                  Inativo
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

                              <Button 
                                variant="outline"
                                size="sm"
                                className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white hover:border-gray-500 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs h-6 lg:h-7 px-2 lg:px-3"
                              >
                                {t.seeDetails}
                              </Button>
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