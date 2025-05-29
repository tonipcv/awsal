/* eslint-disable */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckIcon, 
  ArrowLeftIcon, 
  CalendarDaysIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  ShoppingBagIcon,
  LinkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { TaskInfoModal } from "@/components/ui/task-info-modal";

interface ProtocolProgress {
  id: string;
  date: string;
  isCompleted: boolean;
  notes?: string;
  protocolTask: {
    id: string;
    title: string;
    description?: string;
    order: number;
    protocolDay: {
      id: string;
      dayNumber: number;
      protocol: {
        id: string;
        name: string;
        duration: number;
      };
    };
  };
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
  discountPercentage?: number;
  purchaseUrl?: string;
  isActive: boolean;
}

interface ProtocolProduct {
  id: string;
  productId: string;
  order: number;
  isRequired: boolean;
  notes?: string;
  product: Product;
}

interface ActiveProtocol {
  id: string;
  userId: string;
  protocolId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  protocol: {
    id: string;
    name: string;
    duration: number;
    description?: string;
    days: Array<{
      id: string;
      dayNumber: number;
      sessions: Array<{
        id: string;
        name: string;
        description?: string;
        order: number;
        tasks: Array<{
          id: string;
          title: string;
          description?: string;
          order: number;
          hasMoreInfo?: boolean;
          videoUrl?: string;
          fullExplanation?: string;
          productId?: string;
          modalTitle?: string;
          modalButtonText?: string;
          product?: {
            id: string;
            name: string;
            description?: string;
            brand?: string;
            imageUrl?: string;
            originalPrice?: number;
            discountPrice?: number;
            purchaseUrl?: string;
          };
        }>;
      }>;
      tasks: Array<{
        id: string;
        title: string;
        description?: string;
        order: number;
        hasMoreInfo?: boolean;
        videoUrl?: string;
        fullExplanation?: string;
        productId?: string;
        modalTitle?: string;
        modalButtonText?: string;
        product?: {
          id: string;
          name: string;
          description?: string;
          brand?: string;
          imageUrl?: string;
          originalPrice?: number;
          discountPrice?: number;
          purchaseUrl?: string;
        };
      }>;
    }>;
    doctor: {
      id: string;
      name?: string;
      email?: string;
    };
  };
}

