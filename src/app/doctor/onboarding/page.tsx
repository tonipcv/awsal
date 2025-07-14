"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { 
  ArrowRightIcon, 
  PlusIcon,
  TrashIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const COVER_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop',
    title: 'Abstract Waves'
  },
  {
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2000&auto=format&fit=crop',
    title: 'Gradient Flow'
  },
  {
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=2000&auto=format&fit=crop',
    title: 'Smooth Lines'
  },
  {
    url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2000&auto=format&fit=crop',
    title: 'Dynamic Shapes'
  },
  {
    url: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?q=80&w=2000&auto=format&fit=crop',
    title: 'Fluid Motion'
  },
];

interface Session {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'video' | 'document';
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [protocol, setProtocol] = useState({
    name: '',
    description: '',
    coverImage: COVER_IMAGES[0].url,
    sessions: [] as Session[]
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddSession = () => {
    const newSession: Session = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      tasks: []
    };
    setProtocol(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession]
    }));
  };

  const handleRemoveSession = (sessionId: string) => {
    setProtocol(prev => ({
      ...prev,
      sessions: prev.sessions.filter(s => s.id !== sessionId)
    }));
  };

  const handleAddTask = (sessionId: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      type: 'task'
    };
    setProtocol(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            tasks: [...session.tasks, newTask]
          };
        }
        return session;
      })
    }));
  };

  const handleRemoveTask = (sessionId: string, taskId: string) => {
    setProtocol(prev => ({
      ...prev,
      sessions: prev.sessions.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            tasks: session.tasks.filter(task => task.id !== taskId)
          };
        }
        return session;
      })
    }));
  };

  const handleCreateProtocol = async () => {
    try {
      setIsLoading(true);
      
      // Transformar sessions para o formato esperado pela API
      const days = protocol.sessions.map((session, index) => ({
        dayNumber: index + 1,
        title: session.title || `Dia ${index + 1}`,
        sessions: [{
          sessionNumber: 1,
          title: session.title || 'Sessão Principal',
          description: session.description || '',
          tasks: session.tasks.map((task, taskIndex) => ({
            title: task.title,
            description: task.description || '',
            type: task.type,
            orderIndex: taskIndex
          }))
        }]
      }));

      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: protocol.name,
          description: protocol.description,
          coverImage: protocol.coverImage,
          days: days
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar protocolo');
      }

      const result = await response.json();
      console.log('Protocolo criado com sucesso:', result);
      
      // Redirecionar para o dashboard
      router.push('/doctor/dashboard');
    } catch (error) {
      console.error('Failed to create protocol:', error);
      alert('Erro ao criar protocolo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Logo */}
      <div className="flex justify-center py-8">
        <Image
          src="/logo.png"
          alt="Logo"
          width={180}
          height={40}
          className="h-10 w-auto"
          priority
        />
      </div>

      <div className="max-w-xl mx-auto px-4 pb-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className={`h-2 w-24 rounded-full transition-colors ${
              step === 1 ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`h-2 w-24 rounded-full transition-colors ${
              step === 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          </div>
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>Basic Info</span>
            <span>Sessions & Tasks</span>
          </div>
        </div>

        {step === 1 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Create Your Protocol
              </h1>
              <p className="text-gray-600">
                Design a treatment protocol that you can assign to multiple patients
              </p>
            </div>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                      Protocol Name
                    </Label>
                    <Input
                      id="name"
                      value={protocol.name}
                      onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Post-Treatment Recovery"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={protocol.description}
                      onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose and goals of this protocol"
                      className="mt-1 min-h-[120px] resize-none"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-900 mb-3 block">
                      Cover Image
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {COVER_IMAGES.map((image) => (
                        <button
                          key={image.url}
                          onClick={() => setProtocol(prev => ({ ...prev, coverImage: image.url }))}
                          className={`relative aspect-[16/9] overflow-hidden rounded-lg border-2 transition-all ${
                            protocol.coverImage === image.url 
                              ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2' 
                              : 'border-transparent hover:border-gray-200'
                          }`}
                        >
                          <img 
                            src={image.url} 
                            alt={image.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={() => setStep(2)}
                      disabled={!protocol.name}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 h-11"
                    >
                      Continue
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Add Sessions & Tasks
              </h1>
              <p className="text-gray-600">
                Break down your protocol into manageable sessions and tasks
              </p>
            </div>

            <Card className="bg-white shadow-sm border-0">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {protocol.sessions.map((session, sessionIdx) => (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white rounded-md">
                          <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <Input
                          value={session.title}
                          onChange={(e) => {
                            setProtocol(prev => ({
                              ...prev,
                              sessions: prev.sessions.map(s => 
                                s.id === session.id ? { ...s, title: e.target.value } : s
                              )
                            }));
                          }}
                          placeholder={`Session ${sessionIdx + 1}`}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          onClick={() => handleRemoveSession(session.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="pl-10 space-y-2">
                        {session.tasks.map((task, taskIdx) => (
                          <div key={task.id} className="flex items-center gap-3 bg-white rounded-md p-2 border border-gray-100">
                            <div className="p-1.5 bg-gray-50 rounded">
                              <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                            </div>
                            <Input
                              value={task.title}
                              onChange={(e) => {
                                setProtocol(prev => ({
                                  ...prev,
                                  sessions: prev.sessions.map(s => {
                                    if (s.id === session.id) {
                                      return {
                                        ...s,
                                        tasks: s.tasks.map(t =>
                                          t.id === task.id ? { ...t, title: e.target.value } : t
                                        )
                                      };
                                    }
                                    return s;
                                  })
                                }));
                              }}
                              placeholder={`Task ${taskIdx + 1}`}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              onClick={() => handleRemoveTask(session.id, task.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          onClick={() => handleAddTask(session.id)}
                          className="w-full text-sm h-9"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add Task
                        </Button>
                      </div>
                    </div>
                  ))}

                  {protocol.sessions.length === 0 ? (
                    <button
                      onClick={handleAddSession}
                      className="w-full py-12 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex flex-col items-center text-gray-500 hover:text-gray-600">
                        <PlusIcon className="w-8 h-8 mb-2" />
                        <span className="font-medium">Add Your First Session</span>
                      </div>
                    </button>
                  ) : (
                    <Button
                      onClick={handleAddSession}
                      variant="outline"
                      className="w-full h-11"
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Another Session
                    </Button>
                  )}

                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-11"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleCreateProtocol}
                      disabled={isLoading || protocol.sessions.length === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
                    >
                      {isLoading ? 'Creating...' : 'Create Protocol'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
} 