/* eslint-disable */
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CheckIcon, 
  ArrowLeftIcon, 
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
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
  _optimistic?: boolean;
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
  const [showTaskInfoModal, setShowTaskInfoModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());
  const [debounceMap, setDebounceMap] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Memoizar cálculos pesados
  const progressMap = useMemo(() => {
    const map = new Map<string, ProtocolProgress>();
    progress.forEach(p => {
      // Normalizar a data para formato yyyy-MM-dd para coincidir com getDateForProtocolDay
      const dateOnly = p.date.split('T')[0];
      const key = `${p.protocolTask.id}-${dateOnly}`;
      map.set(key, p);
    });
    return map;
  }, [progress]);

  const loadActiveProtocol = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protocols/assign');
      const assignments = await response.json();
      
      const protocolId = params.protocolId as string;
      const targetProtocol = assignments.find((assignment: any) => assignment.protocolId === protocolId);
      
      if (targetProtocol) {
        setActiveProtocol(targetProtocol);
        
        // Carregar progresso e produtos em paralelo
        const [progressResponse, productsResponse] = await Promise.all([
          fetch(`/api/protocols/progress?protocolId=${targetProtocol.protocolId}`),
          fetch(`/api/protocols/${targetProtocol.protocolId}/products/patient`)
        ]);
        
        const [progressData, productsData] = await Promise.all([
          progressResponse.json(),
          productsResponse.ok ? productsResponse.json() : []
        ]);
        
        setProgress(Array.isArray(progressData) ? progressData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        router.push('/protocols');
      }
    } catch (error) {
      console.error('Error loading protocol:', error);
      router.push('/protocols');
    } finally {
      setIsLoading(false);
    }
  }, [params.protocolId, router]);

  useEffect(() => {
    loadActiveProtocol();
  }, [loadActiveProtocol]);

  // Cleanup dos timeouts quando o componente for desmontado
  useEffect(() => {
    return () => {
      debounceMap.forEach(timeout => clearTimeout(timeout));
    };
  }, [debounceMap]);

  const toggleTask = useCallback(async (taskId: string, date: string) => {
    if (!taskId || !date) {
      console.error('❌ TaskId ou date inválidos:', { taskId, date });
      return;
    }

    const debounceKey = `${taskId}-${date}`;
    
    // Cancelar debounce anterior se existir
    const existingTimeout = debounceMap.get(debounceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Verificar estado atual
    const key = `${taskId}-${date}`;
    const currentProgress = progressMap.get(key);
    const newCompletedState = !currentProgress?.isCompleted;
    
    // Marcar como pendente ANTES da atualização
    setPendingTasks(prev => new Set(prev).add(taskId));
    
    // Atualização otimista IMEDIATA
    setProgress(prev => {
      const [year, month, day] = date.split('-').map(Number);
      const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      
      const existingIndex = prev.findIndex(p => 
        p.protocolTask.id === taskId && 
        new Date(p.date).getTime() === normalizedDate.getTime()
      );
      
      if (existingIndex >= 0) {
        // Atualizar registro existente
        const newProgress = [...prev];
        newProgress[existingIndex] = {
          ...newProgress[existingIndex],
          isCompleted: newCompletedState,
          _optimistic: true
        };
        return newProgress;
      } else {
        // Criar novo registro otimista
        return [...prev, {
          id: `optimistic-${taskId}-${date}`,
          date: normalizedDate.toISOString(),
          isCompleted: newCompletedState,
          _optimistic: true,
          protocolTask: {
            id: taskId,
            title: '',
            order: 0,
            protocolDay: {
              id: '',
              dayNumber: 0,
              protocol: { id: '', name: '', duration: 0 }
            }
          },
          user: { id: session?.user?.id || '' }
        }];
      }
    });

    // Debounce da chamada da API
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/protocols/progress', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            protocolTaskId: taskId, 
            date: date 
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.progress) {
          // Substituir dados otimistas pelos dados reais da API (SEM piscar)
          setProgress(prev => {
            const [year, month, day] = date.split('-').map(Number);
            const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            
            // Encontrar e substituir APENAS se o estado for diferente
            const existingIndex = prev.findIndex(p => 
              p.protocolTask.id === taskId && 
              new Date(p.date).getTime() === normalizedDate.getTime()
            );
            
            if (existingIndex >= 0) {
              const existing = prev[existingIndex];
              // Só atualizar se o estado mudou (evita piscar)
              if (existing.isCompleted !== result.progress.isCompleted || existing._optimistic) {
                const newProgress = [...prev];
                newProgress[existingIndex] = {
                  ...result.progress,
                  _optimistic: false
                };
                return newProgress;
              }
              return prev; // Não mudou, não atualizar
            } else {
              // Remover otimistas e adicionar real
              const filteredProgress = prev.filter(p => 
                !(p.protocolTask.id === taskId && 
                  new Date(p.date).getTime() === normalizedDate.getTime())
              );
              return [...filteredProgress, result.progress];
            }
          });
        } else {
          throw new Error('Resposta inválida da API');
        }
      } catch (error) {
        console.error('❌ Erro ao alternar tarefa:', error);
        
        // Reverter para estado original em caso de erro
        setProgress(prev => {
          const [year, month, day] = date.split('-').map(Number);
          const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
          
          const existingIndex = prev.findIndex(p => 
            p.protocolTask.id === taskId && 
            new Date(p.date).getTime() === normalizedDate.getTime()
          );
          
          if (existingIndex >= 0) {
            const newProgress = [...prev];
            newProgress[existingIndex] = {
              ...newProgress[existingIndex],
              isCompleted: !newCompletedState,
              _optimistic: false
            };
            return newProgress;
          }
          // Remover registros otimistas que falharam
          return prev.filter(p => !p.id?.startsWith('optimistic-'));
        });
        
        alert('Erro ao atualizar tarefa. Tente novamente.');
      } finally {
        setPendingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        
        // Limpar debounce
        setDebounceMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(debounceKey);
          return newMap;
        });
      }
    }, 100); // Debounce de 100ms

    // Salvar timeout no map
    setDebounceMap(prev => new Map(prev).set(debounceKey, timeout));
  }, [progressMap, session?.user?.id, debounceMap]);

  const getDateForProtocolDay = useCallback((dayNumber: number): string => {
    if (!activeProtocol) return '';
    const startDate = new Date(activeProtocol.startDate);
    const targetDate = addDays(startDate, dayNumber - 1);
    return format(targetDate, 'yyyy-MM-dd');
  }, [activeProtocol]);

  const isTaskCompleted = useCallback((taskId: string, date: string) => {
    const key = `${taskId}-${date}`;
    return progressMap.get(key)?.isCompleted || false;
  }, [progressMap]);

  const getCurrentDay = useCallback(() => {
    if (!activeProtocol) return 1;
    
    const today = new Date();
    const startDate = new Date(activeProtocol.startDate);
    
    // Normalizar as datas para comparação (apenas data, sem hora) - mesma lógica do getDayStatus
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    const diffTime = normalizedToday.getTime() - normalizedStartDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(1, Math.min(diffDays, activeProtocol.protocol.duration));
  }, [activeProtocol]);

  const getDayStatus = useCallback((dayNumber: number) => {
    if (!activeProtocol) return 'future';
    
    const today = new Date();
    const startDate = new Date(activeProtocol.startDate);
    const dayDate = addDays(startDate, dayNumber - 1);
    
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const normalizedDayDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
    
    if (normalizedDayDate < normalizedToday) return 'past';
    if (normalizedDayDate.getTime() === normalizedToday.getTime()) return 'current';
    return 'future';
  }, [activeProtocol]);

  if (!session || isLoading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Padding para menu lateral no desktop e header no mobile */}
        <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
          <div className="max-w-4xl mx-auto px-3 py-2 lg:px-4 lg:py-4">
            
            {/* Header Skeleton */}
            <div className="mb-4 lg:mb-6">
              <div className="flex items-center gap-2 lg:gap-3 mb-2">
                <div className="h-8 w-8 bg-zinc-800/50 rounded animate-pulse"></div>
                <div className="h-4 w-px bg-zinc-700"></div>
                <div className="h-6 bg-zinc-800/50 rounded-lg w-48 animate-pulse"></div>
              </div>
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-zinc-800/50 rounded w-6 animate-pulse"></div>
                  <div className="h-5 bg-zinc-700/50 rounded w-8 animate-pulse"></div>
                  <div className="h-4 bg-zinc-700/30 rounded w-16 ml-2 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Protocol Days Skeleton */}
            <div className="space-y-3 lg:space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl backdrop-blur-sm">
                  {/* Day Header Skeleton */}
                  <div className="p-3 lg:p-4 border-b border-zinc-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className="w-7 h-7 lg:w-8 lg:h-8 bg-zinc-800/50 rounded-full animate-pulse"></div>
                        <div>
                          <div className="h-4 lg:h-5 bg-zinc-800/50 rounded w-16 mb-1 animate-pulse"></div>
                          <div className="h-3 bg-zinc-700/50 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-zinc-800/50 rounded-md w-12 animate-pulse"></div>
                    </div>
                  </div>

                  {/* Sessions Skeleton */}
                  <div className="p-3 lg:p-4 space-y-2 lg:space-y-3">
                    {[1, 2].map((j) => (
                      <div key={j} className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-2 lg:p-3">
                        <div className="h-4 bg-zinc-700/50 rounded w-24 mb-2 lg:mb-3 animate-pulse"></div>
                        
                        {/* Tasks Skeleton */}
                        <div className="space-y-2">
                          {[1, 2, 3].map((k) => (
                            <div key={k} className="flex items-center gap-2 lg:gap-3 p-2 bg-zinc-900/30 rounded-lg border border-zinc-700/20">
                              <div className="w-5 h-5 bg-zinc-700/50 rounded border animate-pulse"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-zinc-700/50 rounded w-32 mb-1 animate-pulse"></div>
                                <div className="h-3 bg-zinc-800/50 rounded w-48 animate-pulse"></div>
                              </div>
                              <div className="w-6 h-6 bg-zinc-700/50 rounded animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Products Section Skeleton */}
            <div className="mt-6 lg:mt-8 bg-zinc-900/50 border border-zinc-800/50 rounded-xl backdrop-blur-sm">
              <div className="p-3 lg:p-4 border-b border-zinc-800/30">
                <div className="h-4 lg:h-5 bg-zinc-800/50 rounded w-32 animate-pulse"></div>
              </div>
              <div className="p-3 lg:p-4">
                <div className="grid gap-2 lg:gap-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-700/50 rounded-lg animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-zinc-700/50 rounded w-24 animate-pulse"></div>
                        <div className="h-3 bg-zinc-800/50 rounded w-32 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 bg-zinc-700/50 rounded w-16 animate-pulse"></div>
                          <div className="h-4 bg-zinc-800/50 rounded w-12 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-zinc-700/50 rounded-lg w-16 lg:w-20 animate-pulse"></div>
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

  if (!activeProtocol) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64 flex items-center justify-center">
          <span className="text-gray-400">Protocolo não encontrado</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Padding para menu lateral no desktop e header no mobile */}
      <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
          {/* Header Section */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-turquoise transition-colors -ml-2">
                <Link href="/protocols">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-700/50" />
              <h1 className="text-xl lg:text-2xl font-medium text-white tracking-tight">
                {activeProtocol.protocol.name}
              </h1>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Acompanhe seu progresso diário
              </div>
              <div className="flex items-center gap-3 bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-2">
                <span className="text-2xl font-bold text-turquoise">
                  {getCurrentDay()}
                </span>
                <span className="text-gray-500">de {activeProtocol.protocol.duration}</span>
                <div className="h-4 w-px bg-gray-700/50 mx-1" />
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Dia Atual
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:space-y-8">
            {activeProtocol.protocol.days
              .sort((a, b) => {
                const statusA = getDayStatus(a.dayNumber);
                const statusB = getDayStatus(b.dayNumber);
                
                // Se um é current e outro não, current vem primeiro
                if (statusA === 'current' && statusB !== 'current') return -1;
                if (statusB === 'current' && statusA !== 'current') return 1;
                
                // Se ambos são current (não deveria acontecer) ou ambos não são current
                if (statusA === statusB) {
                  return a.dayNumber - b.dayNumber; // Ordem crescente por número do dia
                }
                
                // Entre future e past, future vem primeiro
                if (statusA === 'future' && statusB === 'past') return -1;
                if (statusA === 'past' && statusB === 'future') return 1;
                
                return a.dayNumber - b.dayNumber;
              })
              .map(day => {
                const dayStatus = getDayStatus(day.dayNumber);
                const dayDate = getDateForProtocolDay(day.dayNumber);
                const isCurrentDay = getCurrentDay() === day.dayNumber;
                
                return (
                  <div 
                    key={day.id} 
                    className={cn(
                      "bg-white/[0.02] border border-gray-800/60 rounded-2xl transition-all duration-300 backdrop-blur-sm overflow-hidden",
                      isCurrentDay && "ring-1 ring-turquoise/40 bg-turquoise/[0.02] border-turquoise/20",
                      dayStatus === 'future' && "opacity-60"
                    )}
                  >
                    {/* Day Header */}
                    <div className="p-6 lg:p-8 border-b border-gray-800/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center text-lg font-semibold border-2 transition-all",
                            isCurrentDay 
                              ? "bg-turquoise/15 border-turquoise/50 text-turquoise shadow-lg shadow-turquoise/10" 
                              : "bg-gray-800/50 border-gray-700/50 text-gray-300"
                          )}>
                            {day.dayNumber}
                          </div>
                          <div>
                            <h3 className="text-lg lg:text-xl font-semibold text-white mb-1">
                              Dia {day.dayNumber}
                            </h3>
                            <div className="text-sm text-gray-400 font-medium">
                              {format(addDays(new Date(activeProtocol.startDate), day.dayNumber - 1), 'EEEE, dd/MM', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        {isCurrentDay && (
                          <div className="px-4 py-2 bg-turquoise/15 border border-turquoise/30 rounded-xl">
                            <span className="text-sm font-semibold text-turquoise uppercase tracking-wider">
                              Hoje
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Tasks Section */}
                    <div className="p-6 lg:p-8">
                      {day.sessions
                        .sort((a, b) => a.order - b.order)
                        .map((session, sessionIndex) => (
                          <div key={session.id} className={cn("space-y-4", sessionIndex > 0 && "mt-8")}>
                            {/* Session Header */}
                            {session.name && (
                              <div className="mb-6">
                                <h4 className="text-base font-semibold text-turquoise mb-2">
                                  {session.name}
                                </h4>
                                {session.description && (
                                  <p className="text-sm text-gray-400 leading-relaxed">
                                    {session.description}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Tasks Grid */}
                            <div className="space-y-3">
                              {session.tasks
                                .sort((a, b) => a.order - b.order)
                                .map(task => {
                                  const isCompleted = isTaskCompleted(task.id, dayDate);
                                  const canInteract = dayStatus !== 'future';
                                  const isPending = pendingTasks.has(task.id);
                                  
                                  return (
                                    <div 
                                      key={task.id}
                                      className={cn(
                                        "group flex items-start gap-4 p-4 lg:p-5 rounded-xl border transition-all duration-200 hover:border-gray-600/60 hover:bg-white/[0.01]",
                                        isCompleted 
                                          ? "bg-turquoise/[0.08] border-turquoise/30 hover:border-turquoise/40" 
                                          : "bg-gray-800/20 border-gray-700/40",
                                        !canInteract && "opacity-50",
                                        isPending && "opacity-80 scale-[0.99]"
                                      )}
                                    >
                                      <button
                                        disabled={!canInteract || isPending}
                                        className={cn(
                                          "w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 mt-0.5 flex-shrink-0",
                                          isCompleted 
                                            ? "bg-turquoise border-turquoise text-white shadow-lg shadow-turquoise/25 scale-105" 
                                            : "border-gray-600 hover:border-turquoise/60 hover:bg-turquoise/10 hover:scale-105",
                                          !canInteract && "cursor-not-allowed",
                                          isPending && "animate-pulse border-turquoise/70"
                                        )}
                                        onClick={() => canInteract && !isPending && toggleTask(task.id, dayDate)}
                                      >
                                        {isCompleted && <CheckIcon className="h-4 w-4 transition-all duration-200" />}
                                      </button>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1">
                                            <h5 className={cn(
                                              "text-base font-medium leading-relaxed mb-1",
                                              isCompleted ? "text-turquoise-light line-through" : "text-white"
                                            )}>
                                              {task.title}
                                            </h5>
                                            {task.description && (
                                              <p className={cn(
                                                "text-sm leading-relaxed",
                                                isCompleted ? "text-turquoise/70" : "text-gray-300"
                                              )}>
                                                {task.description}
                                              </p>
                                            )}
                                          </div>
                                          
                                          {task.hasMoreInfo && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-turquoise hover:text-turquoise-light hover:bg-turquoise/10 h-9 w-9 p-0 rounded-xl transition-all flex-shrink-0 hover:scale-105"
                                              onClick={() => {
                                                setSelectedTask(task);
                                                setShowTaskInfoModal(true);
                                              }}
                                            >
                                              <InformationCircleIcon className="h-5 w-5" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}

            {/* Products Section */}
            {products.length > 0 && (
              <div className="bg-white/[0.02] border border-gray-800/60 rounded-2xl p-6 lg:p-8 backdrop-blur-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Produtos Recomendados
                  </h3>
                  <p className="text-sm text-turquoise font-medium">
                    Selecionados especialmente para seu protocolo
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {products
                    .sort((a, b) => a.order - b.order)
                    .map((protocolProduct) => (
                      <div key={protocolProduct.id} className="group flex items-center gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700/40 hover:border-turquoise/30 hover:bg-gray-800/40 transition-all duration-300">
                        <div className="w-14 h-14 bg-gray-700/50 rounded-xl flex-shrink-0 overflow-hidden">
                          {protocolProduct.product.imageUrl ? (
                            <img 
                              src={protocolProduct.product.imageUrl} 
                              alt={protocolProduct.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-base mb-1">
                            {protocolProduct.product.name}
                          </h4>
                          {protocolProduct.product.brand && (
                            <p className="text-sm text-gray-400 mb-2">
                              {protocolProduct.product.brand}
                            </p>
                          )}
                          {protocolProduct.isRequired && (
                            <div className="inline-flex items-center px-3 py-1 bg-turquoise/15 border border-turquoise/30 rounded-lg">
                              <span className="text-xs font-semibold text-turquoise uppercase tracking-wider">
                                Obrigatório
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {protocolProduct.product.purchaseUrl && (
                          <Button 
                            size="sm" 
                            className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold px-6 py-2.5 text-sm rounded-xl shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200"
                            asChild
                          >
                            <a 
                              href={protocolProduct.product.purchaseUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              Adquirir
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
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
    </div>
  );
} 