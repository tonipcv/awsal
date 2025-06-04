'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  PlayIcon,
  ShoppingBagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// Hook personalizado para debounce
function createDebounce<T extends (...args: any[]) => void>(callback: T, delay: number): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFn;
}

interface ProtocolDayEditorProps {
  days: any[];
  availableProducts: any[];
  addTask: (dayNumber: number, sessionId?: string) => void;
  removeTask: (dayNumber: number, taskId: string, sessionId?: string) => void;
  updateTask: (dayNumber: number, taskId: string, field: string, value: any, sessionId?: string) => void;
  addSession: (dayNumber: number) => void;
  removeSession: (dayNumber: number, sessionId: string) => void;
  updateSession: (dayNumber: number, sessionId: string, field: string, value: string) => void;
  moveTaskToSession: (dayNumber: number, taskId: string, targetSessionId: string) => void;
  moveTaskFromSession: (dayNumber: number, taskId: string, sourceSessionId: string) => void;
  addDay: () => void;
  removeDay: (dayNumber: number) => void;
}

export function ProtocolDayEditor({
  days,
  availableProducts,
  addTask,
  removeTask,
  updateTask,
  addSession,
  removeSession,
  updateSession,
  moveTaskToSession,
  moveTaskFromSession,
  addDay,
  removeDay
}: ProtocolDayEditorProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleDay = (dayId: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayId)) {
      newExpanded.delete(dayId);
    } else {
      newExpanded.add(dayId);
    }
    setExpandedDays(newExpanded);
  };

  const toggleSession = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const TaskEditor = React.memo(({ task, dayNumber, sessionId }: { task: any, dayNumber: number, sessionId?: string }) => {
    // Estados locais para os inputs de texto
    const [localTitle, setLocalTitle] = useState(task.title || '');
    const [localDescription, setLocalDescription] = useState(task.description || '');
    
    // Refs para evitar re-criação das funções debounced
    const debouncedUpdateTitleRef = useRef<((value: string) => void) & { cancel: () => void } | null>(null);
    const debouncedUpdateDescriptionRef = useRef<((value: string) => void) & { cancel: () => void } | null>(null);
    
    // Criar funções debounced apenas uma vez
    useEffect(() => {
      // Cleanup previous debounced functions
      if (debouncedUpdateTitleRef.current) {
        debouncedUpdateTitleRef.current.cancel();
      }
      if (debouncedUpdateDescriptionRef.current) {
        debouncedUpdateDescriptionRef.current.cancel();
      }

      debouncedUpdateTitleRef.current = createDebounce((value: string) => {
        updateTask(dayNumber, task.id, 'title', value, sessionId);
      }, 500);
      
      debouncedUpdateDescriptionRef.current = createDebounce((value: string) => {
        updateTask(dayNumber, task.id, 'description', value, sessionId);
      }, 500);

      // Cleanup on unmount
      return () => {
        if (debouncedUpdateTitleRef.current) {
          debouncedUpdateTitleRef.current.cancel();
        }
        if (debouncedUpdateDescriptionRef.current) {
          debouncedUpdateDescriptionRef.current.cancel();
        }
      };
    }, [dayNumber, task.id, sessionId, updateTask]);
    
    // Atualizar estados locais apenas quando a task mudar externamente
    useEffect(() => {
      setLocalTitle(task.title || '');
      setLocalDescription(task.description || '');
    }, [task.title, task.description]);
    
    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalTitle(value);
      if (debouncedUpdateTitleRef.current) {
        debouncedUpdateTitleRef.current(value);
      }
    }, []);
    
    const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setLocalDescription(value);
      if (debouncedUpdateDescriptionRef.current) {
        debouncedUpdateDescriptionRef.current(value);
      }
    }, []);

    const isExpanded = expandedTasks.has(task.id);

    return (
      <div className="border border-gray-200 rounded-xl bg-gray-50">
        {/* Header sempre visível */}
        <div className="p-4 bg-gray-100 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {localTitle || 'Tarefa sem título'}
                </p>
                {localDescription && (
                  <p className="text-sm text-gray-600 truncate">
                    {localDescription}
                  </p>
                )}
              </div>
              {task.hasMoreInfo && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  Conteúdo Extra
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleTask(task.id)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl h-8 w-8 p-0 flex items-center justify-center transition-colors"
              >
                <ChevronDownIcon 
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              <button
                onClick={() => removeTask(dayNumber, task.id, sessionId)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0 flex items-center justify-center transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Campos Básicos sempre visíveis */}
        <div className="p-4 space-y-3 bg-white">
          <Input
            placeholder="Título da tarefa"
            value={localTitle}
            onChange={handleTitleChange}
            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-semibold"
          />
          <Textarea
            placeholder="Descrição básica"
            value={localDescription}
            onChange={handleDescriptionChange}
            rows={2}
            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
          />
        </div>

        {/* Campos extras - visibilidade controlada por estado */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-200 bg-white rounded-b-xl">
            {/* Toggle para Conteúdo Extra */}
            <div className="flex items-center space-x-3 pt-4">
              <input
                type="checkbox"
                id={`hasMoreInfo-${task.id}`}
                checked={task.hasMoreInfo || false}
                onChange={(e) => updateTask(dayNumber, task.id, 'hasMoreInfo', e.target.checked, sessionId)}
                className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
              />
              <Label htmlFor={`hasMoreInfo-${task.id}`} className="text-gray-700 font-medium flex items-center gap-2">
                <InformationCircleIcon className="h-4 w-4" />
                Adicionar conteúdo extra
              </Label>
            </div>

            {/* Campos Extras */}
            {task.hasMoreInfo && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                      <PlayIcon className="h-4 w-4" />
                      URL do Vídeo
                    </Label>
                    <Input
                      placeholder="https://youtube.com/watch?v=..."
                      value={task.videoUrl || ''}
                      onChange={(e) => updateTask(dayNumber, task.id, 'videoUrl', e.target.value, sessionId)}
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
                      onChange={(e) => updateTask(dayNumber, task.id, 'fullExplanation', e.target.value, sessionId)}
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
                      onValueChange={(value) => updateTask(dayNumber, task.id, 'productId', value === 'none' ? '' : value, sessionId)}
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold">Título do Modal</Label>
                      <Input
                        placeholder="Título personalizado"
                        value={task.modalTitle || ''}
                        onChange={(e) => updateTask(dayNumber, task.id, 'modalTitle', e.target.value, sessionId)}
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-900 font-semibold">Texto do Botão</Label>
                      <Input
                        placeholder="Saber mais"
                        value={task.modalButtonText || ''}
                        onChange={(e) => updateTask(dayNumber, task.id, 'modalButtonText', e.target.value, sessionId)}
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-900 font-semibold">Link do Botão</Label>
                    <Input
                      placeholder="https://exemplo.com"
                      value={task.modalButtonUrl || ''}
                      onChange={(e) => updateTask(dayNumber, task.id, 'modalButtonUrl', e.target.value, sessionId)}
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  const SessionEditor = ({ session, dayNumber }: { session: any, dayNumber: number }) => {
    // Estados locais para os inputs de texto
    const [localName, setLocalName] = useState(session.name);
    const [localDescription, setLocalDescription] = useState(session.description || '');
    
    // Refs para as funções debounced
    const debouncedUpdateNameRef = useRef<((value: string) => void) & { cancel: () => void } | null>(null);
    const debouncedUpdateDescriptionRef = useRef<((value: string) => void) & { cancel: () => void } | null>(null);
    
    // Criar funções debounced com cleanup
    useEffect(() => {
      // Cleanup previous debounced functions
      if (debouncedUpdateNameRef.current) {
        debouncedUpdateNameRef.current.cancel();
      }
      if (debouncedUpdateDescriptionRef.current) {
        debouncedUpdateDescriptionRef.current.cancel();
      }

      debouncedUpdateNameRef.current = createDebounce((value: string) => {
        updateSession(dayNumber, session.id, 'name', value);
      }, 300);
      
      debouncedUpdateDescriptionRef.current = createDebounce((value: string) => {
        updateSession(dayNumber, session.id, 'description', value);
      }, 300);

      // Cleanup on unmount
      return () => {
        if (debouncedUpdateNameRef.current) {
          debouncedUpdateNameRef.current.cancel();
        }
        if (debouncedUpdateDescriptionRef.current) {
          debouncedUpdateDescriptionRef.current.cancel();
        }
      };
    }, [dayNumber, session.id, updateSession]);
    
    // Atualizar estados locais quando a session mudar
    useEffect(() => {
      setLocalName(session.name);
      setLocalDescription(session.description || '');
    }, [session.name, session.description]);
    
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalName(value);
      if (debouncedUpdateNameRef.current) {
        debouncedUpdateNameRef.current(value);
      }
    }, []);
    
    const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalDescription(value);
      if (debouncedUpdateDescriptionRef.current) {
        debouncedUpdateDescriptionRef.current(value);
      }
    }, []);

    const isExpanded = expandedSessions.has(session.id);

    return (
      <div className="border border-gray-200 rounded-xl bg-white">
        {/* Header sempre visível */}
        <div className="p-4 bg-gray-50 rounded-t-xl border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {localName || `Sessão ${session.order + 1}`}
                </p>
                {localDescription && (
                  <p className="text-sm text-gray-600 truncate">
                    {localDescription}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {session.tasks.length} tarefas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSession(session.id)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl h-8 w-8 p-0 flex items-center justify-center transition-colors"
              >
                <ChevronDownIcon 
                  className={`h-4 w-4 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              <button
                onClick={() => removeSession(dayNumber, session.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0 flex items-center justify-center transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Campos básicos sempre visíveis */}
        <div className="p-4 space-y-3 bg-white">
          <Input
            value={localName}
            onChange={handleNameChange}
            placeholder="Nome da sessão"
            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 font-semibold rounded-xl h-10"
          />
          <Input
            value={localDescription}
            onChange={handleDescriptionChange}
            placeholder="Descrição da sessão (opcional)"
            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-600 rounded-xl h-10"
          />
        </div>

        {/* Tarefas - visibilidade controlada por estado */}
        {isExpanded && (
          <div className="p-4 space-y-4 border-t border-gray-200 bg-white rounded-b-xl">
            {/* Tarefas da Sessão */}
            <div className="space-y-4">
              {session.tasks.map((task: any) => (
                <TaskEditor 
                  key={task.id} 
                  task={task} 
                  dayNumber={dayNumber} 
                  sessionId={session.id} 
                />
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addTask(dayNumber, session.id)}
                className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 rounded-xl h-10 font-semibold"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Tarefa
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com botão para adicionar dia */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Cronograma do Protocolo</h3>
          <p className="text-sm text-gray-600 mt-1">
            {days.length} {days.length === 1 ? 'dia configurado' : 'dias configurados'}
          </p>
        </div>
        <Button
          onClick={addDay}
          className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Dia
        </Button>
      </div>

      {days.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Nenhum dia configurado</h4>
              <p className="text-gray-600 mt-1">
                Comece adicionando o primeiro dia do seu protocolo
              </p>
            </div>
            <Button
              onClick={addDay}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar Primeiro Dia
            </Button>
          </div>
        </div>
      )}

      {days.map((day) => {
        const isDayExpanded = expandedDays.has(day.id);
        
        return (
          <div key={day.id}>
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader 
                className="pb-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleDay(day.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ChevronDownIcon 
                      className={`h-5 w-5 text-gray-500 transition-transform ${
                        isDayExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Dia {day.dayNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {day.sessions.length} sessões • {day.sessions.reduce((total: number, session: any) => total + session.tasks.length, 0) + day.tasks.length} tarefas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-[#5154e7] text-white">
                      {day.sessions.length + (day.tasks.length > 0 ? 1 : 0)} seções
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addSession(day.dayNumber);
                      }}
                      className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-8 px-3 font-semibold"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Sessão
                    </Button>
                    {days.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDay(day.dayNumber);
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isDayExpanded && (
                <CardContent className="space-y-6">
                  {/* Sessões */}
                  {day.sessions.map((session: any) => (
                    <SessionEditor 
                      key={session.id} 
                      session={session} 
                      dayNumber={day.dayNumber} 
                    />
                  ))}

                  {/* Tarefas Diretas */}
                  {day.tasks.length > 0 && (
                    <div className="p-4 bg-white border border-gray-200 rounded-xl">
                      <h5 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          Tarefas Diretas
                        </Badge>
                      </h5>
                      <div className="space-y-4">
                        {day.tasks.map((task: any) => (
                          <TaskEditor 
                            key={task.id} 
                            task={task} 
                            dayNumber={day.dayNumber} 
                          />
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
                </CardContent>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
} 