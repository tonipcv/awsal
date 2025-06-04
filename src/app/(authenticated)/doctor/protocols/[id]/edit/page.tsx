'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  XMarkIcon,
  InformationCircleIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ProtocolEditTabs } from '@/components/protocol/protocol-edit-tabs';
import { ProtocolDayEditor } from '@/components/protocol/protocol-day-editor';

interface ProtocolTask {
  id: string;
  title: string;
  description: string;
  order: number;
  hasMoreInfo?: boolean;
  videoUrl?: string;
  fullExplanation?: string;
  productId?: string;
  modalTitle?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
}

interface ProtocolSession {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: ProtocolTask[];
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  sessions: ProtocolSession[];
  tasks: ProtocolTask[];
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
  isActive?: boolean;
  usageStats?: number;
  createdAt?: string;
  updatedAt?: string;
  doctorId?: string;
  _count?: {
    protocolProducts: number;
  };
}

interface ProtocolProduct {
  id: string;
  productId: string;
  order: number;
  isRequired: boolean;
  notes?: string;
  product: Product;
}

interface ProtocolForm {
  name: string;
  duration: number;
  description: string;
  isTemplate: boolean;
  showDoctorInfo: boolean;
  modalTitle: string;
  modalVideoUrl: string;
  modalDescription: string;
  modalButtonText: string;
  modalButtonUrl: string;
  days: ProtocolDay[];
  products: ProtocolProduct[];
}

