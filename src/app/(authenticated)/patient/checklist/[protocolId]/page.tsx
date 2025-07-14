/* eslint-disable */
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { 
  CheckIcon, 
  ArrowLeftIcon, 
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import Image from 'next/image';
import { TaskInfoModal } from "@/components/ui/task-info-modal";
import DailyCheckinModal from "@/components/checkin/daily-checkin-modal";
import SymptomReportModal from '@/components/symptom-report/symptom-report-modal';

// Translations for internationalization
const translations = {
  pt: {
    backToProtocols: 'Voltar aos Protocolos',
    today: 'Hoje',
    day: 'Dia',
    recommendedProducts: 'Produtos Recomendados',
    selectedForProtocol: 'Selecionados especialmente para seu protocolo',
    required: 'Obrigatório',
    acquire: 'Adquirir',
    errorUpdatingTask: 'Erro ao atualizar tarefa. Tente novamente.',
    loadingProtocol: 'Carregando protocolo...',
    protocolNotFound: 'Protocolo não encontrado',
    errorLoadingProtocol: 'Erro ao carregar protocolo'
  },
  en: {
    backToProtocols: 'Back to Protocols',
    today: 'Today',
    day: 'Day',
    recommendedProducts: 'Recommended Products',
    selectedForProtocol: 'Specially selected for your protocol',
    required: 'Required',
    acquire: 'Purchase',
    errorUpdatingTask: 'Error updating task. Please try again.',
    loadingProtocol: 'Loading protocol...',
    protocolNotFound: 'Protocol not found',
    errorLoadingProtocol: 'Error loading protocol'
  }
};

interface ProtocolProgress {
  id: string;
  date: string;
  isCompleted: boolean;
  notes?: string;
  _optimistic?: boolean;
  protocolTask: {
    id: string;
    title: string;
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
    coverImage?: string;
    days: Array<{
      id: string;
      dayNumber: number;
      title?: string;
      sessions: Array<{
        id: string;
        name: string;
        order: number;
        tasks: Array<{
          id: string;
          title: string;
          order: number;
          hasMoreInfo?: boolean;
          videoUrl?: string;
          fullExplanation?: string;
          productId?: string;
          modalTitle?: string;
          modalButtonText?: string;
          modalButtonUrl?: string;
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
  const [language, setLanguage] = useState<'pt' | 'en'>('en');
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [hasCheckinToday, setHasCheckinToday] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [selectedDayForSymptoms, setSelectedDayForSymptoms] = useState<number | null>(null);
  
  // New state for day navigation
  const [currentViewDay, setCurrentViewDay] = useState<number | null>(null);

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
    const detectedLang = browserLanguage.toLowerCase().startsWith('pt') ? 'pt' : 'en';
    setLanguage('en'); // Force English
  }, []);

  const t = translations[language];
  const dateLocale = language === 'en' ? enUS : ptBR;

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
        
        // Verificar se já fez check-in hoje
        await checkTodayCheckin(targetProtocol.protocolId);
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

  // Verificar se já fez check-in hoje
  const checkTodayCheckin = useCallback(async (protocolId: string) => {
    try {
      // Use UTC date to avoid timezone issues
      const today = new Date();
      const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const todayString = todayUTC.toISOString().split('T')[0];
      
      const response = await fetch(`/api/protocols/${protocolId}/checkin-responses?date=${todayString}`);
      
      if (response.ok) {
        const data = await response.json();
        setHasCheckinToday(data.responses && data.responses.length > 0);
      }
    } catch (error) {
      console.error('Erro ao verificar check-in:', error);
    }
  }, []);

  const handleCheckinSuccess = useCallback(() => {
    setHasCheckinToday(true);
    // Recarregar dados se necessário
  }, []);

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
        
        alert(t.errorUpdatingTask);
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
  }, [progressMap, session?.user?.id, debounceMap, t.errorUpdatingTask]);

  const getDateForProtocolDay = useCallback((dayNumber: number): string => {
    if (!activeProtocol) return '';
    
    // Parse the ISO date string directly to avoid timezone issues
    const startDateISO = new Date(activeProtocol.startDate).toISOString();
    const [year, month, day] = startDateISO.split('T')[0].split('-').map(Number);
    
    // Calculate target date directly
    const targetYear = year;
    const targetMonth = month;
    const targetDay = day + (dayNumber - 1);
    
    // Handle month overflow
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    let finalDay = targetDay;
    let finalMonth = targetMonth;
    let finalYear = targetYear;
    
    if (finalDay > daysInMonth) {
      finalDay = finalDay - daysInMonth;
      finalMonth++;
      if (finalMonth > 12) {
        finalMonth = 1;
        finalYear++;
      }
    }
    
    // Format as yyyy-MM-dd
    return `${finalYear}-${finalMonth.toString().padStart(2, '0')}-${finalDay.toString().padStart(2, '0')}`;
  }, [activeProtocol]);

  const isTaskCompleted = useCallback((taskId: string, date: string) => {
    const key = `${taskId}-${date}`;
    return progressMap.get(key)?.isCompleted || false;
  }, [progressMap]);

  // Get current day calculation
  const getCurrentDay = useCallback(() => {
    if (!activeProtocol) return 1;
    
    // Parse the ISO date string directly to avoid timezone issues
    const startDateISO = new Date(activeProtocol.startDate).toISOString();
    const [year, month, day] = startDateISO.split('T')[0].split('-').map(Number);
    
    // Create UTC dates for comparison
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const startDateUTC = new Date(Date.UTC(year, month - 1, day));
    
    const diffTime = todayUTC.getTime() - startDateUTC.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(1, Math.min(diffDays, activeProtocol.protocol.duration));
  }, [activeProtocol]);

  const currentDay = getCurrentDay();

  // Helper function to calculate completed days
  const getCompletedDaysCount = useMemo(() => {
    if (!activeProtocol) return 0;
    
    let completedDays = 0;
    for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
      const day = activeProtocol.protocol.days.find(d => d.dayNumber === dayNum);
      if (day) {
        let totalTasks = 0;
        let completedTasks = 0;
        
        day.sessions.forEach(session => {
          session.tasks.forEach(task => {
            totalTasks++;
            const taskDate = getDateForProtocolDay(dayNum);
            if (isTaskCompleted(task.id, taskDate)) {
              completedTasks++;
            }
          });
        });
        
        if (totalTasks > 0 && completedTasks === totalTasks) {
          completedDays++;
        }
      }
    }
    
    return completedDays;
  }, [activeProtocol, progressMap, getDateForProtocolDay, isTaskCompleted]);

  // Helper function to check if a specific day is completed
  const isDayCompleted = useCallback((dayNum: number) => {
    if (!activeProtocol) return false;
    
    const day = activeProtocol.protocol.days.find(d => d.dayNumber === dayNum);
    if (!day) return false;
    
    let totalTasks = 0;
    let completedTasks = 0;
    
    day.sessions.forEach(session => {
      session.tasks.forEach(task => {
        totalTasks++;
        const taskDate = getDateForProtocolDay(dayNum);
        if (isTaskCompleted(task.id, taskDate)) {
          completedTasks++;
        }
      });
    });
    
    return totalTasks > 0 && completedTasks === totalTasks;
  }, [activeProtocol, progressMap, getDateForProtocolDay, isTaskCompleted]);

  // Check if entire protocol (all days) is completed - moved here to maintain hook order
  const isEntireProtocolCompleted = useMemo(() => {
    if (!activeProtocol) return false;
    return getCompletedDaysCount === activeProtocol.protocol.duration;
  }, [activeProtocol, getCompletedDaysCount]);

  // Initialize currentViewDay when activeProtocol loads
  useEffect(() => {
    if (activeProtocol && currentViewDay === null) {
      const currentDay = getCurrentDay();
      setCurrentViewDay(currentDay);
    }
  }, [activeProtocol, currentViewDay, getCurrentDay]);

  // Navigation functions
  const goToPreviousDay = useCallback(() => {
    if (!activeProtocol || !currentViewDay) return;
    const newDay = Math.max(1, currentViewDay - 1);
    setCurrentViewDay(newDay);
  }, [activeProtocol, currentViewDay]);

  const goToNextDay = useCallback(() => {
    if (!activeProtocol || !currentViewDay) return;
    const newDay = Math.min(activeProtocol.protocol.duration, currentViewDay + 1);
    setCurrentViewDay(newDay);
  }, [activeProtocol, currentViewDay]);

  const goToCurrentDay = useCallback(() => {
    const currentDay = getCurrentDay();
    setCurrentViewDay(currentDay);
  }, [getCurrentDay]);

  // Get the day to display
  const dayToDisplay = useMemo(() => {
    if (!activeProtocol || currentViewDay === null) return null;
    return activeProtocol.protocol.days.find(day => day.dayNumber === currentViewDay);
  }, [activeProtocol, currentViewDay]);

  const getDayStatus = useCallback((dayNumber: number) => {
    if (!activeProtocol) return 'future';
    
    // Parse the ISO date string directly to avoid timezone issues
    const startDateISO = new Date(activeProtocol.startDate).toISOString();
    const [year, month, day] = startDateISO.split('T')[0].split('-').map(Number);
    
    // Create UTC dates for comparison
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const startDateUTC = new Date(Date.UTC(year, month - 1, day));
    const dayDateUTC = new Date(startDateUTC.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000);
    
    if (dayDateUTC < todayUTC) return 'past';
    if (dayDateUTC.getTime() === todayUTC.getTime()) return 'current';
    return 'future';
  }, [activeProtocol]);

  const handleReportSymptoms = (dayNumber: number) => {
    setSelectedDayForSymptoms(dayNumber);
    setShowSymptomModal(true);
  };

  const handleSymptomReportSuccess = () => {
    // Optionally refresh data or show success message
    console.log('Symptom report submitted successfully');
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <style jsx global>{`
          body {
            background-color: #101010;
          }
        `}</style>
        <div className="min-h-screen text-white pb-20">
          {/* Container for max-width and centering */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Content */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise mx-auto mb-4" />
                    <p className="text-gray-400">{t.loadingProtocol}</p>
                  </div>
                </div>
              ) : !activeProtocol ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <p className="text-gray-400">{t.protocolNotFound}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-20 pb-32 lg:pb-12">
                    <div className="space-y-6">
                      {/* Protocol Header */}
                      <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm overflow-hidden">
                        {/* Cover Image and Back Button Container */}
                        <div className="relative">
                          {/* Back Button - Absolute positioned over the image */}
                          <div className="absolute top-6 left-6 z-10">
                            <Link href="/patient/protocols">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 backdrop-blur-sm"
                              >
                                <ArrowLeftIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>

                          {/* Cover Image */}
                          {activeProtocol.protocol.coverImage && (
                            <div className="relative w-full h-40 lg:h-48 overflow-hidden">
                              <Image
                                src={activeProtocol.protocol.coverImage}
                                alt={activeProtocol.protocol.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          {/* Protocol Title */}
                          <h1 className="text-lg lg:text-xl font-bold text-white mb-3">
                            {activeProtocol.protocol.name}
                          </h1>
                          
                          {/* Protocol Description */}
                          {activeProtocol.protocol.description && (
                            <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                              {activeProtocol.protocol.description}
                            </p>
                          )}
                        </div>
                      </div>

                        {/* Daily Check-in Button */}
                        <div className={cn(
                          "border rounded-xl p-4 backdrop-blur-sm transition-all duration-200",
                          hasCheckinToday 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-white/[0.02] border-gray-800/60"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                                  Daily Check-in
                                </h3>
                                <p className="text-xs lg:text-sm text-gray-400">
                                  {hasCheckinToday ? 'Click to edit your responses' : 'How are you feeling today?'}
                                </p>
                              </div>
                            </div>
                            
                            {hasCheckinToday ? (
                              <button
                                onClick={() => setShowCheckinModal(true)}
                                className="px-3 py-2 bg-green-500/20 border border-green-500/40 rounded-lg hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 hover:scale-105"
                              >
                                <span className="text-xs lg:text-sm font-semibold text-green-400 uppercase tracking-wider">
                                  ✓ Completed
                                </span>
                              </button>
                            ) : (
                              <Button
                                onClick={() => setShowCheckinModal(true)}
                                className="bg-turquoise hover:bg-turquoise/90 text-black px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105"
                              >
                                Make Check-in
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Symptom Report Button */}
                        <Button
                          onClick={() => handleReportSymptoms(currentViewDay || 1)}
                          className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 hover:border-red-500/60 px-4 py-2 rounded-lg font-semibold transition-all"
                        >
                          Report Symptoms
                        </Button>

                        {/* Congratulations Banner - Only show when entire protocol is completed */}
                        {isEntireProtocolCompleted && (
                          <div className="relative bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border-2 border-green-400/50 rounded-xl p-6 backdrop-blur-sm overflow-hidden animate-pulse">
                            {/* Sparkle Effects */}
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute top-4 left-4 text-yellow-400 animate-bounce">
                                <SparklesIcon className="h-6 w-6" />
                              </div>
                              <div className="absolute top-6 right-8 text-yellow-300 animate-bounce delay-300">
                                <SparklesIcon className="h-4 w-4" />
                              </div>
                              <div className="absolute bottom-6 left-12 text-yellow-400 animate-bounce delay-700">
                                <SparklesIcon className="h-5 w-5" />
                              </div>
                              <div className="absolute bottom-4 right-4 text-yellow-300 animate-bounce delay-500">
                                <SparklesIcon className="h-6 w-6" />
                              </div>
                            </div>
                            
                            <div className="relative z-10 text-center">
                              <div className="flex justify-center mb-4">
                                <div className="bg-green-400/20 p-4 rounded-full border-2 border-green-400/40 animate-pulse">
                                  <TrophyIcon className="h-12 w-12 lg:h-14 lg:w-14 text-green-400" />
                                </div>
                              </div>
                              
                              <h2 className="text-2xl font-bold text-green-400 mb-2 animate-bounce">
                                🎉 Congratulations! 🎉
                              </h2>
                              
                              <p className="text-lg text-green-300 font-semibold mb-2">
                                Protocol Completed Successfully!
                              </p>
                              
                              <p className="text-sm text-green-200/80 mb-4">
                                You have completed all {activeProtocol.protocol.duration} days of the protocol{' '}
                                <span className="font-semibold text-green-300">{activeProtocol.protocol.name}</span>.
                                Excellent work! 🌟
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                <div className="px-4 py-2 bg-green-400/15 border border-green-400/30 rounded-lg">
                                  <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                                    ✓ 100% Complete
                                  </span>
                                </div>
                                
                                <Link href="/patient/protocols">
                                  <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105">
                                    View Other Protocols
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Day Navigation */}
                      <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                        {/* Progress Bar */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">Protocol Progress</span>
                            <span className={cn(
                              "text-sm font-medium",
                              isEntireProtocolCompleted ? "text-green-400" : "text-turquoise"
                            )}>
                              {isEntireProtocolCompleted ? "✓ Completed!" : `${currentDay}/${activeProtocol.protocol.duration} days`}
                            </span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div className="relative">
                            {/* Background Bar */}
                            <div className="w-full h-2 bg-gray-800/60 rounded-full overflow-hidden">
                              {/* Progress Fill */}
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500 ease-out",
                                  isEntireProtocolCompleted 
                                    ? "bg-gradient-to-r from-green-400 to-emerald-400" 
                                    : "bg-gradient-to-r from-turquoise to-turquoise-light"
                                )}
                                style={{ 
                                  width: `${(getCompletedDaysCount / activeProtocol.protocol.duration) * 100}%` 
                                }}
                              />
                            </div>
                            
                            {/* Day Markers */}
                            <div className="absolute -top-1 left-0 w-full">
                              {Array.from({ length: activeProtocol.protocol.duration }, (_, index) => {
                                const dayNum = index + 1;
                                const dayStatus = getDayStatus(dayNum);
                                const isCurrentView = dayNum === currentViewDay;
                                const progressPercentage = activeProtocol.protocol.duration === 1 
                                  ? 50 
                                  : (dayNum - 1) / (activeProtocol.protocol.duration - 1) * 100;
                                
                                // Use the helper function instead of useMemo inside the loop
                                const dayCompleted = isDayCompleted(dayNum);
                                
                                return (
                                  <button
                                    key={dayNum}
                                    onClick={() => setCurrentViewDay(dayNum)}
                                    className={cn(
                                      "absolute w-4 h-4 rounded-full border-2 transition-all duration-300 hover:scale-110 group",
                                      // Completed days (green)
                                      dayCompleted && "bg-green-400 border-green-400 shadow-lg shadow-green-400/30",
                                      // Current day (turquoise if not completed, green if completed)
                                      dayStatus === 'current' && !dayCompleted && "bg-turquoise border-turquoise shadow-lg shadow-turquoise/40 ring-2 ring-turquoise/30 ring-offset-2 ring-offset-gray-900",
                                      dayStatus === 'current' && dayCompleted && "bg-green-400 border-green-400 shadow-lg shadow-green-400/40 ring-2 ring-green-400/30 ring-offset-2 ring-offset-gray-900",
                                      // Past days (turquoise if not completed, green if completed)
                                      dayStatus === 'past' && !dayCompleted && "bg-turquoise border-turquoise shadow-lg shadow-turquoise/30",
                                      // Future days (gray)
                                      dayStatus === 'future' && "bg-gray-700 border-gray-600 hover:border-gray-500",
                                      isCurrentView && "scale-125 z-10"
                                    )}
                                    style={{
                                      left: `${progressPercentage}%`,
                                      transform: 'translateX(-50%)'
                                    }}
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                                      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        Day {dayNum}
                                        {dayStatus === 'current' && ' (Today)'}
                                        {dayCompleted && ' ✓'}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Progress Stats */}
                          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                            {isEntireProtocolCompleted ? (
                              <span className="text-green-400 font-medium">
                                🎉 All days completed!
                              </span>
                            ) : (
                              <>
                                <span>
                                  {(() => {
                                    let completedDays = 0;
                                    for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
                                      if (isDayCompleted(dayNum)) {
                                        completedDays++;
                                      }
                                    }
                                    return completedDays;
                                  })()} days completed
                                </span>
                                <span>
                                  {(() => {
                                    let completedDays = 0;
                                    for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
                                      if (isDayCompleted(dayNum)) {
                                        completedDays++;
                                      }
                                    }
                                    return activeProtocol.protocol.duration - completedDays;
                                  })()} days remaining
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={goToPreviousDay}
                              disabled={!currentViewDay || currentViewDay <= 1}
                              className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronLeftIcon className="h-5 w-5" />
                            </Button>
                            
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-white">
                                {dayToDisplay?.title || `${t.day} ${currentViewDay}`}
                              </h3>
                              <p className="text-xs lg:text-sm text-gray-400">
                                {currentViewDay && (() => {
                                  const dayDate = getDateForProtocolDay(currentViewDay);
                                  const [year, month, day] = dayDate.split('-').map(Number);
                                  const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                                  return format(dateUTC, 'EEEE, dd/MM/yyyy', { locale: dateLocale });
                                })()}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={goToNextDay}
                              disabled={!currentViewDay || !activeProtocol || currentViewDay >= activeProtocol.protocol.duration}
                              className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronRightIcon className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {currentViewDay !== currentDay && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={goToCurrentDay}
                                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:border-turquoise/50 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-medium"
                              >
                                Go to {t.today}
                              </Button>
                            )}
                            
                            {currentViewDay === currentDay && (
                              <div className="px-2 py-1 bg-turquoise/15 border border-turquoise/30 rounded-lg">
                                <span className="text-xs lg:text-sm font-semibold text-turquoise uppercase tracking-wider">
                                  {t.today}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Current Day Display */}
                      {dayToDisplay && (
                        <div className={cn(
                          "bg-white/[0.02] border rounded-xl backdrop-blur-sm transition-all duration-300",
                          currentViewDay === currentDay 
                            ? "border-turquoise/40 shadow-lg shadow-turquoise/10" 
                            : "border-gray-800/60"
                        )}>
                          {/* Tasks Section */}
                          <div className="p-4 lg:p-6">
                            {dayToDisplay.sessions
                              .sort((a, b) => a.order - b.order)
                              .map((session, sessionIndex) => {
                                const dayDate = getDateForProtocolDay(currentViewDay!);
                                const dayStatus = getDayStatus(currentViewDay!);
                                
                                return (
                                  <div key={session.id} className={cn("space-y-3", sessionIndex > 0 && "mt-6")}>
                                    {/* Session Header */}
                                    {session.name && (
                                      <div className="mb-4">
                                        <h4 className="text-sm lg:text-base font-semibold text-turquoise mb-1">
                                          {session.name}
                                        </h4>
                                      </div>
                                    )}

                                    {/* Tasks Grid */}
                                    <div className="space-y-2">
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
                                                "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:border-gray-600/60 hover:bg-white/[0.01]",
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
                                                  "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 mt-0.5 flex-shrink-0",
                                                  isCompleted 
                                                    ? "bg-green-400 border-green-400 text-white shadow-lg shadow-green-400/25 scale-105" 
                                                    : "border-gray-600 hover:border-green-400/60 hover:bg-green-400/10 hover:scale-105",
                                                  !canInteract && "cursor-not-allowed",
                                                  isPending && "border-green-400/70"
                                                )}
                                                onClick={() => canInteract && !isPending && toggleTask(task.id, dayDate)}
                                              >
                                                {isCompleted && <CheckIcon className="h-3 w-3 transition-all duration-200" />}
                                              </button>
                                              
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="flex-1">
                                                    <h5 className={cn(
                                                      "text-sm lg:text-base font-medium leading-relaxed mb-0.5",
                                                      isCompleted ? "text-turquoise-light line-through" : "text-white"
                                                    )}>
                                                      {task.title}
                                                    </h5>
                                                  </div>
                                                  
                                                  {task.hasMoreInfo && (
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-turquoise hover:text-turquoise-light hover:bg-turquoise/10 h-7 w-7 p-0 rounded-lg transition-all flex-shrink-0 hover:scale-105"
                                                      onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowTaskInfoModal(true);
                                                      }}
                                                    >
                                                      <InformationCircleIcon className="h-4 w-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>

                                    {/* Symptom Report Button */}
                                    <div className="mt-6 pt-4 border-t border-gray-800/60">
                                      <Button
                                        onClick={() => handleReportSymptoms(currentViewDay || 1)}
                                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 hover:border-red-500/60"
                                      >
                                        Report Symptoms
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Products Section */}
                      {products.length > 0 && (
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                          <div className="mb-4">
                            <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                              {t.recommendedProducts}
                            </h3>
                            <p className="text-xs lg:text-sm text-turquoise font-medium">
                              {t.selectedForProtocol}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {products.map((protocolProduct) => (
                              <div 
                                key={protocolProduct.id}
                                className="flex items-center gap-4 p-3 bg-gray-800/20 border border-gray-700/40 rounded-lg"
                              >
                                {/* Product Image */}
                                {protocolProduct.product.imageUrl && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={protocolProduct.product.imageUrl}
                                      alt={protocolProduct.product.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm lg:text-base font-medium text-white mb-1">
                                    {protocolProduct.product.name}
                                  </h4>
                                  {protocolProduct.product.brand && (
                                    <p className="text-xs text-gray-400">
                                      {protocolProduct.product.brand}
                                    </p>
                                  )}
                                  {protocolProduct.isRequired && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
                                        <span className="text-xs font-medium text-red-400">
                                          {t.required}
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Purchase Button */}
                                {protocolProduct.product.purchaseUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:border-turquoise/50"
                                    asChild
                                  >
                                    <Link href={protocolProduct.product.purchaseUrl} target="_blank">
                                      {t.acquire}
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Info Modal */}
                  {showTaskInfoModal && selectedTask && (
                    <TaskInfoModal
                      task={selectedTask}
                      isOpen={showTaskInfoModal}
                      onClose={() => {
                        setShowTaskInfoModal(false);
                        setSelectedTask(null);
                      }}
                    />
                  )}

                  {/* Daily Check-in Modal */}
                  {showCheckinModal && (
                    <DailyCheckinModal
                      protocolId={activeProtocol.protocolId}
                      isOpen={showCheckinModal}
                      onClose={() => setShowCheckinModal(false)}
                      onSuccess={() => {
                        setShowCheckinModal(false);
                        setHasCheckinToday(true);
                      }}
                    />
                  )}

                  {/* Symptom Report Modal */}
                  {showSymptomModal && selectedDayForSymptoms !== null && (
                    <SymptomReportModal
                      protocolId={activeProtocol.protocolId}
                      dayNumber={selectedDayForSymptoms}
                      isOpen={showSymptomModal}
                      onClose={() => {
                        setShowSymptomModal(false);
                        setSelectedDayForSymptoms(null);
                      }}
                      onSuccess={handleSymptomReportSuccess}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!activeProtocol) {
    return (
      <>
        <style jsx global>{`
          body {
            background-color: #101010;
          }
        `}</style>
        <div className="min-h-screen text-white pb-20">
          {/* Container for max-width and centering */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Content */}
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise mx-auto mb-4" />
                    <p className="text-gray-400">{t.loadingProtocol}</p>
                  </div>
                </div>
              ) : !activeProtocol ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center">
                    <p className="text-gray-400">{t.protocolNotFound}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-20 pb-32 lg:pb-12">
                    <div className="space-y-6">
                      {/* Protocol Header */}
                      <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm overflow-hidden">
                        {/* Cover Image and Back Button Container */}
                        <div className="relative">
                          {/* Back Button - Absolute positioned over the image */}
                          <div className="absolute top-6 left-6 z-10">
                            <Link href="/patient/protocols">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 backdrop-blur-sm"
                              >
                                <ArrowLeftIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>

                          {/* Cover Image */}
                          {activeProtocol.protocol.coverImage && (
                            <div className="relative w-full h-40 lg:h-48 overflow-hidden">
                              <Image
                                src={activeProtocol.protocol.coverImage}
                                alt={activeProtocol.protocol.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          {/* Protocol Title */}
                          <h1 className="text-lg lg:text-xl font-bold text-white mb-3">
                            {activeProtocol.protocol.name}
                          </h1>
                          
                          {/* Protocol Description */}
                          {activeProtocol.protocol.description && (
                            <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                              {activeProtocol.protocol.description}
                            </p>
                          )}
                        </div>
                      </div>

                        {/* Daily Check-in Button */}
                        <div className={cn(
                          "border rounded-xl p-4 backdrop-blur-sm transition-all duration-200",
                          hasCheckinToday 
                            ? "bg-green-500/10 border-green-500/30" 
                            : "bg-white/[0.02] border-gray-800/60"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                                  Daily Check-in
                                </h3>
                                <p className="text-xs lg:text-sm text-gray-400">
                                  {hasCheckinToday ? 'Click to edit your responses' : 'How are you feeling today?'}
                                </p>
                              </div>
                            </div>
                            
                            {hasCheckinToday ? (
                              <button
                                onClick={() => setShowCheckinModal(true)}
                                className="px-3 py-2 bg-green-500/20 border border-green-500/40 rounded-lg hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 hover:scale-105"
                              >
                                <span className="text-xs lg:text-sm font-semibold text-green-400 uppercase tracking-wider">
                                  ✓ Completed
                                </span>
                              </button>
                            ) : (
                              <Button
                                onClick={() => setShowCheckinModal(true)}
                                className="bg-turquoise hover:bg-turquoise/90 text-black px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105"
                              >
                                Make Check-in
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Symptom Report Button */}
                        <Button
                          onClick={() => handleReportSymptoms(currentViewDay || 1)}
                          className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 hover:border-red-500/60 px-4 py-2 rounded-lg font-semibold transition-all"
                        >
                          Report Symptoms
                        </Button>

                        {/* Congratulations Banner - Only show when entire protocol is completed */}
                        {isEntireProtocolCompleted && (
                          <div className="relative bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border-2 border-green-400/50 rounded-xl p-6 backdrop-blur-sm overflow-hidden animate-pulse">
                            {/* Sparkle Effects */}
                            <div className="absolute inset-0 overflow-hidden">
                              <div className="absolute top-4 left-4 text-yellow-400 animate-bounce">
                                <SparklesIcon className="h-6 w-6" />
                              </div>
                              <div className="absolute top-6 right-8 text-yellow-300 animate-bounce delay-300">
                                <SparklesIcon className="h-4 w-4" />
                              </div>
                              <div className="absolute bottom-6 left-12 text-yellow-400 animate-bounce delay-700">
                                <SparklesIcon className="h-5 w-5" />
                              </div>
                              <div className="absolute bottom-4 right-4 text-yellow-300 animate-bounce delay-500">
                                <SparklesIcon className="h-6 w-6" />
                              </div>
                            </div>
                            
                            <div className="relative z-10 text-center">
                              <div className="flex justify-center mb-4">
                                <div className="bg-green-400/20 p-4 rounded-full border-2 border-green-400/40 animate-pulse">
                                  <TrophyIcon className="h-12 w-12 lg:h-14 lg:w-14 text-green-400" />
                                </div>
                              </div>
                              
                              <h2 className="text-2xl font-bold text-green-400 mb-2 animate-bounce">
                                🎉 Congratulations! 🎉
                              </h2>
                              
                              <p className="text-lg text-green-300 font-semibold mb-2">
                                Protocol Completed Successfully!
                              </p>
                              
                              <p className="text-sm text-green-200/80 mb-4">
                                You have completed all {activeProtocol.protocol.duration} days of the protocol{' '}
                                <span className="font-semibold text-green-300">{activeProtocol.protocol.name}</span>.
                                Excellent work! 🌟
                              </p>
                              
                              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                <div className="px-4 py-2 bg-green-400/15 border border-green-400/30 rounded-lg">
                                  <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                                    ✓ 100% Complete
                                  </span>
                                </div>
                                
                                <Link href="/patient/protocols">
                                  <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105">
                                    View Other Protocols
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Day Navigation */}
                      <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                        {/* Progress Bar */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">Protocol Progress</span>
                            <span className={cn(
                              "text-sm font-medium",
                              isEntireProtocolCompleted ? "text-green-400" : "text-turquoise"
                            )}>
                              {isEntireProtocolCompleted ? "✓ Completed!" : `${currentDay}/${activeProtocol.protocol.duration} days`}
                            </span>
                          </div>
                          
                          {/* Progress Bar Container */}
                          <div className="relative">
                            {/* Background Bar */}
                            <div className="w-full h-2 bg-gray-800/60 rounded-full overflow-hidden">
                              {/* Progress Fill */}
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500 ease-out",
                                  isEntireProtocolCompleted 
                                    ? "bg-gradient-to-r from-green-400 to-emerald-400" 
                                    : "bg-gradient-to-r from-turquoise to-turquoise-light"
                                )}
                                style={{ 
                                  width: `${(getCompletedDaysCount / activeProtocol.protocol.duration) * 100}%` 
                                }}
                              />
                            </div>
                            
                            {/* Day Markers */}
                            <div className="absolute -top-1 left-0 w-full">
                              {Array.from({ length: activeProtocol.protocol.duration }, (_, index) => {
                                const dayNum = index + 1;
                                const dayStatus = getDayStatus(dayNum);
                                const isCurrentView = dayNum === currentViewDay;
                                const progressPercentage = activeProtocol.protocol.duration === 1 
                                  ? 50 
                                  : (dayNum - 1) / (activeProtocol.protocol.duration - 1) * 100;
                                
                                // Use the helper function instead of useMemo inside the loop
                                const dayCompleted = isDayCompleted(dayNum);
                                
                                return (
                                  <button
                                    key={dayNum}
                                    onClick={() => setCurrentViewDay(dayNum)}
                                    className={cn(
                                      "absolute w-4 h-4 rounded-full border-2 transition-all duration-300 hover:scale-110 group",
                                      // Completed days (green)
                                      dayCompleted && "bg-green-400 border-green-400 shadow-lg shadow-green-400/30",
                                      // Current day (turquoise if not completed, green if completed)
                                      dayStatus === 'current' && !dayCompleted && "bg-turquoise border-turquoise shadow-lg shadow-turquoise/40 ring-2 ring-turquoise/30 ring-offset-2 ring-offset-gray-900",
                                      dayStatus === 'current' && dayCompleted && "bg-green-400 border-green-400 shadow-lg shadow-green-400/40 ring-2 ring-green-400/30 ring-offset-2 ring-offset-gray-900",
                                      // Past days (turquoise if not completed, green if completed)
                                      dayStatus === 'past' && !dayCompleted && "bg-turquoise border-turquoise shadow-lg shadow-turquoise/30",
                                      // Future days (gray)
                                      dayStatus === 'future' && "bg-gray-700 border-gray-600 hover:border-gray-500",
                                      isCurrentView && "scale-125 z-10"
                                    )}
                                    style={{
                                      left: `${progressPercentage}%`,
                                      transform: 'translateX(-50%)'
                                    }}
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                                      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                        Day {dayNum}
                                        {dayStatus === 'current' && ' (Today)'}
                                        {dayCompleted && ' ✓'}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Progress Stats */}
                          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                            {isEntireProtocolCompleted ? (
                              <span className="text-green-400 font-medium">
                                🎉 All days completed!
                              </span>
                            ) : (
                              <>
                                <span>
                                  {(() => {
                                    let completedDays = 0;
                                    for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
                                      if (isDayCompleted(dayNum)) {
                                        completedDays++;
                                      }
                                    }
                                    return completedDays;
                                  })()} days completed
                                </span>
                                <span>
                                  {(() => {
                                    let completedDays = 0;
                                    for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
                                      if (isDayCompleted(dayNum)) {
                                        completedDays++;
                                      }
                                    }
                                    return activeProtocol.protocol.duration - completedDays;
                                  })()} days remaining
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={goToPreviousDay}
                              disabled={!currentViewDay || currentViewDay <= 1}
                              className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronLeftIcon className="h-5 w-5" />
                            </Button>
                            
                            <div className="text-center">
                              <h3 className="text-lg font-semibold text-white">
                                {dayToDisplay?.title || `${t.day} ${currentViewDay}`}
                              </h3>
                              <p className="text-xs lg:text-sm text-gray-400">
                                {currentViewDay && (() => {
                                  const dayDate = getDateForProtocolDay(currentViewDay);
                                  const [year, month, day] = dayDate.split('-').map(Number);
                                  const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                                  return format(dateUTC, 'EEEE, dd/MM/yyyy', { locale: dateLocale });
                                })()}
                              </p>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={goToNextDay}
                              disabled={!currentViewDay || !activeProtocol || currentViewDay >= activeProtocol.protocol.duration}
                              className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronRightIcon className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {currentViewDay !== currentDay && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={goToCurrentDay}
                                className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:border-turquoise/50 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-medium"
                              >
                                Go to {t.today}
                              </Button>
                            )}
                            
                            {currentViewDay === currentDay && (
                              <div className="px-2 py-1 bg-turquoise/15 border border-turquoise/30 rounded-lg">
                                <span className="text-xs lg:text-sm font-semibold text-turquoise uppercase tracking-wider">
                                  {t.today}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Current Day Display */}
                      {dayToDisplay && (
                        <div className={cn(
                          "bg-white/[0.02] border rounded-xl backdrop-blur-sm transition-all duration-300",
                          currentViewDay === currentDay 
                            ? "border-turquoise/40 shadow-lg shadow-turquoise/10" 
                            : "border-gray-800/60"
                        )}>
                          {/* Tasks Section */}
                          <div className="p-4 lg:p-6">
                            {dayToDisplay.sessions
                              .sort((a, b) => a.order - b.order)
                              .map((session, sessionIndex) => {
                                const dayDate = getDateForProtocolDay(currentViewDay!);
                                const dayStatus = getDayStatus(currentViewDay!);
                                
                                return (
                                  <div key={session.id} className={cn("space-y-3", sessionIndex > 0 && "mt-6")}>
                                    {/* Session Header */}
                                    {session.name && (
                                      <div className="mb-4">
                                        <h4 className="text-sm lg:text-base font-semibold text-turquoise mb-1">
                                          {session.name}
                                        </h4>
                                      </div>
                                    )}

                                    {/* Tasks Grid */}
                                    <div className="space-y-2">
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
                                                "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:border-gray-600/60 hover:bg-white/[0.01]",
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
                                                  "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 mt-0.5 flex-shrink-0",
                                                  isCompleted 
                                                    ? "bg-green-400 border-green-400 text-white shadow-lg shadow-green-400/25 scale-105" 
                                                    : "border-gray-600 hover:border-green-400/60 hover:bg-green-400/10 hover:scale-105",
                                                  !canInteract && "cursor-not-allowed",
                                                  isPending && "border-green-400/70"
                                                )}
                                                onClick={() => canInteract && !isPending && toggleTask(task.id, dayDate)}
                                              >
                                                {isCompleted && <CheckIcon className="h-3 w-3 transition-all duration-200" />}
                                              </button>
                                              
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="flex-1">
                                                    <h5 className={cn(
                                                      "text-sm lg:text-base font-medium leading-relaxed mb-0.5",
                                                      isCompleted ? "text-turquoise-light line-through" : "text-white"
                                                    )}>
                                                      {task.title}
                                                    </h5>
                                                  </div>
                                                  
                                                  {task.hasMoreInfo && (
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="text-turquoise hover:text-turquoise-light hover:bg-turquoise/10 h-7 w-7 p-0 rounded-lg transition-all flex-shrink-0 hover:scale-105"
                                                      onClick={() => {
                                                        setSelectedTask(task);
                                                        setShowTaskInfoModal(true);
                                                      }}
                                                    >
                                                      <InformationCircleIcon className="h-4 w-4" />
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>

                                    {/* Symptom Report Button */}
                                    <div className="mt-6 pt-4 border-t border-gray-800/60">
                                      <Button
                                        onClick={() => handleReportSymptoms(currentViewDay || 1)}
                                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 hover:border-red-500/60"
                                      >
                                        Report Symptoms
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Products Section */}
                      {products.length > 0 && (
                        <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                          <div className="mb-4">
                            <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                              {t.recommendedProducts}
                            </h3>
                            <p className="text-xs lg:text-sm text-turquoise font-medium">
                              {t.selectedForProtocol}
                            </p>
                          </div>

                          <div className="space-y-3">
                            {products.map((protocolProduct) => (
                              <div 
                                key={protocolProduct.id}
                                className="flex items-center gap-4 p-3 bg-gray-800/20 border border-gray-700/40 rounded-lg"
                              >
                                {/* Product Image */}
                                {protocolProduct.product.imageUrl && (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={protocolProduct.product.imageUrl}
                                      alt={protocolProduct.product.name}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                )}
                                
                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm lg:text-base font-medium text-white mb-1">
                                    {protocolProduct.product.name}
                                  </h4>
                                  {protocolProduct.product.brand && (
                                    <p className="text-xs text-gray-400">
                                      {protocolProduct.product.brand}
                                    </p>
                                  )}
                                  {protocolProduct.isRequired && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
                                        <span className="text-xs font-medium text-red-400">
                                          {t.required}
                                        </span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Purchase Button */}
                                {protocolProduct.product.purchaseUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-shrink-0 border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:border-turquoise/50"
                                    asChild
                                  >
                                    <Link href={protocolProduct.product.purchaseUrl} target="_blank">
                                      {t.acquire}
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Task Info Modal */}
                  {showTaskInfoModal && selectedTask && (
                    <TaskInfoModal
                      task={selectedTask}
                      isOpen={showTaskInfoModal}
                      onClose={() => {
                        setShowTaskInfoModal(false);
                        setSelectedTask(null);
                      }}
                    />
                  )}

                  {/* Daily Check-in Modal */}
                  {showCheckinModal && (
                    <DailyCheckinModal
                      protocolId={activeProtocol.protocolId}
                      isOpen={showCheckinModal}
                      onClose={() => setShowCheckinModal(false)}
                      onSuccess={() => {
                        setShowCheckinModal(false);
                        setHasCheckinToday(true);
                      }}
                    />
                  )}

                  {/* Symptom Report Modal */}
                  {showSymptomModal && selectedDayForSymptoms !== null && (
                    <SymptomReportModal
                      protocolId={activeProtocol.protocolId}
                      dayNumber={selectedDayForSymptoms}
                      isOpen={showSymptomModal}
                      onClose={() => {
                        setShowSymptomModal(false);
                        setSelectedDayForSymptoms(null);
                      }}
                      onSuccess={handleSymptomReportSuccess}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>{`
        body {
          background-color: #101010;
        }
      `}</style>
      <div className="min-h-screen text-white pb-20">
        {/* Container for max-width and centering */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-turquoise mx-auto mb-4" />
                  <p className="text-gray-400">{t.loadingProtocol}</p>
                </div>
              </div>
            ) : !activeProtocol ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                  <p className="text-gray-400">{t.protocolNotFound}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-20 pb-32 lg:pb-12">
                  <div className="space-y-6">
                    {/* Protocol Header */}
                    <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm overflow-hidden">
                      {/* Cover Image and Back Button Container */}
                      <div className="relative">
                        {/* Back Button - Absolute positioned over the image */}
                        <div className="absolute top-6 left-6 z-10">
                          <Link href="/patient/protocols">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="bg-black/20 hover:bg-black/40 text-white rounded-full w-8 h-8 backdrop-blur-sm"
                            >
                              <ArrowLeftIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>

                        {/* Cover Image */}
                        {activeProtocol.protocol.coverImage && (
                          <div className="relative w-full h-40 lg:h-48 overflow-hidden">
                            <Image
                              src={activeProtocol.protocol.coverImage}
                              alt={activeProtocol.protocol.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        {/* Protocol Title */}
                        <h1 className="text-lg lg:text-xl font-bold text-white mb-3">
                          {activeProtocol.protocol.name}
                        </h1>
                        
                        {/* Protocol Description */}
                        {activeProtocol.protocol.description && (
                          <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                            {activeProtocol.protocol.description}
                          </p>
                        )}
                      </div>
                    </div>

                      {/* Daily Check-in Button */}
                      <div className={cn(
                        "border rounded-xl p-4 backdrop-blur-sm transition-all duration-200",
                        hasCheckinToday 
                          ? "bg-green-500/10 border-green-500/30" 
                          : "bg-white/[0.02] border-gray-800/60"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                                Daily Check-in
                              </h3>
                              <p className="text-xs lg:text-sm text-gray-400">
                                {hasCheckinToday ? 'Click to edit your responses' : 'How are you feeling today?'}
                              </p>
                            </div>
                          </div>
                          
                          {hasCheckinToday ? (
                            <button
                              onClick={() => setShowCheckinModal(true)}
                                className="px-3 py-2 bg-green-500/20 border border-green-500/40 rounded-lg hover:bg-green-500/30 hover:border-green-500/50 transition-all duration-200 hover:scale-105"
                              >
                                <span className="text-xs lg:text-sm font-semibold text-green-400 uppercase tracking-wider">
                                ✓ Completed
                                </span>
                              </button>
                            ) : (
                              <Button
                              onClick={() => setShowCheckinModal(true)}
                              className="bg-turquoise hover:bg-turquoise/90 text-black px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105"
                            >
                              Make Check-in
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Symptom Report Button */}
                      <Button
                        onClick={() => handleReportSymptoms(currentViewDay || 1)}
                        className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 hover:border-red-500/60 px-4 py-2 rounded-lg font-semibold transition-all"
                      >
                        Report Symptoms
                      </Button>

                      {/* Congratulations Banner - Only show when entire protocol is completed */}
                      {isEntireProtocolCompleted && (
                        <div className="relative bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 border-2 border-green-400/50 rounded-xl p-6 backdrop-blur-sm overflow-hidden animate-pulse">
                          {/* Sparkle Effects */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-4 left-4 text-yellow-400 animate-bounce">
                              <SparklesIcon className="h-6 w-6" />
                            </div>
                            <div className="absolute top-6 right-8 text-yellow-300 animate-bounce delay-300">
                              <SparklesIcon className="h-4 w-4" />
                            </div>
                            <div className="absolute bottom-6 left-12 text-yellow-400 animate-bounce delay-700">
                              <SparklesIcon className="h-5 w-5" />
                            </div>
                            <div className="absolute bottom-4 right-4 text-yellow-300 animate-bounce delay-500">
                              <SparklesIcon className="h-6 w-6" />
                            </div>
                          </div>
                          
                          <div className="relative z-10 text-center">
                            <div className="flex justify-center mb-4">
                              <div className="bg-green-400/20 p-4 rounded-full border-2 border-green-400/40 animate-pulse">
                                <TrophyIcon className="h-12 w-12 lg:h-14 lg:w-14 text-green-400" />
                              </div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-green-400 mb-2 animate-bounce">
                              🎉 Congratulations! 🎉
                            </h2>
                            
                            <p className="text-lg text-green-300 font-semibold mb-2">
                              Protocol Completed Successfully!
                            </p>
                            
                            <p className="text-sm text-green-200/80 mb-4">
                              You have completed all {activeProtocol.protocol.duration} days of the protocol{' '}
                              <span className="font-semibold text-green-300">{activeProtocol.protocol.name}</span>.
                              Excellent work! 🌟
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                              <div className="px-4 py-2 bg-green-400/15 border border-green-400/30 rounded-lg">
                                <span className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                                  ✓ 100% Complete
                                </span>
                              </div>
                              
                              <Link href="/patient/protocols">
                                <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105">
                                  View Other Protocols
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Day Navigation */}
                    <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-400">Protocol Progress</span>
                          <span className={cn(
                            "text-sm font-medium",
                            isEntireProtocolCompleted ? "text-green-400" : "text-turquoise"
                          )}>
                            {isEntireProtocolCompleted ? "✓ Completed!" : `${currentDay}/${activeProtocol.protocol.duration} days`}
                          </span>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div className="relative">
                          {/* Background Bar */}
                          <div className="w-full h-2 bg-gray-800/60 rounded-full overflow-hidden">
                            {/* Progress Fill */}
                            <div 
                              className={cn(
                                "h-full transition-all duration-500 ease-out",
                                isEntireProtocolCompleted 
                                  ? "bg-gradient-to-r from-green-400 to-emerald-400" 
                                  : "bg-gradient-to-r from-turquoise to-turquoise-light"
                              )}
                              style={{ 
                                width: `${(getCompletedDaysCount / activeProtocol.protocol.duration) * 100}%` 
                              }}
                            />
                          </div>
                          
                          {/* Day Markers */}
                          <div className="absolute -top-1 left-0 w-full">
                            {Array.from({ length: activeProtocol.protocol.duration }, (_, index) => {
                              const dayNum = index + 1;
                              const dayStatus = getDayStatus(dayNum);
                              const isCurrentView = dayNum === currentViewDay;
                              const progressPercentage = activeProtocol.protocol.duration === 1 
                                ? 50 
                                : (dayNum - 1) / (activeProtocol.protocol.duration - 1) * 100;
                              
                              // Use the helper function instead of useMemo inside the loop
                              const dayCompleted = isDayCompleted(dayNum);
                              
                              return (
                                <button
                                  key={dayNum}
                                  onClick={() => setCurrentViewDay(dayNum)}
                                  className={cn(
                                    "absolute w-4 h-4 rounded-full border-2 transition-all duration-300 hover:scale-110 group",
                                    // Completed days (green)
                                    dayCompleted && "bg-green-400 border-green-400 shadow-lg shadow-green-400/30",
                                    // Current day (turquoise if not completed, green if completed)
                                    dayStatus === 'current' && !dayCompleted && "bg-turquoise border-turquoise shadow-lg shadow-turquoise/40 ring-2 ring-turquoise/30 ring-offset-2 ring-offset-gray-900",
                                    dayStatus === 'current' && dayCompleted && "bg-green-400 border-green-400 shadow-lg shadow-green-400/40 ring-2 ring-green-400/30 ring-offset-2 ring-offset-gray-900",
                                    // Past days (turquoise if not completed, green if completed)
                                    dayStatus === 'past' && !dayCompleted && "bg-turquoise border-turquoise shadow-lg shadow-turquoise/30",
                                    // Future days (gray)
                                    dayStatus === 'future' && "bg-gray-700 border-gray-600 hover:border-gray-500",
                                    isCurrentView && "scale-125 z-10"
                                  )}
                                  style={{
                                    left: `${progressPercentage}%`,
                                    transform: 'translateX(-50%)'
                                  }}
                                >
                                  {/* Tooltip */}
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                                    <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                      Day {dayNum}
                                      {dayStatus === 'current' && ' (Today)'}
                                      {dayCompleted && ' ✓'}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Progress Stats */}
                        <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                          {isEntireProtocolCompleted ? (
                            <span className="text-green-400 font-medium">
                              🎉 All days completed!
                            </span>
                          ) : (
                            <>
                              <span>
                                {(() => {
                                  let completedDays = 0;
                                  for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
                                    if (isDayCompleted(dayNum)) {
                                      completedDays++;
                                    }
                                  }
                                  return completedDays;
                                })()} days completed
                              </span>
                              <span>
                                {(() => {
                                  let completedDays = 0;
                                  for (let dayNum = 1; dayNum <= activeProtocol.protocol.duration; dayNum++) {
                                    if (isDayCompleted(dayNum)) {
                                      completedDays++;
                                    }
                                  }
                                  return activeProtocol.protocol.duration - completedDays;
                                })()} days remaining
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToPreviousDay}
                            disabled={!currentViewDay || currentViewDay <= 1}
                            className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </Button>
                          
                          <div className="text-center">
                            <h3 className="text-lg font-semibold text-white">
                              {dayToDisplay?.title || `${t.day} ${currentViewDay}`}
                              </h3>
                              <p className="text-xs lg:text-sm text-gray-400">
                              {currentViewDay && (() => {
                                const dayDate = getDateForProtocolDay(currentViewDay);
                                const [year, month, day] = dayDate.split('-').map(Number);
                                const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
                                return format(dateUTC, 'EEEE, dd/MM/yyyy', { locale: dateLocale });
                              })()}
                              </p>
                            </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToNextDay}
                            disabled={!currentViewDay || !activeProtocol || currentViewDay >= activeProtocol.protocol.duration}
                            className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </Button>
                          </div>
                          
                        <div className="flex items-center gap-3">
                          {currentViewDay !== currentDay && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToCurrentDay}
                              className="border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:border-turquoise/50 rounded-lg px-3 py-1.5 text-xs lg:text-sm font-medium"
                            >
                              Go to {t.today}
                            </Button>
                          )}
                          
                          {currentViewDay === currentDay && (
                            <div className="px-2 py-1 bg-turquoise/15 border border-turquoise/30 rounded-lg">
                              <span className="text-xs lg:text-sm font-semibold text-turquoise uppercase tracking-wider">
                                {t.today}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Current Day Display */}
                    {dayToDisplay && (
                      <div className={cn(
                        "bg-white/[0.02] border rounded-xl backdrop-blur-sm transition-all duration-300",
                        currentViewDay === currentDay 
                          ? "border-turquoise/40 shadow-lg shadow-turquoise/10" 
                          : "border-gray-800/60"
                      )}>
                        {/* Tasks Section */}
                        <div className="p-4 lg:p-6">
                          {dayToDisplay.sessions
                            .sort((a, b) => a.order - b.order)
                            .map((session, sessionIndex) => {
                              const dayDate = getDateForProtocolDay(currentViewDay!);
                              const dayStatus = getDayStatus(currentViewDay!);
                              
                              return (
                                <div key={session.id} className={cn("space-y-3", sessionIndex > 0 && "mt-6")}>
                                  {/* Session Header */}
                                  {session.name && (
                                    <div className="mb-4">
                                      <h4 className="text-sm lg:text-base font-semibold text-turquoise mb-1">
                                        {session.name}
                                      </h4>
                                    </div>
                                  )}

                                  {/* Tasks Grid */}
                                  <div className="space-y-2">
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
                                              "group flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:border-gray-600/60 hover:bg-white/[0.01]",
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
                                                "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 mt-0.5 flex-shrink-0",
                                                isCompleted 
                                                  ? "bg-green-400 border-green-400 text-white shadow-lg shadow-green-400/25 scale-105" 
                                                  : "border-gray-600 hover:border-green-400/60 hover:bg-green-400/10 hover:scale-105",
                                                !canInteract && "cursor-not-allowed",
                                                isPending && "border-green-400/70"
                                              )}
                                              onClick={() => canInteract && !isPending && toggleTask(task.id, dayDate)}
                                            >
                                              {isCompleted && <CheckIcon className="h-3 w-3 transition-all duration-200" />}
                                            </button>
                                            
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                  <h5 className={cn(
                                                    "text-sm lg:text-base font-medium leading-relaxed mb-0.5",
                                                    isCompleted ? "text-turquoise-light line-through" : "text-white"
                                                  )}>
                                                    {task.title}
                                                  </h5>
                                                </div>
                                                
                                                {task.hasMoreInfo && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-turquoise hover:text-turquoise-light hover:bg-turquoise/10 h-7 w-7 p-0 rounded-lg transition-all flex-shrink-0 hover:scale-105"
                                                    onClick={() => {
                                                      setSelectedTask(task);
                                                      setShowTaskInfoModal(true);
                                                    }}
                                                  >
                                }}
                              >
                                                    <InformationCircleIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Products Section */}
                    {products.length > 0 && (
                      <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                        <div className="mb-4">
                          <h3 className="text-base lg:text-lg font-semibold text-white mb-1">
                            {t.recommendedProducts}
                          </h3>
                          <p className="text-xs lg:text-sm text-turquoise font-medium">
                            {t.selectedForProtocol}
                          </p>
                        </div>

                        <div className="space-y-3">
                          {products.map((protocolProduct) => (
                            <div 
                              key={protocolProduct.id}
                              className="flex items-center gap-4 p-3 bg-gray-800/20 border border-gray-700/40 rounded-lg"
                            >
                              {/* Product Image */}
                              {protocolProduct.product.imageUrl && (
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={protocolProduct.product.imageUrl}
                                    alt={protocolProduct.product.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm lg:text-base font-medium text-white mb-1">
                                  {protocolProduct.product.name}
                                </h4>
                                {protocolProduct.product.brand && (
                                  <p className="text-xs text-gray-400">
                                    {protocolProduct.product.brand}
                                  </p>
                                )}
                                {protocolProduct.isRequired && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
                                      <span className="text-xs font-medium text-red-400">
                                        {t.required}
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Purchase Button */}
                              {protocolProduct.product.purchaseUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-shrink-0 border-turquoise/30 text-turquoise hover:bg-turquoise/10 hover:border-turquoise/50"
                                  asChild
                                >
                                  <Link href={protocolProduct.product.purchaseUrl} target="_blank">
                                    {t.acquire}
                                  </Link>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Task Info Modal */}
                {showTaskInfoModal && selectedTask && (
                  <TaskInfoModal
                    task={selectedTask}
                    isOpen={showTaskInfoModal}
                    onClose={() => {
                      setShowTaskInfoModal(false);
                      setSelectedTask(null);
                    }}
                  />
                )}

                {/* Daily Check-in Modal */}
                {showCheckinModal && (
                  <DailyCheckinModal
                    protocolId={activeProtocol.protocolId}
                    isOpen={showCheckinModal}
                    onClose={() => setShowCheckinModal(false)}
                    onSuccess={() => {
                      setShowCheckinModal(false);
                      setHasCheckinToday(true);
                    }}
                  />
                )}

                {/* Symptom Report Modal */}
                {showSymptomModal && selectedDayForSymptoms !== null && (
                  <SymptomReportModal
                    protocolId={activeProtocol.protocolId}
                    dayNumber={selectedDayForSymptoms}
                    isOpen={showSymptomModal}
                    onClose={() => {
                      setShowSymptomModal(false);
                      setSelectedDayForSymptoms(null);
                    }}
                    onSuccess={handleSymptomReportSuccess}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 