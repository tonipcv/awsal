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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando protocolos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800">
              Protocolos
            </h1>
            <p className="text-sm text-slate-600">
              Gerencie seus protocolos e templates
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              asChild
              variant="outline"
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            >
              <Link href="/doctor/templates">
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Templates
              </Link>
            </Button>
            <Button 
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/doctor/protocols/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Protocolo
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar protocolos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={filter === 'all' 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }
                >
                  Todos
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('active')}
                  className={filter === 'active' 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }
                >
                  Ativos
                </Button>
                <Button
                  variant={filter === 'templates' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('templates')}
                  className={filter === 'templates' 
                    ? "bg-blue-600 hover:bg-blue-700 text-white" 
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
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
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">
                <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-800">
                  {searchTerm ? 'Nenhum protocolo encontrado' : 'Nenhum protocolo criado'}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {searchTerm 
                    ? 'Tente ajustar os filtros ou termo de busca'
                    : 'Comece criando seu primeiro protocolo ou usando um template'
                  }
                </p>
                {!searchTerm && (
                  <div className="flex gap-2 justify-center">
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/doctor/protocols/new">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Criar Protocolo
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
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
          <div className="grid gap-4">
            {filteredProtocols.map((protocol) => {
              const activeAssignments = getActiveAssignments(protocol);
              
              return (
                <Card key={protocol.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm hover:bg-slate-50/80 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-slate-800">{protocol.name}</h3>
                          {protocol.isTemplate && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700 border border-purple-200">
                              Template
                            </span>
                          )}
                          {activeAssignments > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700 border border-blue-200">
                              {activeAssignments} ativo{activeAssignments > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        {protocol.description && (
                          <p className="text-sm text-slate-600 mb-3">
                            {protocol.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <CalendarDaysIcon className="h-3 w-3" />
                            <span>{protocol.duration} dias</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UsersIcon className="h-3 w-3" />
                            <span>{protocol.assignments.length} atribuição{protocol.assignments.length !== 1 ? 'ões' : ''}</span>
                          </div>
                          <span>
                            Criado em {format(new Date(protocol.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Link href={`/doctor/protocols/${protocol.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Link href={`/doctor/protocols/${protocol.id}/edit`}>
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProtocol(protocol.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
  );
} 