export default function EditProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(true);
  const [isProtocolLoaded, setIsProtocolLoaded] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [protocol, setProtocol] = useState<ProtocolForm>({
    name: '',
    duration: 7,
    description: '',
    isTemplate: false,
    showDoctorInfo: false,
    modalTitle: '',
    modalVideoUrl: '',
    modalDescription: '',
    modalButtonText: '',
    modalButtonUrl: '',
    days: [],
    products: []
  });

  useEffect(() => {
    if (params.id) {
      loadProtocol(params.id as string);
      loadAvailableProducts();
    }
  }, [params.id]);

  const loadProtocol = async (protocolId: string) => {
    try {
      setIsLoadingProtocol(true);
      console.log('🔍 Loading protocol:', protocolId);
      
      const response = await fetch(`/api/protocols/${protocolId}`);
      console.log('📡 Protocol API response status:', response.status);
      console.log('📡 Protocol API response ok:', response.ok);
      console.log('📡 Protocol API response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Protocol data loaded successfully:', data.name);
        console.log('✅ Protocol data structure:', {
          id: data.id,
          name: data.name,
          doctorId: data.doctorId,
          duration: data.duration,
          daysCount: data.days?.length || 0
        });
        
        // Carregar produtos do protocolo
        const productsResponse = await fetch(`/api/protocols/${protocolId}/products`);
        console.log('📡 Products API response status:', productsResponse.status);
        console.log('📡 Products API response ok:', productsResponse.ok);
        
        let protocolProducts = [];
        if (productsResponse.ok) {
          protocolProducts = await productsResponse.json();
          console.log('✅ Protocol products loaded:', protocolProducts.length);
        } else {
          console.log('⚠️ Products API failed, continuing without products');
        }
        
        console.log('🔄 Setting protocol state...');
        setProtocol({
          name: data.name,
          duration: data.days?.length || 0,
          description: data.description || '',
          isTemplate: data.isTemplate,
          showDoctorInfo: data.showDoctorInfo || false,
          modalTitle: data.modalTitle || '',
          modalVideoUrl: data.modalVideoUrl || '',
          modalDescription: data.modalDescription || '',
          modalButtonText: data.modalButtonText || '',
          modalButtonUrl: data.modalButtonUrl || '',
          days: data.days.map((day: any) => ({
            id: day.id,
            dayNumber: day.dayNumber,
            sessions: day.sessions.map((session: any) => ({
              id: session.id,
              name: session.name,
              description: session.description || '',
              order: session.order,
              tasks: session.tasks.map((task: any) => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                order: task.order,
                hasMoreInfo: task.hasMoreInfo || false,
                videoUrl: task.videoUrl || '',
                fullExplanation: task.fullExplanation || '',
                productId: task.productId || '',
                modalTitle: task.modalTitle || '',
                modalButtonText: task.modalButtonText || '',
                modalButtonUrl: task.modalButtonUrl || ''
              }))
            })),
            tasks: day.tasks.map((task: any) => ({
              id: task.id,
              title: task.title,
              description: task.description || '',
              order: task.order,
              hasMoreInfo: task.hasMoreInfo || false,
              videoUrl: task.videoUrl || '',
              fullExplanation: task.fullExplanation || '',
              productId: task.productId || '',
              modalTitle: task.modalTitle || '',
              modalButtonText: task.modalButtonText || '',
              modalButtonUrl: task.modalButtonUrl || ''
            }))
          })),
          products: protocolProducts
        });
        
        console.log('✅ Protocol state set successfully');
      } else {
        console.error('❌ Failed to load protocol:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading protocol:', error);
    } finally {
      setIsLoadingProtocol(false);
      setIsProtocolLoaded(true);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      console.log('🔍 Loading available products...');
      const response = await fetch('/api/products');
      console.log('📡 Products API response status:', response.status);
      console.log('📡 Products API response ok:', response.ok);
      
      if (response.ok) {
        const products = await response.json();
        console.log('✅ Available products loaded:', products.length);
        setAvailableProducts(products);
      } else {
        console.error('❌ Failed to load products:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
    }
  };

  const addTask = (dayNumber: number, sessionId?: string) => {
    const newTask: ProtocolTask = {
      id: `temp-${Date.now()}`,
      title: '',
      description: '',
      order: 0,
      hasMoreInfo: false,
      videoUrl: '',
      fullExplanation: '',
      productId: '',
      modalTitle: '',
      modalButtonText: '',
      modalButtonUrl: ''
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          if (sessionId) {
            return {
              ...day,
              sessions: day.sessions.map(session => {
                if (session.id === sessionId) {
                  return {
                    ...session,
                    tasks: [...session.tasks, newTask]
                  };
                }
                return session;
              })
            };
          } else {
            return {
              ...day,
              tasks: [...day.tasks, newTask]
            };
          }
        }
        return day;
      })
    }));
  };

  const removeTask = (dayNumber: number, taskId: string, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          if (sessionId) {
            return {
              ...day,
              sessions: day.sessions.map(session => {
                if (session.id === sessionId) {
                  return {
                    ...session,
                    tasks: session.tasks.filter(task => task.id !== taskId)
                  };
                }
                return session;
              })
            };
          } else {
            return {
              ...day,
              tasks: day.tasks.filter(task => task.id !== taskId)
            };
          }
        }
        return day;
      })
    }));
  };

  const updateTask = (dayNumber: number, taskId: string, field: string, value: string | boolean, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          if (sessionId) {
            return {
              ...day,
              sessions: day.sessions.map(session => {
                if (session.id === sessionId) {
                  return {
                    ...session,
                    tasks: session.tasks.map(task => {
                      if (task.id === taskId) {
                        return { ...task, [field]: value };
                      }
                      return task;
                    })
                  };
                }
                return session;
              })
            };
          } else {
            return {
              ...day,
              tasks: day.tasks.map(task => {
                if (task.id === taskId) {
                  return { ...task, [field]: value };
                }
                return task;
              })
            };
          }
        }
        return day;
      })
    }));
  };

  const addSession = (dayNumber: number) => {
    const newSession: ProtocolSession = {
      id: `temp-session-${Date.now()}`,
      name: '',
      description: '',
      order: 0,
      tasks: []
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber === dayNumber) {
          return {
            ...day,
            sessions: [...day.sessions, newSession]
          };
        }
        return day;
      })
    }));
  };

  const removeSession = (dayNumber: number, sessionId: string) => {
    console.log('🗑️ Removing session:', { dayNumber, sessionId });
    setProtocol(prev => {
      const newProtocol = {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber === dayNumber) {
            const newDay = {
              ...day,
              sessions: day.sessions.filter(session => session.id !== sessionId)
            };
            console.log('🗑️ Day after removing session:', { 
              dayNumber: newDay.dayNumber, 
              sessionsCount: newDay.sessions.length,
              sessionIds: newDay.sessions.map(s => s.id)
            });
            return newDay;
          }
          return day;
        })
      };
      console.log('🗑️ Protocol after removing session:', {
        daysCount: newProtocol.days.length,
        day1SessionsCount: newProtocol.days.find(d => d.dayNumber === 1)?.sessions.length || 0
      });
      return newProtocol;
    });
  };

  const updateSession = (dayNumber: number, sessionId: string, field: string, value: string) => {
    console.log('✏️ Updating session:', { dayNumber, sessionId, field, value });
    setProtocol(prev => {
      const newProtocol = {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber === dayNumber) {
            const newDay = {
              ...day,
              sessions: day.sessions.map(session => {
                if (session.id === sessionId) {
                  const updatedSession = { ...session, [field]: value };
                  console.log('✏️ Session updated:', { 
                    sessionId, 
                    field, 
                    oldValue: session[field as keyof ProtocolSession], 
                    newValue: value 
                  });
                  return updatedSession;
                }
                return session;
              })
            };
            return newDay;
          }
          return day;
        })
      };
      return newProtocol;
    });
  };

  const moveTaskToSession = (dayNumber: number, taskId: string, targetSessionId: string) => {
    // Implementation for moving tasks between sessions
  };

  const moveTaskFromSession = (dayNumber: number, taskId: string, sourceSessionId: string) => {
    // Implementation for moving tasks from sessions
  };

  const addProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    const newProtocolProduct: ProtocolProduct = {
      id: `temp-product-${Date.now()}`,
      productId: productId,
      order: protocol.products.length + 1,
      isRequired: false,
      notes: '',
      product: product
    };

    setProtocol(prev => ({
      ...prev,
      products: [...prev.products, newProtocolProduct]
    }));
  };

  const removeProduct = (protocolProductId: string) => {
    setProtocol(prev => ({
      ...prev,
      products: prev.products.filter(pp => pp.id !== protocolProductId)
    }));
  };

  const updateProtocolProduct = (protocolProductId: string, field: string, value: any) => {
    setProtocol(prev => ({
      ...prev,
      products: prev.products.map(pp => {
        if (pp.id === protocolProductId) {
          return { ...pp, [field]: value };
        }
        return pp;
      })
    }));
  };

  const saveProtocol = async () => {
    try {
      setIsLoading(true);
      setShowSuccessAlert(false);
      setShowErrorAlert(false);
      setErrorMessage('');
      
      console.log('💾 Saving protocol...');
      console.log('📋 Protocol data to save:', {
        name: protocol.name,
        duration: protocol.duration,
        daysCount: protocol.days.length,
        productsCount: protocol.products.length
      });

      // Log detalhado das sessões antes de enviar
      protocol.days.forEach((day, dayIndex) => {
        console.log(`📅 Day ${day.dayNumber}:`, {
          sessionsCount: day.sessions.length,
          tasksCount: day.tasks.length
        });
        day.sessions.forEach((session, sessionIndex) => {
          console.log(`  📝 Session ${sessionIndex + 1}:`, {
            id: session.id,
            name: session.name,
            description: session.description,
            order: session.order,
            tasksCount: session.tasks.length
          });
        });
      });

      const response = await fetch(`/api/protocols/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: protocol.name,
          duration: protocol.duration,
          description: protocol.description,
          isTemplate: protocol.isTemplate,
          showDoctorInfo: protocol.showDoctorInfo,
          modalTitle: protocol.modalTitle,
          modalVideoUrl: protocol.modalVideoUrl,
          modalDescription: protocol.modalDescription,
          modalButtonText: protocol.modalButtonText,
          modalButtonUrl: protocol.modalButtonUrl,
          days: protocol.days.map(day => ({
            dayNumber: day.dayNumber,
            sessions: day.sessions.map(session => ({
              id: session.id,
              name: session.name,
              description: session.description,
              order: session.order,
              tasks: session.tasks.filter(task => task.title.trim()).map((task, index) => ({
                title: task.title,
                description: task.description,
                order: index,
                hasMoreInfo: task.hasMoreInfo || false,
                videoUrl: task.videoUrl || '',
                fullExplanation: task.fullExplanation || '',
                productId: task.productId || null,
                modalTitle: task.modalTitle || '',
                modalButtonText: task.modalButtonText || '',
                modalButtonUrl: task.modalButtonUrl || ''
              }))
            })), // REMOVIDO: .filter(session => session.tasks.length > 0) - agora salva sessões vazias também
            tasks: day.tasks.filter(task => task.title.trim()).map((task, index) => ({
              title: task.title,
              description: task.description,
              order: index,
              hasMoreInfo: task.hasMoreInfo || false,
              videoUrl: task.videoUrl || '',
              fullExplanation: task.fullExplanation || '',
              productId: task.productId || null,
              modalTitle: task.modalTitle || '',
              modalButtonText: task.modalButtonText || '',
              modalButtonUrl: task.modalButtonUrl || ''
            }))
          }))
        }),
      });

      console.log('📡 Save protocol API response status:', response.status);
      console.log('📡 Save protocol API response ok:', response.ok);

      if (response.ok) {
        console.log('✅ Protocol saved successfully');
        
        // Save products
        const productsResponse = await fetch(`/api/protocols/${params.id}/products`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            products: protocol.products.map(pp => ({
              productId: pp.productId,
              order: pp.order,
              isRequired: pp.isRequired,
              notes: pp.notes || ''
            }))
          }),
        });

        console.log('📡 Save products API response status:', productsResponse.status);
        console.log('📡 Save products API response ok:', productsResponse.ok);

        if (productsResponse.ok) {
          console.log('✅ Products saved successfully');
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 5000);
        } else {
          console.error('❌ Failed to save products:', productsResponse.status, productsResponse.statusText);
          const errorText = await productsResponse.text();
          console.error('❌ Error response:', errorText);
          setErrorMessage('Erro ao salvar produtos do protocolo');
          setShowErrorAlert(true);
          setTimeout(() => setShowErrorAlert(false), 5000);
        }
      } else {
        console.error('❌ Failed to save protocol:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        setErrorMessage('Erro ao salvar protocolo');
        setShowErrorAlert(true);
        setTimeout(() => setShowErrorAlert(false), 5000);
      }
    } catch (error) {
      console.error('❌ Error saving protocol:', error);
      setErrorMessage('Erro inesperado ao salvar protocolo');
      setShowErrorAlert(true);
      setTimeout(() => setShowErrorAlert(false), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Computed values
  const totalTasks = protocol.days.reduce((total, day) => {
    const sessionTasks = day.sessions.reduce((sessionTotal, session) => 
      sessionTotal + session.tasks.length, 0);
    return total + sessionTasks + day.tasks.length;
  }, 0);

  const availableProductsToAdd = availableProducts.filter(product => 
    !protocol.products.some(pp => pp.productId === product.id)
  );

  const updateProductRequired = (protocolProductId: string, isRequired: boolean) => {
    updateProtocolProduct(protocolProductId, 'isRequired', isRequired);
  };

  const updateProductOrder = (protocolProductId: string, order: number) => {
    updateProtocolProduct(protocolProductId, 'order', order);
  };

  const updateProductNotes = (protocolProductId: string, notes: string) => {
    updateProtocolProduct(protocolProductId, 'notes', notes);
  };

  const addDay = () => {
    const newDayNumber = protocol.days.length > 0 
      ? Math.max(...protocol.days.map(d => d.dayNumber)) + 1 
      : 1;
    
    const newDay: ProtocolDay = {
      id: `temp-day-${Date.now()}`,
      dayNumber: newDayNumber,
      sessions: [],
      tasks: []
    };

    setProtocol(prev => ({
      ...prev,
      days: [...prev.days, newDay],
      duration: prev.days.length + 1 // Atualizar duração automaticamente
    }));
  };

  const removeDay = (dayNumber: number) => {
    setProtocol(prev => {
      const newDays = prev.days.filter(d => d.dayNumber !== dayNumber);
      // Reordenar os números dos dias
      const reorderedDays = newDays.map((day, index) => ({
        ...day,
        dayNumber: index + 1
      }));
      
      return {
        ...prev,
        days: reorderedDays,
        duration: reorderedDays.length
      };
    });
  };

  if (isLoadingProtocol) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
            {/* Header Skeleton */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1">
                <div className="w-64 h-8 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-24 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>

            {/* Tabs Skeleton */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
              <div className="grid grid-cols-5 gap-2 bg-gray-100 rounded-xl p-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                <div className="space-y-4">
                  <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </div>
                        <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Indicator */}
            <div className="fixed bottom-8 right-8 bg-white border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5154e7] border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Carregando protocolo...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
        
          {/* Header */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href={`/doctor/protocols/${params.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Editar Protocolo
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2 font-medium">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{protocol.duration} dias</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{totalTasks} tarefas</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <ShoppingBagIcon className="h-4 w-4" />
                  <span>{protocol.products.length} produtos</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={saveProtocol} 
              disabled={isLoading}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>

          {/* Success Alert */}
          {showSuccessAlert && (
            <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-green-900">Protocolo salvo com sucesso!</h4>
                  <p className="text-xs text-green-700 mt-1">Todas as alterações foram salvas.</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {showErrorAlert && (
            <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900">Erro ao salvar</h4>
                  <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrorAlert(false)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-100 rounded-lg h-6 w-6 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tabs Interface */}
          <ProtocolEditTabs
            protocol={protocol}
            setProtocol={setProtocol}
            availableProducts={availableProducts}
            availableProductsToAdd={availableProductsToAdd}
            addProduct={addProduct}
            removeProduct={removeProduct}
            updateProtocolProduct={updateProtocolProduct}
          >
            {{
              basicInfo: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-900 font-semibold">Nome do Protocolo</Label>
                          <Input
                            id="name"
                            value={protocol.name}
                            onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Pós-Preenchimento Facial"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-gray-900 font-semibold">Descrição</Label>
                          <Textarea
                            id="description"
                            value={protocol.description}
                            onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Descreva o protocolo..."
                            className="min-h-[120px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="isTemplate"
                              checked={protocol.isTemplate}
                              onChange={(e) => setProtocol(prev => ({ ...prev, isTemplate: e.target.checked }))}
                              className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                            />
                            <Label htmlFor="isTemplate" className="text-gray-900 font-medium">
                              Salvar como template
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="showDoctorInfo"
                              checked={protocol.showDoctorInfo}
                              onChange={(e) => setProtocol(prev => ({ ...prev, showDoctorInfo: e.target.checked }))}
                              className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                            />
                            <Label htmlFor="showDoctorInfo" className="text-gray-900 font-medium">
                              Mostrar médico responsável
                            </Label>
                            <span className="text-xs text-gray-500">
                              (Exibe sua foto e nome na tela do paciente)
                            </span>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Gerenciamento de Dias
                              </p>
                              <p className="text-xs text-blue-700">
                                A duração do protocolo é determinada automaticamente pelos dias que você adicionar na aba "Cronograma". 
                                Atualmente: <strong>{protocol.days.length} {protocol.days.length === 1 ? 'dia' : 'dias'}</strong>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),

              modalConfig: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Modal para Protocolo Indisponível</CardTitle>
                    <p className="text-gray-600 font-medium">
                      Configure o modal que será exibido quando este protocolo estiver indisponível para um paciente específico.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="modalTitle" className="text-gray-900 font-semibold">Título do Modal</Label>
                          <Input
                            id="modalTitle"
                            value={protocol.modalTitle}
                            onChange={(e) => setProtocol(prev => ({ ...prev, modalTitle: e.target.value }))}
                            placeholder="Ex: Protocolo em Desenvolvimento"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="modalVideoUrl" className="text-gray-900 font-semibold">URL do Vídeo (opcional)</Label>
                          <Input
                            id="modalVideoUrl"
                            value={protocol.modalVideoUrl}
                            onChange={(e) => setProtocol(prev => ({ ...prev, modalVideoUrl: e.target.value }))}
                            placeholder="Ex: https://www.youtube.com/embed/..."
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="modalDescription" className="text-gray-900 font-semibold">Descrição do Modal</Label>
                          <Textarea
                            id="modalDescription"
                            value={protocol.modalDescription}
                            onChange={(e) => setProtocol(prev => ({ ...prev, modalDescription: e.target.value }))}
                            placeholder="Descreva o que será mostrado no modal..."
                            className="min-h-[80px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="modalButtonText" className="text-gray-900 font-semibold">Texto do Botão</Label>
                            <Input
                              id="modalButtonText"
                              value={protocol.modalButtonText}
                              onChange={(e) => setProtocol(prev => ({ ...prev, modalButtonText: e.target.value }))}
                              placeholder="Ex: Saber mais"
                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="modalButtonUrl" className="text-gray-900 font-semibold">URL do Botão (opcional)</Label>
                            <Input
                              id="modalButtonUrl"
                              value={protocol.modalButtonUrl}
                              onChange={(e) => setProtocol(prev => ({ ...prev, modalButtonUrl: e.target.value }))}
                              placeholder="Ex: https://..."
                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),

              products: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">Produtos do Protocolo</CardTitle>
                        <p className="text-gray-600 font-medium mt-1">
                          Adicione produtos que serão recomendados aos pacientes neste protocolo.
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                        {protocol.products.length} produtos
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">

                    {/* Add Product */}
                    {availableProductsToAdd.length > 0 ? (
                      <div className="space-y-3">
                        <Label className="text-gray-900 font-semibold">Adicionar Produto</Label>
                        <div className="flex gap-3">
                          <Select onValueChange={addProduct}>
                            <SelectTrigger className="flex-1 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-12">
                              <SelectValue placeholder="Selecione um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProductsToAdd.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{product.name}</span>
                                    {product.brand && (
                                      <span className="text-xs text-gray-500">({product.brand})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
                        <p className="text-sm text-gray-600 text-center font-medium">
                          {availableProducts.length === 0 
                            ? 'Carregando produtos...' 
                            : 'Todos os produtos disponíveis já foram adicionados ao protocolo.'
                          }
                        </p>
                      </div>
                    )}

                    {/* Products List */}
                    {protocol.products.length > 0 && (
                      <div className="space-y-4">
                        {protocol.products.map((protocolProduct, index) => (
                          <div key={protocolProduct.id} className="border border-gray-200 rounded-xl bg-gray-50">
                            <div className="p-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-gray-900">{protocolProduct.product.name}</h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeProduct(protocolProduct.id)}
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {protocolProduct.product.description && (
                                    <p className="text-gray-600 text-sm">{protocolProduct.product.description}</p>
                                  )}
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        id={`required-${protocolProduct.id}`}
                                        checked={protocolProduct.isRequired}
                                        onChange={(e) => updateProductRequired(protocolProduct.id, e.target.checked)}
                                        className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                                      />
                                      <Label htmlFor={`required-${protocolProduct.id}`} className="text-gray-900 font-medium">
                                        Produto obrigatório
                                      </Label>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label className="text-gray-900 font-semibold">Ordem</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={protocolProduct.order}
                                        onChange={(e) => updateProductOrder(protocolProduct.id, parseInt(e.target.value) || 1)}
                                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-10"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-gray-900 font-semibold">Observações (opcional)</Label>
                                    <Textarea
                                      value={protocolProduct.notes || ''}
                                      onChange={(e) => updateProductNotes(protocolProduct.id, e.target.value)}
                                      placeholder="Observações sobre o uso deste produto..."
                                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ),

              days: (
                <ProtocolDayEditor
                  days={protocol.days}
                  availableProducts={availableProducts}
                  addTask={addTask}
                  removeTask={removeTask}
                  updateTask={updateTask}
                  addSession={addSession}
                  removeSession={removeSession}
                  updateSession={updateSession}
                  moveTaskToSession={moveTaskToSession}
                  moveTaskFromSession={moveTaskFromSession}
                  addDay={addDay}
                  removeDay={removeDay}
                />
              )
            }}
          </ProtocolEditTabs>
        </div>
      </div>
    </div>
  );
} 