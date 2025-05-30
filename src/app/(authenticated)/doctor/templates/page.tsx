'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DocumentTextIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProtocolTemplate {
  name: string;
  duration: number;
  description: string;
  days: Array<{
    dayNumber: number;
    tasks: Array<{
      title: string;
      description?: string;
    }>;
  }>;
}

interface CustomTemplate {
  id: string;
  name: string;
  duration: number;
  description?: string;
  createdAt: Date;
  days: Array<{
    dayNumber: number;
    tasks: Array<{
      title: string;
      description?: string;
    }>;
  }>;
}

interface TemplatesResponse {
  predefined: ProtocolTemplate[];
  custom: CustomTemplate[];
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<TemplatesResponse>({ predefined: [], custom: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ProtocolTemplate | CustomTemplate | null>(null);
  const [protocolName, setProtocolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protocols/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createFromTemplate = async () => {
    if (!selectedTemplate || !protocolName.trim()) {
      alert('Selecione um template e informe o nome do protocolo');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/protocols/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateName: selectedTemplate.name,
          protocolName: protocolName.trim()
        })
      });

      if (response.ok) {
        const newProtocol = await response.json();
        // Redirecionar para o protocolo criado
        window.location.href = `/doctor/protocols/${newProtocol.id}`;
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar protocolo');
      }
    } catch (error) {
      console.error('Error creating protocol from template:', error);
      alert('Erro ao criar protocolo');
    } finally {
      setIsCreating(false);
    }
  };

  const allTemplates = [...templates.predefined, ...templates.custom];
  const filteredTemplates = allTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCustomTemplate = (template: ProtocolTemplate | CustomTemplate): template is CustomTemplate => {
    return 'id' in template;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5154e7] mb-4"></div>
          <span className="text-xs text-gray-600 font-medium">Carregando templates...</span>
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
                Templates de Protocolos
              </h1>
              <p className="text-gray-600 mt-2 font-medium">
                Use templates pré-definidos para criar protocolos rapidamente
              </p>
            </div>
            
            <Button asChild variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-4 font-semibold">
              <Link href="/doctor/protocols/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar do Zero
              </Link>
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Templates List */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Search */}
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Templates Grid */}
              {filteredTemplates.length === 0 ? (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-gray-900">
                        {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
                      </h3>
                      <p className="text-gray-600 mb-8 font-medium">
                        {searchTerm 
                          ? 'Tente ajustar o termo de busca'
                          : 'Crie seu primeiro protocolo personalizado'
                        }
                      </p>
                      <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold">
                        <Link href="/doctor/protocols/new">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Criar Protocolo
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.map((template, index) => (
                    <Card 
                      key={isCustomTemplate(template) ? template.id : index}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedTemplate === template 
                          ? 'ring-2 ring-[#5154e7] bg-[#5154e7]/5 border-[#5154e7] shadow-lg' 
                          : 'bg-white border-gray-200 shadow-lg hover:shadow-xl'
                      } rounded-2xl`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                              {isCustomTemplate(template) && (
                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm bg-[#5154e7] text-white font-semibold">
                                  Personalizado
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-4 font-medium">
                              {template.description}
                            </p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span className="font-medium">{template.duration} dias</span>
                              </div>
                              <span className="font-medium">
                                {template.days.reduce((acc, day) => acc + day.tasks.length, 0)} tarefas
                              </span>
                            </div>
                          </div>
                          
                          {selectedTemplate === template && (
                            <div className="ml-6">
                              <ArrowRightIcon className="h-5 w-5 text-[#5154e7]" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Template Preview & Creation */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    {selectedTemplate ? 'Criar Protocolo' : 'Selecione um Template'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedTemplate ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-bold mb-3 text-gray-900">{selectedTemplate.name}</h4>
                        <p className="text-gray-600 mb-4 font-medium">
                          {selectedTemplate.description}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span className="font-medium">{selectedTemplate.duration} dias</span>
                          </div>
                          <span className="font-medium">
                            {selectedTemplate.days.reduce((acc, day) => acc + day.tasks.length, 0)} tarefas
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-3 block text-gray-900">
                          Nome do Novo Protocolo
                        </label>
                        <Input
                          placeholder="Ex: Protocolo Pós-Botox - João"
                          value={protocolName}
                          onChange={(e) => setProtocolName(e.target.value)}
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                        />
                      </div>

                      <Button 
                        onClick={createFromTemplate}
                        disabled={isCreating || !protocolName.trim()}
                        className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold"
                      >
                        {isCreating ? 'Criando...' : 'Criar Protocolo'}
                      </Button>

                      {/* Preview of days */}
                      <div className="border-t border-gray-200 pt-6">
                        <h5 className="text-sm font-bold mb-4 text-gray-900">Prévia dos Dias</h5>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {selectedTemplate.days.slice(0, 3).map((day) => (
                            <div key={day.dayNumber} className="text-sm">
                              <div className="font-bold text-gray-900 mb-1">Dia {day.dayNumber}</div>
                              <div className="text-gray-600 ml-3 space-y-1">
                                {day.tasks.slice(0, 2).map((task, i) => (
                                  <div key={i} className="font-medium">• {task.title}</div>
                                ))}
                                {day.tasks.length > 2 && (
                                  <div className="font-medium">• +{day.tasks.length - 2} mais...</div>
                                )}
                              </div>
                            </div>
                          ))}
                          {selectedTemplate.days.length > 3 && (
                            <div className="text-sm text-gray-500 font-medium">
                              +{selectedTemplate.days.length - 3} dias restantes...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium">
                        Selecione um template para ver os detalhes e criar um protocolo
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 