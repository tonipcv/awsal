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
  XMarkIcon
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando protocolo...</span>
      </div>
    );
  }

  const totalTasks = protocol.days.reduce((acc, day) => acc + day.tasks.length, 0);
  const availableProductsToAdd = availableProducts.filter(
    product => !protocol.products.some(pp => pp.productId === product.id)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              <Link href={`/doctor/protocols/${params.id}`}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-light text-slate-800">
              Editar Protocolo
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <ClockIcon className="h-3 w-3" />
                <span>{protocol.duration} dias</span>
                <span>•</span>
                <DocumentTextIcon className="h-3 w-3" />
                <span>{totalTasks} tarefas</span>
                <span>•</span>
                <ShoppingBagIcon className="h-3 w-3" />
                <span>{protocol.products.length} produtos</span>
            </div>
          </div>
          <Button 
            onClick={saveProtocol} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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

          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Protocol Basic Info */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-800">Nome do Protocolo</Label>
                  <Input
                    id="name"
                    value={protocol.name}
                    onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pós-Preenchimento Facial"
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="duration" className="text-slate-800">Duração (dias)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="365"
                    value={protocol.duration}
                    onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                      className="border-slate-300 bg-white text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-800">Descrição</Label>
                  <Textarea
                    id="description"
                    value={protocol.description}
                    onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o protocolo..."
                      className="min-h-[80px] border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isTemplate"
                    checked={protocol.isTemplate}
                    onChange={(e) => setProtocol(prev => ({ ...prev, isTemplate: e.target.checked }))}
                      className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                  />
                    <Label htmlFor="isTemplate" className="text-slate-800">
                    Salvar como template
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showDoctorInfo"
                    checked={protocol.showDoctorInfo}
                    onChange={(e) => setProtocol(prev => ({ ...prev, showDoctorInfo: e.target.checked }))}
                    className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="showDoctorInfo" className="text-slate-800">
                    Mostrar médico responsável
                  </Label>
                  <span className="text-xs text-slate-500 ml-2">
                    (Exibe sua foto e nome na tela do paciente)
                  </span>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

            {/* Modal Configuration for Unavailable Protocol */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Modal para Protocolo Indisponível</CardTitle>
              <p className="text-sm text-slate-600">
                Configure o modal que será exibido quando este protocolo estiver indisponível para um paciente específico.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modalTitle" className="text-slate-800">Título do Modal</Label>
                    <Input
                      id="modalTitle"
                      value={protocol.modalTitle}
                      onChange={(e) => setProtocol(prev => ({ ...prev, modalTitle: e.target.value }))}
                      placeholder="Ex: Protocolo em Desenvolvimento"
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modalVideoUrl" className="text-slate-800">URL do Vídeo (opcional)</Label>
                    <Input
                      id="modalVideoUrl"
                      value={protocol.modalVideoUrl}
                      onChange={(e) => setProtocol(prev => ({ ...prev, modalVideoUrl: e.target.value }))}
                      placeholder="Ex: https://www.youtube.com/embed/..."
                      className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modalDescription" className="text-slate-800">Descrição do Modal</Label>
                    <Textarea
                      id="modalDescription"
                      value={protocol.modalDescription}
                      onChange={(e) => setProtocol(prev => ({ ...prev, modalDescription: e.target.value }))}
                      placeholder="Descreva o que será mostrado no modal..."
                      className="min-h-[80px] border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="modalButtonText" className="text-slate-800">Texto do Botão</Label>
                      <Input
                        id="modalButtonText"
                        value={protocol.modalButtonText}
                        onChange={(e) => setProtocol(prev => ({ ...prev, modalButtonText: e.target.value }))}
                        placeholder="Ex: Saber mais"
                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modalButtonUrl" className="text-slate-800">URL do Botão (opcional)</Label>
                      <Input
                        id="modalButtonUrl"
                        value={protocol.modalButtonUrl}
                        onChange={(e) => setProtocol(prev => ({ ...prev, modalButtonUrl: e.target.value }))}
                        placeholder="Ex: https://..."
                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

            {/* Products Section */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-slate-800">Produtos do Protocolo</CardTitle>
                  <p className="text-sm text-slate-600 mt-1">
                    Adicione produtos que serão recomendados aos pacientes neste protocolo.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  {protocol.products.length} produtos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Add Product */}
              {availableProductsToAdd.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-slate-800">Adicionar Produto</Label>
                  <div className="flex gap-3">
                    <Select onValueChange={addProduct}>
                      <SelectTrigger className="flex-1 border-slate-300 bg-white text-slate-700">
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProductsToAdd.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              <span>{product.name}</span>
                              {product.brand && (
                                <span className="text-xs text-slate-500">({product.brand})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600 text-center">
                    {availableProducts.length === 0 
                      ? 'Carregando produtos...' 
                      : 'Todos os produtos disponíveis já foram adicionados ao protocolo.'
                    }
                  </p>
                </div>
              )}

              {/* Products List */}
              {protocol.products.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-center">
                    <ShoppingBagIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-sm font-medium text-slate-800 mb-2">Nenhum produto adicionado</h3>
                    <p className="text-xs text-slate-600">
                        Produtos ajudam os pacientes a seguir o protocolo corretamente.
                      </p>
                    </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {protocol.products.map((protocolProduct, index) => (
                    <div key={protocolProduct.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                        <div className="w-16 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {protocolProduct.product.imageUrl ? (
                              <img 
                                src={protocolProduct.product.imageUrl} 
                                alt={protocolProduct.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                            <ShoppingBagIcon className="h-6 w-6 text-slate-400" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 space-y-3">
                            <div>
                            <h4 className="text-sm font-medium text-slate-800">
                                {protocolProduct.product.name}
                              </h4>
                              {protocolProduct.product.brand && (
                              <p className="text-xs text-blue-600">{protocolProduct.product.brand}</p>
                              )}
                              {protocolProduct.product.description && (
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                  {protocolProduct.product.description}
                                </p>
                              )}
                            </div>

                            {/* Price */}
                            {(protocolProduct.product.originalPrice || protocolProduct.product.discountPrice) && (
                              <div className="flex items-center gap-2">
                                {protocolProduct.product.discountPrice && protocolProduct.product.originalPrice ? (
                                  <>
                                  <span className="text-xs font-medium text-blue-600">
                                      {formatPrice(protocolProduct.product.discountPrice)}
                                    </span>
                                  <span className="text-xs text-slate-400 line-through">
                                      {formatPrice(protocolProduct.product.originalPrice)}
                                    </span>
                                  </>
                                ) : (
                                <span className="text-xs font-medium text-slate-800">
                                    {formatPrice(protocolProduct.product.originalPrice || protocolProduct.product.discountPrice)}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Product Options */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                              <div className="space-y-1">
                              <Label className="text-slate-800">Obrigatório?</Label>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`required-${protocolProduct.id}`}
                                    checked={protocolProduct.isRequired}
                                    onChange={(e) => updateProtocolProduct(protocolProduct.id, 'isRequired', e.target.checked)}
                                  className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                                  />
                                <Label htmlFor={`required-${protocolProduct.id}`} className="text-slate-800">
                                    Produto obrigatório
                                  </Label>
                                </div>
                              </div>

                              <div className="lg:col-span-2 space-y-1">
                              <Label className="text-slate-800">Observações (opcional)</Label>
                                <Input
                                  value={protocolProduct.notes || ''}
                                  onChange={(e) => updateProtocolProduct(protocolProduct.id, 'notes', e.target.value)}
                                  placeholder="Ex: Usar 2x ao dia..."
                                className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProduct(protocolProduct.id)}
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 flex-shrink-0"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

            {/* Protocol Days */}
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800">Dias do Protocolo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                {protocol.days.map(day => (
                  <div key={day.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-blue-600">
                          Dia {day.dayNumber}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {day.sessions.length} {day.sessions.length === 1 ? 'sessão' : 'sessões'} • {day.tasks.length} {day.tasks.length === 1 ? 'tarefa' : 'tarefas'} diretas
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSession(day.dayNumber)}
                          className="border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Sessão
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Sessões */}
                      {day.sessions.map(session => (
                        <div key={session.id} className="p-4 bg-white border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="flex-1 space-y-3">
                              <Input
                                value={session.name}
                                onChange={(e) => updateSession(day.dayNumber, session.id, 'name', e.target.value)}
                                placeholder="Nome da sessão (ex: Manhã, Exercícios, Medicação)"
                                className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500 font-medium"
                              />
                              <Input
                                value={session.description || ''}
                                onChange={(e) => updateSession(day.dayNumber, session.id, 'description', e.target.value)}
                                placeholder="Descrição da sessão (opcional)"
                                className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSession(day.dayNumber, session.id)}
                              className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Tarefas da Sessão */}
                          <div className="space-y-4">
                            {session.tasks.map(task => (
                              <div key={task.id} className="group">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 hover:border-blue-300 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1 space-y-3">
                                      <Input
                                        value={task.title}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'title', e.target.value, session.id)}
                                        placeholder="Título da tarefa"
                                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                      />
                                      <Textarea
                                        value={task.description}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'description', e.target.value, session.id)}
                                        placeholder="Descrição da tarefa (opcional)"
                                        className="min-h-[60px] border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTask(day.dayNumber, task.id, session.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  {/* Informações Adicionais */}
                                  <div className="border-t border-slate-200 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <input
                                        type="checkbox"
                                        id={`hasMoreInfo-${task.id}`}
                                        checked={task.hasMoreInfo || false}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'hasMoreInfo', e.target.checked, session.id)}
                                        className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                                      />
                                      <Label htmlFor={`hasMoreInfo-${task.id}`} className="text-sm text-slate-800">
                                        Esta tarefa tem informações adicionais (vídeo, explicação ou produto)
                                      </Label>
                                    </div>

                                    {task.hasMoreInfo && (
                                      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-sm text-slate-800">Título do Modal (opcional)</Label>
                                            <Input
                                              value={task.modalTitle || ''}
                                              onChange={(e) => updateTask(day.dayNumber, task.id, 'modalTitle', e.target.value, session.id)}
                                              placeholder="Ex: Como fazer este exercício"
                                              className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <Label className="text-sm text-slate-800">Texto do Botão (opcional)</Label>
                                            <Input
                                              value={task.modalButtonText || ''}
                                              onChange={(e) => updateTask(day.dayNumber, task.id, 'modalButtonText', e.target.value, session.id)}
                                              placeholder="Ex: Ver mais"
                                              className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm text-slate-800">URL do Vídeo (opcional)</Label>
                                          <Input
                                            value={task.videoUrl || ''}
                                            onChange={(e) => updateTask(day.dayNumber, task.id, 'videoUrl', e.target.value, session.id)}
                                            placeholder="Ex: https://youtube.com/embed/..."
                                            className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm text-slate-800">Explicação Completa (opcional)</Label>
                                          <Textarea
                                            value={task.fullExplanation || ''}
                                            onChange={(e) => updateTask(day.dayNumber, task.id, 'fullExplanation', e.target.value, session.id)}
                                            placeholder="Explicação detalhada sobre como realizar esta tarefa..."
                                            className="min-h-[80px] border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm text-slate-800">Produto Relacionado (opcional)</Label>
                                          <Select 
                                            value={task.productId || 'none'} 
                                            onValueChange={(value) => updateTask(day.dayNumber, task.id, 'productId', value === 'none' ? '' : value, session.id)}
                                          >
                                            <SelectTrigger className="border-slate-300 bg-white text-slate-700">
                                              <SelectValue placeholder="Selecione um produto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Nenhum produto</SelectItem>
                                              {availableProducts.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                  <div className="flex items-center gap-2">
                                                    <span>{product.name}</span>
                                                    {product.brand && (
                                                      <span className="text-xs text-slate-500">({product.brand})</span>
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

                                  {/* Mover para Sessão */}
                                  {day.sessions.length > 0 && (
                                    <div className="border-t border-slate-200 pt-4">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-sm font-medium text-slate-800">Mover para Sessão</Label>
                                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                                            {day.sessions.length} {day.sessions.length === 1 ? 'sessão disponível' : 'sessões disponíveis'}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                          Clique em uma sessão para mover esta tarefa
                                        </p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                          {day.sessions.map((sessionOption) => (
                                            <div
                                              key={sessionOption.id}
                                              onClick={() => moveTaskToSession(day.dayNumber, task.id, sessionOption.id)}
                                              className="p-2 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-slate-800 truncate">
                                                    {sessionOption.name || `Sessão ${sessionOption.order + 1}`}
                                                  </p>
                                                  {sessionOption.description && (
                                                    <p className="text-xs text-slate-600 truncate">
                                                      {sessionOption.description}
                                                    </p>
                                                  )}
                                                </div>
                                                <ArrowLeftIcon className="h-4 w-4 text-slate-500 flex-shrink-0 ml-2 rotate-180" />
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
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTask(day.dayNumber, session.id)}
                              className="w-full border-dashed !border-blue-300 !bg-white !text-blue-600 hover:!bg-blue-50 hover:!border-blue-400 hover:!text-blue-700"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Adicionar Tarefa à {session.name || 'Sessão'}
                            </Button>

                            {/* Vincular Tarefas Existentes */}
                            {day.tasks.length > 0 && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm font-medium text-blue-800">Vincular Tarefas Existentes</Label>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                      {day.tasks.length} {day.tasks.length === 1 ? 'tarefa disponível' : 'tarefas disponíveis'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-blue-600">
                                    Clique em uma tarefa direta para movê-la para esta sessão
                                  </p>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {day.tasks.map(task => (
                                      <div
                                        key={task.id}
                                        onClick={() => moveTaskToSession(day.dayNumber, task.id, session.id)}
                                        className="p-2 bg-white border border-blue-200 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">
                                              {task.title || 'Tarefa sem título'}
                                            </p>
                                            {task.description && (
                                              <p className="text-xs text-slate-600 truncate">
                                                {task.description}
                                              </p>
                                            )}
                                          </div>
                                          <ArrowLeftIcon className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2 rotate-180" />
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

                      {/* Tarefas Diretas do Dia (sem sessão) */}
                      {day.tasks.length > 0 && (
                        <div className="p-4 bg-white border border-slate-200 rounded-lg">
                          <h5 className="text-sm font-medium text-slate-700 mb-4">Tarefas Diretas</h5>
                          <div className="space-y-4">
                      {day.tasks.map(task => (
                        <div key={task.id} className="group">
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 hover:border-blue-300 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-3">
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateTask(day.dayNumber, task.id, 'title', e.target.value)}
                                  placeholder="Título da tarefa"
                                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                />
                                <Textarea
                                  value={task.description}
                                  onChange={(e) => updateTask(day.dayNumber, task.id, 'description', e.target.value)}
                                  placeholder="Descrição da tarefa (opcional)"
                                        className="min-h-[60px] border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTask(day.dayNumber, task.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>

                                  {/* Informações Adicionais */}
                                  <div className="border-t border-slate-200 pt-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <input
                                        type="checkbox"
                                        id={`hasMoreInfo-${task.id}`}
                                        checked={task.hasMoreInfo || false}
                                        onChange={(e) => updateTask(day.dayNumber, task.id, 'hasMoreInfo', e.target.checked)}
                                        className="rounded border-slate-300 bg-white text-blue-600 focus:ring-blue-500"
                                      />
                                      <Label htmlFor={`hasMoreInfo-${task.id}`} className="text-sm text-slate-800">
                                        Esta tarefa tem informações adicionais (vídeo, explicação ou produto)
                                      </Label>
                          </div>

                                    {task.hasMoreInfo && (
                                      <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label className="text-sm text-slate-800">Título do Modal (opcional)</Label>
                                            <Input
                                              value={task.modalTitle || ''}
                                              onChange={(e) => updateTask(day.dayNumber, task.id, 'modalTitle', e.target.value)}
                                              placeholder="Ex: Como fazer este exercício"
                                              className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                            />
                        </div>

                                          <div className="space-y-2">
                                            <Label className="text-sm text-slate-800">Texto do Botão (opcional)</Label>
                                            <Input
                                              value={task.modalButtonText || ''}
                                              onChange={(e) => updateTask(day.dayNumber, task.id, 'modalButtonText', e.target.value)}
                                              placeholder="Ex: Ver mais"
                                              className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                            />
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm text-slate-800">URL do Vídeo (opcional)</Label>
                                          <Input
                                            value={task.videoUrl || ''}
                                            onChange={(e) => updateTask(day.dayNumber, task.id, 'videoUrl', e.target.value)}
                                            placeholder="Ex: https://youtube.com/embed/..."
                                            className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm text-slate-800">Explicação Completa (opcional)</Label>
                                          <Textarea
                                            value={task.fullExplanation || ''}
                                            onChange={(e) => updateTask(day.dayNumber, task.id, 'fullExplanation', e.target.value)}
                                            placeholder="Explicação detalhada sobre como realizar esta tarefa..."
                                            className="min-h-[80px] border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-sm text-slate-800">Produto Relacionado (opcional)</Label>
                                          <Select 
                                            value={task.productId || 'none'} 
                                            onValueChange={(value) => updateTask(day.dayNumber, task.id, 'productId', value === 'none' ? '' : value)}
                                          >
                                            <SelectTrigger className="border-slate-300 bg-white text-slate-700">
                                              <SelectValue placeholder="Selecione um produto..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">Nenhum produto</SelectItem>
                                              {availableProducts.map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                  <div className="flex items-center gap-2">
                                                    <span>{product.name}</span>
                                                    {product.brand && (
                                                      <span className="text-xs text-slate-500">({product.brand})</span>
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

                                  {/* Mover para Sessão */}
                                  {day.sessions.length > 0 && (
                                    <div className="border-t border-slate-200 pt-4">
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <Label className="text-sm font-medium text-slate-800">Mover para Sessão</Label>
                                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 text-xs">
                                            {day.sessions.length} {day.sessions.length === 1 ? 'sessão disponível' : 'sessões disponíveis'}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-slate-600">
                                          Clique em uma sessão para mover esta tarefa
                                        </p>
                                        <div className="space-y-2 max-h-32 overflow-y-auto">
                                          {day.sessions.map((sessionOption) => (
                                            <div
                                              key={sessionOption.id}
                                              onClick={() => moveTaskToSession(day.dayNumber, task.id, sessionOption.id)}
                                              className="p-2 bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors"
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium text-slate-800 truncate">
                                                    {sessionOption.name || `Sessão ${sessionOption.order + 1}`}
                                                  </p>
                                                  {sessionOption.description && (
                                                    <p className="text-xs text-slate-600 truncate">
                                                      {sessionOption.description}
                                                    </p>
                                                  )}
                                                </div>
                                                <ArrowLeftIcon className="h-4 w-4 text-slate-500 flex-shrink-0 ml-2 rotate-180" />
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
                        className="w-full border-dashed !border-slate-300 !bg-white !text-slate-600 hover:!bg-slate-50 hover:!border-slate-400 hover:!text-slate-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Adicionar Tarefa Direta ao Dia {day.dayNumber}
                      </Button>
              </div>
            </div>
                ))}
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
} 