export default function ProtocolChecklistPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [activeProtocol, setActiveProtocol] = useState<ActiveProtocol | null>(null);
  const [progress, setProgress] = useState<ProtocolProgress[]>([]);
  const [products, setProducts] = useState<ProtocolProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showTaskInfoModal, setShowTaskInfoModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const loadActiveProtocol = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protocols/assign');
      const assignments = await response.json();
      
      console.log('Loaded assignments:', assignments);
      
      // Buscar protocolo específico pelo ID da URL
      const protocolId = params.protocolId as string;
      const targetProtocol = assignments.find((assignment: any) => assignment.protocolId === protocolId);
      
      if (targetProtocol) {
        setActiveProtocol(targetProtocol);
        console.log('Active protocol:', targetProtocol);
        
        // Carregar progresso do protocolo
        const progressResponse = await fetch(`/api/protocols/progress?protocolId=${targetProtocol.protocolId}`);
        const progressData = await progressResponse.json();
        console.log('Progress data loaded:', progressData);
        console.log('Progress data length:', progressData?.length);
        console.log('Progress data sample:', progressData?.[0]);
        setProgress(Array.isArray(progressData) ? progressData : []);

        // Carregar produtos do protocolo
        loadProtocolProducts(targetProtocol.protocolId);
      } else {
        // Protocolo não encontrado, redirecionar para página de protocolos
        router.push('/protocols');
      }
    } catch (error) {
      console.error('Error loading active protocol:', error);
      router.push('/protocols');
    } finally {
      setIsLoading(false);
    }
  }, [params.protocolId, router]);

  const loadProtocolProducts = async (protocolId: string) => {
    try {
      setIsLoadingProducts(true);
      const response = await fetch(`/api/protocols/${protocolId}/products/patient`);
      
      if (response.ok) {
        const productsData = await response.json();
        console.log('Products loaded:', productsData);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error('Error loading products:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading protocol products:', error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadActiveProtocol();
  }, [loadActiveProtocol]);

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const toggleTask = async (taskId: string, date: string) => {
    console.log('=== TOGGLE TASK DEBUG ===');
    console.log('TaskId:', taskId);
    console.log('Date:', date);
    console.log('Active Protocol ID:', activeProtocol?.protocolId);
    console.log('User ID:', session?.user?.id);
    console.log('Current progress state:', progress);
    
    try {
      const requestBody = { protocolTaskId: taskId, date };
      console.log('Request body:', requestBody);
      
      const response = await fetch('/api/protocols/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Toggle response status:', response.status);
      console.log('Toggle response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('Toggle result:', result);
        
        // Recarregar progresso
        console.log('Reloading progress...');
        const progressResponse = await fetch(`/api/protocols/progress?protocolId=${activeProtocol?.protocolId}`);
        console.log('Progress reload status:', progressResponse.status);
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          console.log('Reloaded progress data:', progressData);
          console.log('Reloaded progress length:', progressData?.length);
          
          // Verificar se os dados realmente mudaram
          const oldProgressLength = progress.length;
          const newProgressLength = Array.isArray(progressData) ? progressData.length : 0;
          console.log('Progress length change:', oldProgressLength, '->', newProgressLength);
          
          setProgress(Array.isArray(progressData) ? progressData : []);
        } else {
          console.error('Failed to reload progress:', progressResponse.status);
        }
      } else {
        let error;
        try {
          error = JSON.parse(responseText);
        } catch {
          error = { error: responseText };
        }
        console.error('Toggle error:', error);
        alert(`Erro ao atualizar tarefa: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      alert(`Erro de rede: ${error}`);
    }
  };

  const getDateForProtocolDay = (dayNumber: number): string => {
    if (!activeProtocol) return '';
    const startDate = new Date(activeProtocol.startDate);
    const targetDate = addDays(startDate, dayNumber - 1);
    return format(targetDate, 'yyyy-MM-dd');
  };

  const isTaskCompleted = (taskId: string, date: string) => {
    const completed = progress.some(p => {
      // Normalizar ambas as datas para comparação
      const progressDate = new Date(p.date);
      const targetDate = new Date(date);
      
      // Comparar apenas ano, mês e dia (ignorar horas)
      const progressDateStr = format(progressDate, 'yyyy-MM-dd');
      const targetDateStr = format(targetDate, 'yyyy-MM-dd');
      
      const isMatch = p.protocolTask.id === taskId && 
                     progressDateStr === targetDateStr && 
                     p.isCompleted;
      
      if (isMatch) {
        console.log('Task completed match found:', {
          taskId,
          targetDate: targetDateStr,
          progressDate: progressDateStr,
          isCompleted: p.isCompleted,
          progressItem: p
        });
      }
      
      return isMatch;
    });
    
    return completed;
  };

  const getDayStatus = (dayNumber: number) => {
    if (!activeProtocol) return 'future';
    
    const today = new Date();
    const startDate = new Date(activeProtocol.startDate);
    const dayDate = addDays(startDate, dayNumber - 1);
    
    // Normalizar datas (remover horas)
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const normalizedDayDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
    
    if (normalizedDayDate < normalizedToday) return 'past';
    if (normalizedDayDate.getTime() === normalizedToday.getTime()) return 'current';
    return 'future';
  };

  const getDayProgressStatus = (dayNumber: number) => {
    if (!activeProtocol) return 'pending';
    
    const day = activeProtocol.protocol.days.find(d => d.dayNumber === dayNumber);
    if (!day) return 'pending';
    
    // Coletar todas as tarefas (diretas + das sessões)
    const allTasks = [
      ...day.tasks,
      ...day.sessions.flatMap(session => session.tasks)
    ];
    
    if (allTasks.length === 0) return 'completed';
    
    const date = getDateForProtocolDay(dayNumber);
    const completedTasks = allTasks.filter(task => isTaskCompleted(task.id, date));
    
    if (completedTasks.length === allTasks.length) return 'completed';
    if (completedTasks.length > 0) return 'partial';
    return 'pending';
  };

  const getDayProgress = (dayNumber: number) => {
    if (!activeProtocol) return { completed: 0, total: 0 };
    
    const day = activeProtocol.protocol.days.find(d => d.dayNumber === dayNumber);
    if (!day) return { completed: 0, total: 0 };
    
    // Coletar todas as tarefas (diretas + das sessões)
    const allTasks = [
      ...day.tasks,
      ...day.sessions.flatMap(session => session.tasks)
    ];
    
    const date = getDateForProtocolDay(dayNumber);
    const completed = allTasks.filter(task => isTaskCompleted(task.id, date)).length;
    
    return { completed, total: allTasks.length };
  };

  const getCurrentDay = () => {
    if (!activeProtocol) return 1;
    
    const today = new Date();
    const startDate = new Date(activeProtocol.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(1, Math.min(diffDays, activeProtocol.protocol.duration));
  };

  // Função para verificar se uma sessão está completa
  const isSessionCompleted = (session: any, date: string) => {
    if (session.tasks.length === 0) return true;
    return session.tasks.every((task: any) => isTaskCompleted(task.id, date));
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-300">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 z-10 border-b border-zinc-700/30">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-[88px] lg:pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="text-zinc-300 hover:text-white">
                <Link href="/protocols">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Protocolos</span>
                </Link>
              </Button>
              <div className="h-4 w-px bg-zinc-600 hidden sm:block" />
              <h1 className="text-sm sm:text-lg lg:text-xl font-light text-white truncate">
                {activeProtocol ? activeProtocol.protocol.name : 'Carregando...'}
              </h1>
            </div>
            {activeProtocol && (
              <div className="hidden lg:flex items-center gap-4 text-sm text-zinc-400">
                <span>{activeProtocol.protocol.duration} dias</span>
                <span>•</span>
                <span>Dr. {activeProtocol.protocol.doctor?.name || 'Carregando...'}</span>
                <span>•</span>
                <span>Dia {getCurrentDay()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pt-8 pb-24">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <span className="text-zinc-300">Carregando protocolo...</span>
          </div>
        ) : !activeProtocol ? (
          <div className="text-center py-16">
            <span className="text-zinc-300">Protocolo não encontrado.</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Protocol Overview */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-6 lg:p-8 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-xl lg:text-2xl font-light text-white mb-2">
                    {activeProtocol.protocol.name}
                  </h2>
                  {activeProtocol.protocol.description && (
                    <p className="text-zinc-300 leading-relaxed">
                      {activeProtocol.protocol.description}
                    </p>
                  )}
                  <div className="mt-4 text-sm text-zinc-400">
                    Iniciado em {format(new Date(activeProtocol.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-light text-zinc-200">{getCurrentDay()}</div>
                    <div className="text-xs text-zinc-400">Dia Atual</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-white">{activeProtocol.protocol.duration}</div>
                    <div className="text-xs text-zinc-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-white">
                      {activeProtocol.protocol.days.reduce((acc, day) => acc + day.tasks.length, 0)}
                    </div>
                    <div className="text-xs text-zinc-400">Tarefas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-light text-green-400">
                      {progress.filter(p => p.isCompleted).length}
                    </div>
                    <div className="text-xs text-zinc-400">Concluídas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Protocol Days */}
            <div className="space-y-6">
              {activeProtocol.protocol.days
                .sort((a, b) => {
                  const statusA = getDayStatus(a.dayNumber);
                  const statusB = getDayStatus(b.dayNumber);
                  
                  // Prioridade: current > future > past
                  const statusPriority = { current: 0, future: 1, past: 2 };
                  
                  if (statusA !== statusB) {
                    return statusPriority[statusA] - statusPriority[statusB];
                  }
                  
                  // Se mesmo status, ordenar por número do dia
                  return a.dayNumber - b.dayNumber;
                })
                .map(day => {
                  const dayStatus = getDayStatus(day.dayNumber);
                  const dayProgress = getDayProgress(day.dayNumber);
                  const dayDate = getDateForProtocolDay(day.dayNumber);
                  const isCurrentDay = getCurrentDay() === day.dayNumber;
                  
                  return (
                    <div 
                      key={day.id} 
                      className={cn(
                        "bg-zinc-900/50 border border-zinc-800/50 rounded-lg transition-all duration-200 backdrop-blur-sm",
                        isCurrentDay && "ring-1 ring-zinc-400/30 bg-zinc-500/10",
                        dayStatus === 'past' && dayProgress.completed === dayProgress.total && "border-green-500/30",
                      )}
                    >
                      {/* Day Header */}
                      <div className="p-6 border-b border-zinc-600/20">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                              isCurrentDay && "bg-zinc-500 text-white",
                              dayStatus === 'past' && dayProgress.completed === dayProgress.total && "bg-green-500 text-white",
                              dayStatus === 'past' && dayProgress.completed < dayProgress.total && "bg-yellow-500 text-white",
                              dayStatus === 'future' && "bg-zinc-700 text-zinc-400"
                            )}>
                              {dayStatus === 'past' && dayProgress.completed === dayProgress.total ? (
                                <CheckCircleIcon className="h-5 w-5" />
                              ) : (
                                day.dayNumber
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-light text-white">
                                  Dia {day.dayNumber}
                                </h3>
                                {isCurrentDay && (
                                  <Badge className="bg-zinc-500/20 text-zinc-300 border-zinc-500/30 text-xs">
                                    Hoje
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-zinc-400 mt-1">
                                {format(addDays(new Date(activeProtocol.startDate), day.dayNumber - 1), 'dd/MM/yyyy', { locale: ptBR })} • {day.sessions.length + day.tasks.length} {(day.sessions.length + day.tasks.length) === 1 ? 'item' : 'itens'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-light text-white">
                              {dayProgress.completed}/{dayProgress.total}
                            </div>
                            <div className="text-xs text-zinc-400">Concluídas</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {dayProgress.total > 0 && (
                          <div className="w-full bg-zinc-700 rounded-full h-2 mt-4">
                            <div 
                              className={cn(
                                "h-2 rounded-full transition-all duration-500",
                                dayProgress.completed === dayProgress.total ? "bg-green-500" : "bg-zinc-400"
                              )}
                              style={{ width: `${(dayProgress.completed / dayProgress.total) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Tasks */}
                      <div className="p-6">
                        <div className="space-y-6">
                          {/* Sessões */}
                          {day.sessions
                            .sort((a, b) => a.order - b.order)
                            .map(session => (
                              <div key={session.id} className="space-y-4">
                                {/* Session Header */}
                                <div className="border-b border-zinc-600/30 pb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <h4 className={cn(
                                        "text-base font-medium",
                                        isSessionCompleted(session, dayDate) 
                                          ? "text-green-400" 
                                          : "text-[#76e1d8]"
                                      )}>
                                        {session.name}
                                      </h4>
                                      {isSessionCompleted(session, dayDate) && (
                                        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                          <CheckIcon className="h-3 w-3 mr-1" />
                                          Completa
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                      {session.tasks.filter((task: any) => isTaskCompleted(task.id, dayDate)).length}/{session.tasks.length}
                                    </div>
                                  </div>
                                  {session.description && (
                                    <p className={cn(
                                      "text-sm mt-2",
                                      isSessionCompleted(session, dayDate) 
                                        ? "text-green-300/70" 
                                        : "text-zinc-400"
                                    )}>
                                      {session.description}
                                    </p>
                                  )}
                                </div>

                                {/* Session Tasks */}
                                <div className={cn(
                                  "space-y-3 pl-4 border-l-2",
                                  isSessionCompleted(session, dayDate) 
                                    ? "border-green-400/50" 
                                    : "border-[#76e1d8]/30"
                                )}>
                                  {session.tasks
                                    .sort((a, b) => a.order - b.order)
                                    .map(task => {
                                      const isCompleted = isTaskCompleted(task.id, dayDate);
                                      const canInteract = dayStatus !== 'future';
                                      
                                      return (
                                        <div 
                                          key={task.id}
                                          className={cn(
                                            "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
                                            isCompleted 
                                              ? "bg-green-500/10 border-green-500/20" 
                                              : "bg-zinc-800/30 border-zinc-600/30 hover:border-zinc-500/50",
                                            !canInteract && "opacity-50"
                                          )}
                                        >
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={!canInteract}
                                            className={cn(
                                              "w-6 h-6 rounded-full flex-shrink-0 mt-0.5",
                                              isCompleted 
                                                ? "bg-green-500 border-green-500 text-white hover:bg-green-600" 
                                                : "border-zinc-600 hover:border-zinc-500",
                                              !canInteract && "cursor-not-allowed"
                                            )}
                                            onClick={() => canInteract && toggleTask(task.id, dayDate)}
                                          >
                                            {isCompleted && <CheckIcon className="h-3 w-3" />}
                                          </Button>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                              <h5 className={cn(
                                                "text-sm font-medium",
                                                isCompleted ? "text-green-100 line-through" : "text-white"
                                              )}>
                                                {task.title}
                                              </h5>
                                              
                                              {/* Botão Ver Mais - só aparece se a tarefa tem informações adicionais */}
                                              {task.hasMoreInfo && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-[#76e1d8] hover:text-white hover:bg-[#76e1d8]/20 ml-2"
                                                  onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowTaskInfoModal(true);
                                                  }}
                                                >
                                                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                                                  {task.modalButtonText || 'Ver mais'}
                                                </Button>
                                              )}
                                            </div>
                                            {task.description && (
                                              <p className={cn(
                                                "text-sm mt-1 leading-relaxed",
                                                isCompleted ? "text-green-200/70" : "text-zinc-300"
                                              )}>
                                                {task.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            ))}

                          {/* Tarefas Diretas (sem sessão) */}
                          {day.tasks.length > 0 && (
                            <div className="space-y-3">
                              {day.sessions.length > 0 && (
                                <div className="border-b border-zinc-600/30 pb-3">
                                  <h4 className="text-base font-medium text-zinc-300">
                                    Outras Tarefas
                                  </h4>
                                </div>
                              )}
                              
                              {day.tasks
                                .sort((a, b) => a.order - b.order)
                                .map(task => {
                                  const isCompleted = isTaskCompleted(task.id, dayDate);
                                  const canInteract = dayStatus !== 'future';
                                  
                                  return (
                                    <div 
                                      key={task.id}
                                      className={cn(
                                        "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
                                        isCompleted 
                                          ? "bg-green-500/10 border-green-500/20" 
                                          : "bg-zinc-800/30 border-zinc-600/30 hover:border-zinc-500/50",
                                        !canInteract && "opacity-50"
                                      )}
                                    >
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        disabled={!canInteract}
                                        className={cn(
                                          "w-6 h-6 rounded-full flex-shrink-0 mt-0.5",
                                          isCompleted 
                                            ? "bg-green-500 border-green-500 text-white hover:bg-green-600" 
                                            : "border-zinc-600 hover:border-zinc-500",
                                          !canInteract && "cursor-not-allowed"
                                        )}
                                        onClick={() => canInteract && toggleTask(task.id, dayDate)}
                                      >
                                        {isCompleted && <CheckIcon className="h-3 w-3" />}
                                      </Button>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <h4 className={cn(
                                            "text-sm font-medium",
                                            isCompleted ? "text-green-100 line-through" : "text-white"
                                          )}>
                                            {task.title}
                                          </h4>
                                          
                                          {/* Botão Ver Mais - só aparece se a tarefa tem informações adicionais */}
                                          {task.hasMoreInfo && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-[#76e1d8] hover:text-white hover:bg-[#76e1d8]/20 ml-2"
                                              onClick={() => {
                                                setSelectedTask(task);
                                                setShowTaskInfoModal(true);
                                              }}
                                            >
                                              <InformationCircleIcon className="h-4 w-4 mr-1" />
                                              {task.modalButtonText || 'Ver mais'}
                                            </Button>
                                          )}
                                        </div>
                                        {task.description && (
                                          <p className={cn(
                                            "text-sm mt-1 leading-relaxed",
                                            isCompleted ? "text-green-200/70" : "text-zinc-300"
                                          )}>
                                            {task.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Protocol Products */}
            {products.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-6 lg:p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-light text-white mb-2">
                    Produtos Recomendados ({products.length})
                  </h3>
                  <p className="text-sm text-[#76e1d8] font-medium">
                    Descontos Exclusivos para Membros
                  </p>
                </div>
                
                {isLoadingProducts ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <span className="text-zinc-300">Carregando produtos...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products
                      .sort((a, b) => a.order - b.order)
                      .map((protocolProduct) => (
                        <div key={protocolProduct.id} className="p-6 bg-zinc-800/30 rounded-xl border border-zinc-600/20 hover:border-[#76e1d8]/30 hover:shadow-lg hover:shadow-[#76e1d8]/5 transition-all duration-300">
                          <div className="flex items-start gap-6">
                            {/* Product Image */}
                            <div className="w-20 h-20 rounded-xl bg-zinc-700/50 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-zinc-600/30">
                              {protocolProduct.product.imageUrl ? (
                                <img 
                                  src={protocolProduct.product.imageUrl} 
                                  alt={protocolProduct.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-zinc-600 rounded-lg" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-semibold text-white mb-1">
                                    {protocolProduct.product.name}
                                  </h4>
                                  {protocolProduct.product.brand && (
                                    <p className="text-sm text-zinc-400 mb-3 font-medium">
                                      {protocolProduct.product.brand}
                                    </p>
                                  )}
                                  {protocolProduct.product.description && (
                                    <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                                      {protocolProduct.product.description}
                                    </p>
                                  )}
                                  
                                  {/* Required Badge */}
                                  {protocolProduct.isRequired && (
                                    <Badge className="bg-[#76e1d8]/20 text-[#76e1d8] border-[#76e1d8]/30 text-xs mb-3 font-medium">
                                      Obrigatório
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-start lg:items-end gap-4">
                                  {/* Price */}
                                  {(protocolProduct.product.originalPrice || protocolProduct.product.discountPrice) && (
                                    <div className="text-left lg:text-right">
                                      {protocolProduct.product.discountPrice && protocolProduct.product.originalPrice ? (
                                        <>
                                          <div className="text-xl font-bold text-[#76e1d8] mb-1">
                                            R$ {protocolProduct.product.discountPrice.toFixed(2)}
                                          </div>
                                          <div className="text-sm text-zinc-500 line-through font-medium">
                                            R$ {protocolProduct.product.originalPrice.toFixed(2)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-xl font-bold text-white">
                                          R$ {protocolProduct.product.originalPrice?.toFixed(2) || protocolProduct.product.discountPrice?.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Purchase Link */}
                                  {protocolProduct.product.purchaseUrl && (
                                    <Button 
                                      size="default" 
                                      className="bg-gradient-to-r from-[#76e1d8] to-[#5dd4c8] hover:from-[#5dd4c8] hover:to-[#4bc5b8] text-white font-semibold px-8 py-2.5 shadow-lg shadow-[#76e1d8]/20 hover:shadow-[#76e1d8]/30 transition-all duration-200"
                                      asChild
                                    >
                                      <a 
                                        href={protocolProduct.product.purchaseUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                      >
                                        Comprar Produto
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Notes */}
                              {protocolProduct.notes && (
                                <div className="mt-4 p-4 bg-zinc-700/40 rounded-lg border border-zinc-600/30">
                                  <p className="text-sm text-zinc-300">
                                    <span className="font-semibold text-[#76e1d8]">Observações:</span> {protocolProduct.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Info Modal */}
      {showTaskInfoModal && selectedTask && (
        <TaskInfoModal
          isOpen={showTaskInfoModal}
          task={selectedTask}
          isCompleted={isTaskCompleted(selectedTask.id, getDateForProtocolDay(1))}
          onClose={() => {
            setShowTaskInfoModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
} 