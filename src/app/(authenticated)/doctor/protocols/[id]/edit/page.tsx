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
  tasks: ProtocolTask[]; // Para compatibilidade com protocolos antigos
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

  // Carregar protocolo existente
  useEffect(() => {
    if (params.id) {
      loadProtocol(params.id as string);
      loadAvailableProducts();
    }
  }, [params.id]);

  const loadProtocol = async (protocolId: string) => {
    try {
      setIsLoadingProtocol(true);
      const response = await fetch(`/api/protocols/${protocolId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Carregar produtos do protocolo
        const productsResponse = await fetch(`/api/protocols/${protocolId}/products`);
        let protocolProducts = [];
        if (productsResponse.ok) {
          protocolProducts = await productsResponse.json();
        }
        
        setProtocol({
          name: data.name,
          duration: data.duration,
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
                modalButtonText: task.modalButtonText || ''
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
              modalButtonText: task.modalButtonText || ''
            }))
          })),
          products: protocolProducts
        });
      } else {
        router.push('/doctor/protocols');
      }
    } catch (error) {
      console.error('Error loading protocol:', error);
      router.push('/doctor/protocols');
    } finally {
      setIsLoadingProtocol(false);
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const products = await response.json();
        setAvailableProducts(products);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // Gerar dias automaticamente quando a duração muda
  React.useEffect(() => {
    if (isLoadingProtocol) return;
    
    const newDays: ProtocolDay[] = [];
    for (let i = 1; i <= protocol.duration; i++) {
      const existingDay = protocol.days.find(d => d.dayNumber === i);
      if (existingDay) {
        newDays.push(existingDay);
      } else {
        newDays.push({
          id: `day-${i}`,
          dayNumber: i,
          sessions: [],
          tasks: []
        });
      }
    }
    setProtocol(prev => ({ ...prev, days: newDays }));
  }, [protocol.duration, isLoadingProtocol]);

  const addTask = (dayNumber: number, sessionId?: string) => {
    const newTask: ProtocolTask = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      order: 0,
      hasMoreInfo: false,
      videoUrl: '',
      fullExplanation: '',
      productId: '',
      modalTitle: '',
      modalButtonText: ''
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: sessionId 
                ? day.sessions.map(session =>
                    session.id === sessionId
                      ? { ...session, tasks: [...session.tasks, newTask] }
                      : session
                  )
                : day.sessions,
              tasks: sessionId ? day.tasks : [...day.tasks, newTask]
            }
          : day
      )
    }));
  };

  const removeTask = (dayNumber: number, taskId: string, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: sessionId
                ? day.sessions.map(session =>
                    session.id === sessionId
                      ? { ...session, tasks: session.tasks.filter(task => task.id !== taskId) }
                      : session
                  )
                : day.sessions,
              tasks: sessionId ? day.tasks : day.tasks.filter(task => task.id !== taskId)
            }
          : day
      )
    }));
  };

  const updateTask = (dayNumber: number, taskId: string, field: keyof ProtocolTask, value: string | boolean, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: sessionId
                ? day.sessions.map(session =>
                    session.id === sessionId
                      ? {
                          ...session,
                          tasks: session.tasks.map(task => 
                            task.id === taskId 
                              ? { ...task, [field]: value }
                              : task
                          )
                        }
                      : session
                  )
                : day.sessions,
              tasks: sessionId 
                ? day.tasks
                : day.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, [field]: value }
                  : task
                  )
            }
          : day
      )
    }));
  };

  // Funções para sessões
  const addSession = (dayNumber: number) => {
    const newSession: ProtocolSession = {
      id: `session-${Date.now()}`,
      name: '',
      description: '',
      order: 0,
      tasks: []
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: [...day.sessions, newSession]
            }
          : day
      )
    }));
  };

  const removeSession = (dayNumber: number, sessionId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: day.sessions.filter(session => session.id !== sessionId)
            }
          : day
      )
    }));
  };

  const updateSession = (dayNumber: number, sessionId: string, field: keyof ProtocolSession, value: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: day.sessions.map(session => 
                session.id === sessionId 
                  ? { ...session, [field]: value }
                  : session
              )
            }
          : day
      )
    }));
  };

  // Função para mover tarefa direta para uma sessão
  const moveTaskToSession = (dayNumber: number, taskId: string, targetSessionId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              // Remover tarefa das tarefas diretas
              tasks: day.tasks.filter(task => task.id !== taskId),
              // Adicionar tarefa à sessão de destino
              sessions: day.sessions.map(session =>
                session.id === targetSessionId
                  ? {
                      ...session,
                      tasks: [...session.tasks, day.tasks.find(task => task.id === taskId)!]
                    }
                  : session
              )
            }
          : day
      )
    }));
  };

  // Função para mover tarefa de sessão para tarefas diretas
  const moveTaskFromSession = (dayNumber: number, taskId: string, sourceSessionId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              // Adicionar tarefa às tarefas diretas
              tasks: [...day.tasks, day.sessions.find(session => session.id === sourceSessionId)!.tasks.find(task => task.id === taskId)!],
              // Remover tarefa da sessão
              sessions: day.sessions.map(session =>
                session.id === sourceSessionId
                  ? {
                      ...session,
                      tasks: session.tasks.filter(task => task.id !== taskId)
                    }
                  : session
              )
            }
          : day
      )
    }));
  };

  // Funções para produtos
  const addProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    const isAlreadyAdded = protocol.products.some(pp => pp.productId === productId);
    if (isAlreadyAdded) {
      alert('Este produto já foi adicionado ao protocolo');
      return;
    }

    const newProtocolProduct: ProtocolProduct = {
      id: `pp-${Date.now()}`,
      productId: productId,
      order: protocol.products.length,
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

  const updateProtocolProduct = (protocolProductId: string, field: keyof ProtocolProduct, value: any) => {
    setProtocol(prev => ({
      ...prev,
      products: prev.products.map(pp => 
        pp.id === protocolProductId 
          ? { ...pp, [field]: value }
          : pp
      )
    }));
  };

  const saveProtocol = async () => {
    if (!protocol.name.trim()) {
      alert('Nome do protocolo é obrigatório');
      return;
    }

    if (protocol.duration < 1) {
      alert('Duração deve ser pelo menos 1 dia');
      return;
    }

    try {
      setIsLoading(true);

      // Salvar protocolo
      const response = await fetch(`/api/protocols/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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
                modalButtonText: task.modalButtonText || ''
              }))
            })).filter(session => session.tasks.length > 0),
            tasks: day.tasks.filter(task => task.title.trim()).map((task, index) => ({
              title: task.title,
              description: task.description,
              order: index,
              hasMoreInfo: task.hasMoreInfo || false,
              videoUrl: task.videoUrl || '',
              fullExplanation: task.fullExplanation || '',
              productId: task.productId || null,
              modalTitle: task.modalTitle || '',
              modalButtonText: task.modalButtonText || ''
            }))
          })).filter(day => day.sessions.length > 0 || day.tasks.length > 0)
        })
      });

      if (response.ok) {
        // Salvar produtos do protocolo
        const productsResponse = await fetch(`/api/protocols/${params.id}/products`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            products: protocol.products.map((pp, index) => ({
              productId: pp.productId,
              order: index,
              isRequired: pp.isRequired,
              notes: pp.notes
            }))
          })
        });

        if (productsResponse.ok) {
          router.push(`/doctor/protocols/${params.id}`);
        } else {
          const error = await productsResponse.json();
          alert(error.error || 'Erro ao salvar produtos do protocolo');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar protocolo');
      }
    } catch (error) {
      console.error('Error updating protocol:', error);
      alert('Erro ao atualizar protocolo');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (isLoadingProtocol) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5154e7]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculated variables
  const totalTasks = protocol.days.reduce((total, day) => {
    return total + day.tasks.length + day.sessions.reduce((sessionTotal, session) => sessionTotal + session.tasks.length, 0);
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

          <div className="space-y-8">
            
            {/* Protocol Basic Info */}
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
                      <Label htmlFor="duration" className="text-gray-900 font-semibold">Duração (dias)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="365"
                        value={protocol.duration}
                        onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-gray-900 font-semibold">Descrição</Label>
                      <Textarea
                        id="description"
                        value={protocol.description}
                        onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descreva o protocolo..."
                        className="min-h-[80px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                      />
                    </div>

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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modal Configuration for Unavailable Protocol */}
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

            {/* Products Section */}
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

            {/* Protocol Days */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Dias do Protocolo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {protocol.days.map((day) => (
                  <div key={day.id} className="border border-gray-200 rounded-xl bg-gray-50">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                          Dia {day.dayNumber}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSession(day.dayNumber)}
                          className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Adicionar Sessão
                        </Button>
                      </div>

                      {/* Sessions */}
                      {day.sessions.map((session) => (
                        <div key={session.id} className="mb-6 border border-gray-200 rounded-xl bg-white">
                          {/* Session Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div className="flex-1 space-y-2">
                              <Input
                                value={session.name}
                                onChange={(e) => updateSession(day.dayNumber, session.id, 'name', e.target.value)}
                                placeholder="Nome da sessão"
                                className="border-0 bg-transparent text-gray-900 font-semibold p-0 h-auto focus:ring-0 focus:border-0"
                              />
                              <Input
                                value={session.description || ''}
                                onChange={(e) => updateSession(day.dayNumber, session.id, 'description', e.target.value)}
                                placeholder="Descrição da sessão (opcional)"
                                className="border-0 bg-transparent text-gray-600 p-0 h-auto focus:ring-0 focus:border-0 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSession(day.dayNumber, session.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Session Tasks */}
                          <div className="p-4 space-y-4">
                            {session.tasks.map((task) => (
                              <div key={task.id} className="border border-gray-200 rounded-xl bg-gray-50">
                                <div className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1 space-y-4">
                                      {/* Basic Fields */}
                                      <div className="space-y-3">
                                        <Input
                                          placeholder="Título da tarefa"
                                          value={task.title}
                                          onChange={(e) => updateTask(day.dayNumber, task.id, 'title', e.target.value, session.id)}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-semibold"
                                        />
                                        <Textarea
                                          placeholder="Descrição básica"
                                          value={task.description}
                                          onChange={(e) => updateTask(day.dayNumber, task.id, 'description', e.target.value, session.id)}
                                          rows={2}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                                        />
                                      </div>

                                      {/* Toggle for More Info */}
                                      <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                                        <input
                                          type="checkbox"
                                          id={`hasMoreInfo-session-${task.id}`}
                                          checked={task.hasMoreInfo || false}
                                          onChange={(e) => updateTask(day.dayNumber, task.id, 'hasMoreInfo', e.target.checked, session.id)}
                                          className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                                        />
                                        <Label htmlFor={`hasMoreInfo-session-${task.id}`} className="text-gray-700 font-medium flex items-center gap-2">
                                          <InformationCircleIcon className="h-4 w-4" />
                                          Adicionar conteúdo extra
                                        </Label>
                                      </div>

                                      {/* Extra Fields */}
                                      {task.hasMoreInfo && (
                                        <div className="space-y-4 p-4 bg-white rounded-xl border border-gray-200">
                                          <div className="grid grid-cols-1 gap-4">
                                            <div>
                                              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                <PlayIcon className="h-4 w-4" />
                                                URL do Vídeo
                                              </Label>
                                              <Input
                                                placeholder="https://youtube.com/watch?v=..."
                                                value={task.videoUrl || ''}
                                                onChange={(e) => updateTask(day.dayNumber, task.id, 'videoUrl', e.target.value, session.id)}
                                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                                              />
                                            </div>
                                            
                                            <div>
                                              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                <InformationCircleIcon className="h-4 w-4" />
                                                Explicação Completa
                                              </Label>
                                              <Textarea
                                                placeholder="Explicação detalhada da tarefa..."
                                                value={task.fullExplanation || ''}
                                                onChange={(e) => updateTask(day.dayNumber, task.id, 'fullExplanation', e.target.value, session.id)}
                                                rows={3}
                                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                                              />
                                            </div>

                                            <div>
                                              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                <ShoppingBagIcon className="h-4 w-4" />
                                                Produto Relacionado (opcional)
                                              </Label>
                                              <Select 
                                                value={task.productId || 'none'} 
                                                onValueChange={(value) => updateTask(day.dayNumber, task.id, 'productId', value === 'none' ? '' : value, session.id)}
                                              >
                                                <SelectTrigger className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-10">
                                                  <SelectValue placeholder="Selecione um produto..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="none">Nenhum produto</SelectItem>
                                                  {availableProducts.map((product) => (
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

                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                  <EyeIcon className="h-4 w-4" />
                                                  Título do Modal
                                                </Label>
                                                <Input
                                                  placeholder="Título personalizado"
                                                  value={task.modalTitle || ''}
                                                  onChange={(e) => updateTask(day.dayNumber, task.id, 'modalTitle', e.target.value, session.id)}
                                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                                                />
                                              </div>
                                              
                                              <div>
                                                <Label className="text-gray-900 font-semibold mb-2 block">
                                                  Texto do Botão
                                                </Label>
                                                <Input
                                                  placeholder="Saber mais"
                                                  value={task.modalButtonText || ''}
                                                  onChange={(e) => updateTask(day.dayNumber, task.id, 'modalButtonText', e.target.value, session.id)}
                                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(day.dayNumber, task.id, session.id)}
                                      className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTask(day.dayNumber, session.id)}
                              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 rounded-xl h-10 font-semibold"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Adicionar Tarefa
                            </Button>

                            {/* Move Direct Tasks to Session */}
                            {day.tasks.length > 0 && (
                              <div className="border-t border-gray-200 pt-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-gray-900 font-semibold">Mover Tarefas Diretas</Label>
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs font-medium">
                                      {day.tasks.length} {day.tasks.length === 1 ? 'tarefa disponível' : 'tarefas disponíveis'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-600 font-medium">
                                    Clique em uma tarefa direta para movê-la para esta sessão
                                  </p>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {day.tasks.map(task => (
                                      <div
                                        key={task.id}
                                        onClick={() => moveTaskToSession(day.dayNumber, task.id, session.id)}
                                        className="p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                              {task.title || 'Tarefa sem título'}
                                            </p>
                                            {task.description && (
                                              <p className="text-xs text-gray-600 truncate">
                                                {task.description}
                                              </p>
                                            )}
                                          </div>
                                          <ArrowLeftIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2 rotate-180" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Direct Tasks */}
                      {day.tasks.length > 0 && (
                        <div className="p-4 bg-white border border-gray-200 rounded-xl">
                          <h5 className="text-sm font-bold text-gray-900 mb-4">Tarefas Diretas</h5>
                          <div className="space-y-4">
                            {day.tasks.map(task => (
                              <div key={task.id} className="group">
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 hover:border-[#5154e7] transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-3">
                                      <Input
                                        value={task.title}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'title', e.target.value)}
                                        placeholder="Título da tarefa"
                                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-semibold"
                                      />
                                      <Textarea
                                        value={task.description}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'description', e.target.value)}
                                        placeholder="Descrição da tarefa (opcional)"
                                        className="min-h-[60px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(day.dayNumber, task.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Additional Information */}
                                  <div className="border-t border-gray-200 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <input
                                        type="checkbox"
                                        id={`hasMoreInfo-${task.id}`}
                                        checked={task.hasMoreInfo || false}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'hasMoreInfo', e.target.checked)}
                                        className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                                      />
                                      <Label htmlFor={`hasMoreInfo-${task.id}`} className="text-gray-900 font-medium">
                                        Esta tarefa tem informações adicionais (vídeo, explicação ou produto)
                                      </Label>
                                    </div>

                                    {task.hasMoreInfo && (
                                      <div className="space-y-4 pl-6 border-l-2 border-[#5154e7]">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-gray-900 font-semibold">Título do Modal (opcional)</Label>
                                            <Input
                                              value={task.modalTitle || ''}
                                              onChange={(e) => updateTask(day.dayNumber, task.id, 'modalTitle', e.target.value)}
                                              placeholder="Ex: Como fazer este exercício"
                                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-gray-900 font-semibold">Texto do Botão (opcional)</Label>
                                            <Input
                                              value={task.modalButtonText || ''}
                                              onChange={(e) => updateTask(day.dayNumber, task.id, 'modalButtonText', e.target.value)}
                                              placeholder="Ex: Ver mais"
                                              className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-gray-900 font-semibold">URL do Vídeo (opcional)</Label>
                                          <Input
                                            value={task.videoUrl || ''}
                                            onChange={(e) => updateTask(day.dayNumber, task.id, 'videoUrl', e.target.value)}
                                            placeholder="Ex: https://youtube.com/embed/..."
                                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-gray-900 font-semibold">Explicação Completa (opcional)</Label>
                                          <Textarea
                                            value={task.fullExplanation || ''}
                                            onChange={(e) => updateTask(day.dayNumber, task.id, 'fullExplanation', e.target.value)}
                                            placeholder="Explicação detalhada sobre como realizar esta tarefa..."
                                            className="min-h-[80px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-gray-900 font-semibold">Produto Relacionado (opcional)</Label>
                                          <Select 
                                            value={task.productId || 'none'} 
                                            onValueChange={(value) => updateTask(day.dayNumber, task.id, 'productId', value === 'none' ? '' : value)}
                                          >
                                            <SelectTrigger className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-10">
                                              <SelectValue placeholder="Selecione um produto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Nenhum produto</SelectItem>
                                              {availableProducts.map((product) => (
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
                                    )}
                                  </div>

                                  {/* Move to Session */}
                                  {day.sessions.length > 0 && (
                                    <div className="border-t border-gray-200 pt-4">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-gray-900 font-semibold">Mover para Sessão</Label>
                                          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200 text-xs font-medium">
                                            {day.sessions.length} {day.sessions.length === 1 ? 'sessão disponível' : 'sessões disponíveis'}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600 font-medium">
                                          Clique em uma sessão para mover esta tarefa
                                        </p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                          {day.sessions.map((sessionOption) => (
                                            <div
                                              key={sessionOption.id}
                                              onClick={() => moveTaskToSession(day.dayNumber, task.id, sessionOption.id)}
                                              className="p-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-colors"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {sessionOption.name || `Sessão ${sessionOption.order + 1}`}
                                                  </p>
                                                  {sessionOption.description && (
                                                    <p className="text-xs text-gray-600 truncate">
                                                      {sessionOption.description}
                                                    </p>
                                                  )}
                                                </div>
                                                <ArrowLeftIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2 rotate-180" />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTask(day.dayNumber)}
                        className="w-full border-dashed border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 rounded-xl h-12 font-semibold"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Adicionar Tarefa Direta ao Dia {day.dayNumber}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 