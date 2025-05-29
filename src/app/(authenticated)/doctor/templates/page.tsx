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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando templates...</span>
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
              Templates de Protocolos
            </h1>
            <p className="text-sm text-slate-600">
              Use templates pré-definidos para criar protocolos rapidamente
            </p>
          </div>
          
          <Button asChild variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            <Link href="/doctor/protocols/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              Criar do Zero
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Templates List */}
          <div className="lg:col-span-2">
            
            {/* Search */}
            <Card className="mb-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center">
                    <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-slate-800">
                      {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template disponível'}
                    </h3>
                    <p className="text-sm text-slate-600 mb-4">
                      {searchTerm 
                        ? 'Tente ajustar o termo de busca'
                        : 'Crie seu primeiro protocolo personalizado'
                      }
                    </p>
                    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/doctor/protocols/new">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Criar Protocolo
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredTemplates.map((template, index) => (
                  <Card 
                    key={isCustomTemplate(template) ? template.id : index}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate === template 
                        ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200' 
                        : 'bg-white/80 border-slate-200/50 backdrop-blur-sm hover:bg-slate-50/80'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-slate-800">{template.name}</h3>
                            {isCustomTemplate(template) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700 border border-purple-200">
                                Personalizado
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-3">
                            {template.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-3 w-3" />
                              <span>{template.duration} dias</span>
                            </div>
                            <span>
                              {template.days.reduce((acc, day) => acc + day.tasks.length, 0)} tarefas
                            </span>
                          </div>
                        </div>
                        
                        {selectedTemplate === template && (
                          <div className="ml-4">
                            <ArrowRightIcon className="h-5 w-5 text-blue-600" />
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
            <Card className="sticky top-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-slate-800">
                  {selectedTemplate ? 'Criar Protocolo' : 'Selecione um Template'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-slate-800">{selectedTemplate.name}</h4>
                      <p className="text-sm text-slate-600 mb-3">
                        {selectedTemplate.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="h-3 w-3" />
                          <span>{selectedTemplate.duration} dias</span>
                        </div>
                        <span>
                          {selectedTemplate.days.reduce((acc, day) => acc + day.tasks.length, 0)} tarefas
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-slate-800">
                        Nome do Novo Protocolo
                      </label>
                      <Input
                        placeholder="Ex: Protocolo Pós-Botox - João"
                        value={protocolName}
                        onChange={(e) => setProtocolName(e.target.value)}
                        className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                      />
                    </div>

                    <Button 
                      onClick={createFromTemplate}
                      disabled={isCreating || !protocolName.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isCreating ? 'Criando...' : 'Criar Protocolo'}
                    </Button>

                    {/* Preview of days */}
                    <div className="border-t border-slate-200 pt-4">
                      <h5 className="text-sm font-medium mb-2 text-slate-800">Prévia dos Dias</h5>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedTemplate.days.slice(0, 3).map((day) => (
                          <div key={day.dayNumber} className="text-xs">
                            <div className="font-medium text-slate-800">Dia {day.dayNumber}</div>
                            <div className="text-slate-600 ml-2">
                              {day.tasks.slice(0, 2).map((task, i) => (
                                <div key={i}>• {task.title}</div>
                              ))}
                              {day.tasks.length > 2 && (
                                <div>• +{day.tasks.length - 2} mais...</div>
                              )}
                            </div>
                          </div>
                        ))}
                        {selectedTemplate.days.length > 3 && (
                          <div className="text-xs text-slate-500">
                            +{selectedTemplate.days.length - 3} dias restantes...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600">
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
  );
} 