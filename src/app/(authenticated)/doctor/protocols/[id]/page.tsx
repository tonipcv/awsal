'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  PencilIcon,
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ShoppingBagIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProtocolTask {
  id: string;
  title: string;
  description?: string;
  order: number;
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  tasks: ProtocolTask[];
}

interface Assignment {
  id: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
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
  purchaseUrl?: string;
}

interface ProtocolProduct {
  id: string;
  productId: string;
  order: number;
  isRequired: boolean;
  notes?: string;
  product: Product;
}

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  createdAt: Date;
  days: ProtocolDay[];
  assignments: Assignment[];
  products?: ProtocolProduct[];
  doctor: {
    id: string;
    name?: string;
    email?: string;
  };
}

export default function ProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadProtocol(params.id as string);
    }
  }, [params.id]);

  const loadProtocol = async (protocolId: string) => {
    try {
      setIsLoading(true);
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
          ...data,
          products: protocolProducts
        });
      } else {
        router.push('/doctor/protocols');
      }
    } catch (error) {
      console.error('Error loading protocol:', error);
      router.push('/doctor/protocols');
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveAssignments = () => {
    return protocol?.assignments.filter(a => a.isActive) || [];
  };

  const getPatientInitials = (name?: string) => {
    if (!name) return 'P';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatPrice = (price?: number) => {
    if (!price) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando protocolo...</span>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-slate-800 mb-2">Protocolo não encontrado</h2>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/doctor/protocols">Voltar aos protocolos</Link>
          </Button>
        </div>
      </div>
    );
  }

  const activeAssignments = getActiveAssignments();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6 lg:pl-72">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            <Link href="/doctor/protocols">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-light text-slate-800">
                {protocol.name}
              </h1>
              {protocol.isTemplate && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 border border-blue-200">
                  Template
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              {protocol.description || 'Sem descrição'}
            </p>
          </div>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href={`/doctor/protocols/${protocol.id}/edit`}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Protocol Info */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Stats */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-slate-800">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Duração</p>
                    <p className="text-sm font-medium text-slate-800">{protocol.duration} dias</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UsersIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Pacientes Ativos</p>
                    <p className="text-sm font-medium text-slate-800">{activeAssignments.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircleIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Total de Tarefas</p>
                    <p className="text-sm font-medium text-slate-800">
                      {protocol.days.reduce((acc, day) => acc + day.tasks.length, 0)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Criado em {format(new Date(protocol.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Protocol Products */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-slate-800 flex items-center gap-2">
                  <ShoppingBagIcon className="h-4 w-4" />
                  Produtos Recomendados
                  {protocol.products && protocol.products.length > 0 && (
                    <Badge variant="secondary" className="text-xs ml-auto bg-blue-100 text-blue-700 border-blue-200">
                      {protocol.products.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!protocol.products || protocol.products.length === 0 ? (
                  <div className="text-center py-4">
                    <ShoppingBagIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      Nenhum produto configurado
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {protocol.products
                      .sort((a, b) => a.order - b.order)
                      .map((protocolProduct) => (
                        <div key={protocolProduct.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-start gap-3">
                            {/* Product Image */}
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {protocolProduct.product.imageUrl ? (
                                <img 
                                  src={protocolProduct.product.imageUrl} 
                                  alt={protocolProduct.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ShoppingBagIcon className="h-4 w-4 text-slate-400" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-slate-800 truncate">
                                    {protocolProduct.product.name}
                                  </h4>
                                  {protocolProduct.product.brand && (
                                    <p className="text-xs text-blue-600">{protocolProduct.product.brand}</p>
                                  )}
                                </div>
                                
                                {/* Price and Required Badge */}
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  {(protocolProduct.product.originalPrice || protocolProduct.product.discountPrice) && (
                                    <div className="text-right">
                                      {protocolProduct.product.discountPrice && protocolProduct.product.originalPrice ? (
                                        <>
                                          <div className="text-xs font-medium text-blue-600">
                                            {formatPrice(protocolProduct.product.discountPrice)}
                                          </div>
                                          <div className="text-xs text-slate-400 line-through">
                                            {formatPrice(protocolProduct.product.originalPrice)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-xs font-medium text-slate-800">
                                          {formatPrice(protocolProduct.product.originalPrice || protocolProduct.product.discountPrice)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {protocolProduct.isRequired && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0 bg-red-100 text-red-700 border-red-200">
                                      Obrigatório
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Notes */}
                              {protocolProduct.notes && (
                                <p className="text-xs text-slate-600 mt-2">{protocolProduct.notes}</p>
                              )}

                              {/* Purchase Link */}
                              {protocolProduct.product.purchaseUrl && (
                                <div className="mt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 text-xs border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                    asChild
                                  >
                                    <a 
                                      href={protocolProduct.product.purchaseUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <LinkIcon className="h-3 w-3 mr-1" />
                                      Comprar
                                    </a>
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assigned Patients */}
            <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-normal text-slate-800">Pacientes Ativos</CardTitle>
                <Button size="sm" variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                  <Link href={`/doctor/protocols/${protocol.id}/assign`}>
                    <UserPlusIcon className="h-3 w-3 mr-1" />
                    Atribuir
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {activeAssignments.length === 0 ? (
                  <div className="text-center py-4">
                    <UsersIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      Nenhum paciente ativo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                          {getPatientInitials(assignment.user.name)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{assignment.user.name || 'Sem nome'}</p>
                          <p className="text-xs text-slate-500">
                            Iniciado em {format(new Date(assignment.startDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Protocol Days */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {protocol.days.length === 0 ? (
                <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <CalendarDaysIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-800 mb-2">Nenhum dia configurado</h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Este protocolo ainda não possui dias ou tarefas configuradas.
                      </p>
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/doctor/protocols/${protocol.id}/edit`}>
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Editar Protocolo
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                protocol.days
                  .sort((a, b) => a.dayNumber - b.dayNumber)
                  .map((day) => (
                    <Card key={day.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-normal text-blue-600">
                          Dia {day.dayNumber}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {day.tasks.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-4">
                            Nenhuma tarefa configurada para este dia
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {day.tasks
                              .sort((a, b) => a.order - b.order)
                              .map((task) => (
                                <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  <h4 className="text-sm font-medium text-slate-800 mb-1">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-xs text-slate-600">{task.description}</p>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 