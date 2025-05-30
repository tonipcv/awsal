'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProtocolTask {
  id: string;
  title: string;
  description: string;
  order: number;
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  tasks: ProtocolTask[];
}

interface ProtocolForm {
  name: string;
  duration: number;
  description: string;
  isTemplate: boolean;
  days: ProtocolDay[];
}

export default function NewProtocolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [protocol, setProtocol] = useState<ProtocolForm>({
    name: '',
    duration: 7,
    description: '',
    isTemplate: false,
    days: []
  });

  // Gerar dias automaticamente quando a duração muda
  React.useEffect(() => {
    const newDays: ProtocolDay[] = [];
    for (let i = 1; i <= protocol.duration; i++) {
      const existingDay = protocol.days.find(d => d.dayNumber === i);
      if (existingDay) {
        newDays.push(existingDay);
      } else {
        newDays.push({
          id: `day-${i}`,
          dayNumber: i,
          tasks: []
        });
      }
    }
    setProtocol(prev => ({ ...prev, days: newDays }));
  }, [protocol.duration]);

  const addTask = (dayNumber: number) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              tasks: [
                ...day.tasks,
                {
                  id: `task-${Date.now()}`,
                  title: '',
                  description: '',
                  order: day.tasks.length
                }
              ]
            }
          : day
      )
    }));
  };

  const removeTask = (dayNumber: number, taskId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              tasks: day.tasks.filter(task => task.id !== taskId)
            }
          : day
      )
    }));
  };

  const updateTask = (dayNumber: number, taskId: string, field: keyof ProtocolTask, value: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              tasks: day.tasks.map(task => 
                task.id === taskId 
                  ? { ...task, [field]: value }
                  : task
              )
            }
          : day
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

      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: protocol.name,
          duration: protocol.duration,
          description: protocol.description,
          isTemplate: protocol.isTemplate,
          days: protocol.days.map(day => ({
            dayNumber: day.dayNumber,
            tasks: day.tasks.filter(task => task.title.trim()).map((task, index) => ({
              title: task.title,
              description: task.description,
              order: index
            }))
          })).filter(day => day.tasks.length > 0)
        })
      });

      if (response.ok) {
        const newProtocol = await response.json();
        router.push(`/doctor/protocols/${newProtocol.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar protocolo');
      }
    } catch (error) {
      console.error('Error creating protocol:', error);
      alert('Erro ao criar protocolo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6 lg:pl-72 lg:pl-72">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900">
            <Link href="/doctor/protocols">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-light text-slate-800">
              Novo Protocolo
            </h1>
            <p className="text-sm text-slate-600">
              Crie um protocolo personalizado para seus pacientes
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Protocol Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 bg-white/80 border-slate-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-slate-800">Informações do Protocolo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-slate-800">Nome do Protocolo</Label>
                  <Input
                    id="name"
                    value={protocol.name}
                    onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pós-Preenchimento Facial"
                    className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>

                <div>
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

                <div>
                  <Label htmlFor="description" className="text-slate-800">Descrição</Label>
                  <Textarea
                    id="description"
                    value={protocol.description}
                    onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o objetivo e características do protocolo..."
                    rows={3}
                    className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isTemplate"
                    checked={protocol.isTemplate}
                    onChange={(e) => setProtocol(prev => ({ ...prev, isTemplate: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="isTemplate" className="text-sm text-slate-800">
                    Salvar como template
                  </Label>
                </div>

                <Button 
                  onClick={saveProtocol} 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Protocolo'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Protocol Days */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {protocol.days.map((day) => (
                <Card key={day.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-normal text-slate-800">
                      Dia {day.dayNumber}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {day.tasks.map((task) => (
                        <div key={task.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Título da tarefa"
                                value={task.title}
                                onChange={(e) => updateTask(day.dayNumber, task.id, 'title', e.target.value)}
                                className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                              />
                              <Textarea
                                placeholder="Descrição (opcional)"
                                value={task.description}
                                onChange={(e) => updateTask(day.dayNumber, task.id, 'description', e.target.value)}
                                rows={2}
                                className="border-slate-300 bg-white text-slate-700 placeholder:text-slate-500"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTask(day.dayNumber, task.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTask(day.dayNumber)}
                        className="w-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Adicionar Tarefa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 