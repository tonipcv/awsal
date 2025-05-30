'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  createdAt: Date;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
    isActive: boolean;
  }>;
}

export default function ProtocolsPage() {
  const { data: session } = useSession();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'templates'>('all');

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protocols');
      if (response.ok) {
        const data = await response.json();
        setProtocols(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading protocols:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProtocol = async (protocolId: string) => {
    if (!confirm('Tem certeza que deseja excluir este protocolo?')) return;

    try {
      const response = await fetch(`/api/protocols/${protocolId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProtocols(protocols.filter(p => p.id !== protocolId));
      } else {
        alert('Erro ao excluir protocolo');
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
      alert('Erro ao excluir protocolo');
    }
  };

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'templates' && protocol.isTemplate) ||
                         (filter === 'active' && !protocol.isTemplate && protocol.assignments.some(a => a.isActive));

    return matchesSearch && matchesFilter;
  });

  const getActiveAssignments = (protocol: Protocol) => {
    return protocol.assignments.filter(a => a.isActive).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5154e7] mb-4"></div>
          <span className="text-xs text-gray-600 font-medium">Carregando protocolos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
        
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Protocolos
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Gerencie seus protocolos e templates
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                asChild
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-4 font-semibold"
              >
                <Link href="/doctor/templates">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Templates
                </Link>
              </Button>
              <Button 
                asChild
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-4 font-semibold"
              >
                <Link href="/doctor/protocols/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Protocolo
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar protocolos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={filter === 'all' 
                      ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                    }
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                    className={filter === 'active' 
                      ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                    }
                  >
                    Ativos
                  </Button>
                  <Button
                    variant={filter === 'templates' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('templates')}
                    className={filter === 'templates' 
                      ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold" 
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-4 font-semibold"
                    }
                  >
                    Templates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Protocols List */}
          {filteredProtocols.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {searchTerm ? 'Nenhum protocolo encontrado' : 'Nenhum protocolo criado'}
                  </h3>
                  <p className="text-gray-600 mb-8 font-medium">
                    {searchTerm 
                      ? 'Tente ajustar os filtros ou termo de busca'
                      : 'Comece criando seu primeiro protocolo ou usando um template'
                    }
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3 justify-center">
                      <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
                        <Link href="/doctor/protocols/new">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Criar Protocolo
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-6 font-semibold">
                        <Link href="/doctor/templates">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          Ver Templates
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredProtocols.map((protocol) => {
                const activeAssignments = getActiveAssignments(protocol);
                
                return (
                  <Card key={protocol.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">{protocol.name}</h3>
                            {protocol.isTemplate && (
                              <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm bg-[#5154e7] text-white font-semibold">
                                Template
                              </span>
                            )}
                            {activeAssignments > 0 && (
                              <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm bg-teal-100 text-teal-700 border border-teal-200 font-semibold">
                                {activeAssignments} ativo{activeAssignments > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          {protocol.description && (
                            <p className="text-gray-600 mb-4 font-medium">
                              {protocol.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarDaysIcon className="h-4 w-4" />
                              <span className="font-medium">{protocol.duration} dias</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UsersIcon className="h-4 w-4" />
                              <span className="font-medium">{protocol.assignments.length} atribuição{protocol.assignments.length !== 1 ? 'ões' : ''}</span>
                            </div>
                            <span className="font-medium">
                              Criado em {format(new Date(protocol.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl h-10 w-10 p-0"
                          >
                            <Link href={`/doctor/protocols/${protocol.id}`}>
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl h-10 w-10 p-0"
                          >
                            <Link href={`/doctor/protocols/${protocol.id}/edit`}>
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProtocol(protocol.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 w-10 p-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 