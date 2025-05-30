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
import ProtocolModal from '@/components/ProtocolModal';

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
  days: Array<{
    id: string;
    dayNumber: number;
    tasks: Array<{
      id: string;
      title: string;
      description?: string;
      order: number;
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
  const [activeProtocols, setActiveProtocols] = useState<ActiveProtocol[]>([]);
  const [unavailableProtocols, setUnavailableProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const loadProtocols = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Carregar protocolos ativos (assignments)
      const assignmentsResponse = await fetch('/api/protocols/assign');
      const assignments = await assignmentsResponse.json();
      setActiveProtocols(Array.isArray(assignments) ? assignments : []);
      
      // Carregar protocolos ativos e indisponíveis
      const protocolsResponse = await fetch('/api/protocols/available');
      const protocolsData = await protocolsResponse.json();
      
      if (protocolsData.unavailable) {
        setUnavailableProtocols(protocolsData.unavailable);
      }
      
      console.log('Loaded protocols:', { assignments, protocolsData });
    } catch (error) {
      console.error('Error loading protocols:', error);
      setActiveProtocols([]);
      setUnavailableProtocols([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProtocols();
  }, [loadProtocols]);

  // Debug: Log doctor data when protocols are loaded
  useEffect(() => {
    if (activeProtocols.length > 0) {
      activeProtocols.forEach(assignment => {
        if (assignment.protocol.showDoctorInfo && assignment.protocol.doctor) {
          console.log('Doctor data:', assignment.protocol.doctor);
        }
      });
    }
  }, [activeProtocols]);

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
    return protocol.days.reduce((acc, day) => acc + day.tasks.length, 0);
  };

  const openModal = (protocol: Protocol) => {
    setModalData({
      isOpen: true,
      title: protocol.modalTitle || protocol.name,
      description: protocol.modalDescription,
      videoUrl: protocol.modalVideoUrl,
      buttonText: protocol.modalButtonText || 'Saber mais',
      buttonUrl: protocol.modalButtonUrl
    });
  };

  const closeModal = () => {
    setModalData(prev => ({ ...prev, isOpen: false }));
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-400">Carregando...</span>
      </div>
    );
  }

  const totalProtocols = activeProtocols.length + unavailableProtocols.length;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-zinc-800/10 to-zinc-900/20" />
        <div className="relative pt-[88px] lg:pt-[120px] pb-12 lg:pb-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-light text-white mb-3">
                  Olá {session?.user?.name || 'Usuário'}
                </h1>
                <p className="text-xl lg:text-2xl text-zinc-300 font-light">
                  Acompanhe seu progresso na jornada estética
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-center gap-8 lg:gap-12">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-light text-white mb-1">
                    {activeProtocols.length}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {activeProtocols.length === 1 ? 'Ativo' : 'Ativos'}
                  </div>
                </div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-light text-white mb-1">
                    {totalProtocols}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Total
                  </div>
                </div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-light text-zinc-200 mb-1">
                    {activeProtocols.length > 0 
                      ? Math.round(activeProtocols.reduce((acc, p) => acc + getProtocolProgress(p).progressPercentage, 0) / activeProtocols.length)
                      : 0}%
                  </div>
                  <div className="text-sm text-zinc-400">
                    Progresso
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-zinc-300">Carregando protocolos...</span>
          </div>
        ) : totalProtocols === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-light text-white mb-3">
                Nenhum protocolo disponível
              </h3>
              <p className="text-zinc-300 mb-6 leading-relaxed">
                Entre em contato com seu médico para obter um protocolo personalizado.
              </p>
              <Button asChild className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2">
                <Link href="/profile">
                  Ver Perfil
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Protocols */}
            {activeProtocols.length > 0 && (
              <section>
                <h2 className="text-xl lg:text-2xl font-light text-white mb-6">
                  Protocolos em Andamento
                </h2>
                
                <div className="grid gap-6">
                  {activeProtocols.map(assignment => {
                    const progress = getProtocolProgress(assignment);
                    const totalTasks = getTotalTasks(assignment.protocol);
                    const isActive = assignment.isActive;
                    const isCompleted = progress.currentDay >= progress.totalDays;
                    
                    return (
                      <Card 
                        key={assignment.id} 
                        className="group bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/70 transition-all duration-300 backdrop-blur-sm"
                      >
                        <CardContent className="p-6 lg:p-8">
                          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Protocol Info */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl lg:text-2xl font-light text-white group-hover:text-zinc-200 transition-colors">
                                    {assignment.protocol.name}
                                  </h3>
                                  {isActive && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                      Ativo
                                    </Badge>
                                  )}
                                  {isCompleted && (
                                    <Badge className="bg-zinc-600/20 text-zinc-300 border-zinc-600/30 text-xs">
                                      Concluído
                                    </Badge>
                                  )}
                                </div>

                                {/* Doctor Info - Only show if showDoctorInfo is true */}
                                {assignment.protocol.showDoctorInfo && assignment.protocol.doctor && (
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                                      {assignment.protocol.doctor.image ? (
                                        <img 
                                          src={assignment.protocol.doctor.image} 
                                          alt={assignment.protocol.doctor.name || 'Médico'}
                                          className="w-full h-full object-cover"
                                          onLoad={() => console.log('Imagem carregada com sucesso:', assignment.protocol.doctor.image)}
                                          onError={(e) => {
                                            console.log('Erro ao carregar imagem:', assignment.protocol.doctor.image);
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                            if (fallback) {
                                              fallback.style.display = 'flex';
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div 
                                        className="w-full h-full bg-zinc-600 flex items-center justify-center"
                                        style={{ display: assignment.protocol.doctor.image ? 'none' : 'flex' }}
                                      >
                                        <span className="text-xs text-zinc-300 font-medium">
                                          {assignment.protocol.doctor.name?.charAt(0) || 'M'}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-sm text-zinc-400">
                                      {assignment.protocol.doctor.name || 'Médico Responsável'}
                                    </span>
                                  </div>
                                )}
                                
                                {assignment.protocol.description && (
                                  <p className="text-zinc-300 leading-relaxed">
                                    {assignment.protocol.description}
                                  </p>
                                )}
                              </div>

                              {/* Protocol Stats */}
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-zinc-400">Duração</div>
                                  <div className="text-white">
                                    {assignment.protocol.duration} dias
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-zinc-400">Tarefas</div>
                                  <div className="text-white">
                                    {totalTasks} atividades
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="text-zinc-400">Início</div>
                                  <div className="text-white">
                                    {format(new Date(assignment.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                </div>
                              </div>

                              {/* Progress */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-zinc-300">
                                    Dia {progress.currentDay} de {progress.totalDays}
                                  </span>
                                  <span className="text-zinc-200 font-medium">
                                    {progress.progressPercentage}%
                                  </span>
                                </div>
                                <Progress 
                                  value={progress.progressPercentage} 
                                  className="h-2 bg-zinc-800"
                                />
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="lg:w-40">
                              <Button 
                                asChild
                                className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 w-full lg:w-auto"
                              >
                                <Link href={`/checklist/${assignment.protocolId}`}>
                                  Continuar
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Unavailable Protocols */}
            {unavailableProtocols.length > 0 && (
              <section>
                <h2 className="text-xl lg:text-2xl font-light text-white mb-6">
                  Protocolos Disponíveis
                </h2>
                
                <div className="grid gap-4 lg:grid-cols-2">
                  {unavailableProtocols.map(protocol => {
                    const totalTasks = getTotalTasks(protocol);
                    
                    return (
                      <Card 
                        key={protocol.id} 
                        className="group bg-zinc-900/30 border-zinc-800/30 hover:border-zinc-700/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                        onClick={() => openModal(protocol)}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-light text-white group-hover:text-zinc-200 transition-colors">
                                  {protocol.name}
                                </h3>
                                <Badge className="bg-zinc-700/20 text-zinc-400 border-zinc-700/30 text-xs">
                                  Indisponível
                                </Badge>
                              </div>

                              {/* Doctor Info - Only show if showDoctorInfo is true */}
                              {protocol.showDoctorInfo && protocol.doctor && (
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-6 h-6 rounded-full bg-zinc-700 overflow-hidden flex-shrink-0">
                                    {protocol.doctor.image ? (
                                      <img 
                                        src={protocol.doctor.image} 
                                        alt={protocol.doctor.name || 'Médico'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.log('Erro ao carregar imagem:', protocol.doctor.image);
                                          e.currentTarget.style.display = 'none';
                                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                          if (fallback) {
                                            fallback.style.display = 'flex';
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div 
                                      className="w-full h-full bg-zinc-600 flex items-center justify-center"
                                      style={{ display: protocol.doctor.image ? 'none' : 'flex' }}
                                    >
                                      <span className="text-xs text-zinc-300 font-medium">
                                        {protocol.doctor.name?.charAt(0) || 'M'}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-sm text-zinc-400">
                                    {protocol.doctor.name || 'Médico Responsável'}
                                  </span>
                                </div>
                              )}
                              
                              {protocol.description && (
                                <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                                  {protocol.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span>{protocol.duration} dias</span>
                                <span>{totalTasks} tarefas</span>
                                <span>{protocol.doctor?.name}</span>
                              </div>

                              <Button 
                                variant="outline"
                                size="sm"
                                className="border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/10 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                              >
                                Ver detalhes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
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