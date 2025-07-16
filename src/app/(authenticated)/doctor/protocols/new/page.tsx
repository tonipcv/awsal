'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ProtocolEditTabs } from '@/components/protocol/protocol-edit-tabs';
import { ProtocolDayEditor } from '@/components/protocol/protocol-day-editor';
import { ProtocolImagePicker } from '@/components/protocol/protocol-image-picker';

interface ProtocolTask {
  id: string;
  title: string;
  order: number;
  hasMoreInfo?: boolean;
  videoUrl?: string;
  fullExplanation?: string;
  productId?: string;
  modalTitle?: string;
  modalButtonText?: string;
  modalButtonUrl?: string;
}

interface ProtocolSession {
  id: string;
  name: string;
  order: number;
  tasks: ProtocolTask[];
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  title?: string;
  tasks: ProtocolTask[];
  sessions: ProtocolSession[];
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
  name: string;
  description: string;
  duration: number;
  isTemplate: boolean;
  showDoctorInfo: boolean;
  modalTitle: string;
  modalVideoUrl: string;
  modalDescription: string;
  modalButtonText: string;
  modalButtonUrl: string;
  days: ProtocolDay[];
  products: ProtocolProduct[];
  coverImage?: string;
}

export default function NewProtocolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [protocol, setProtocol] = useState<Protocol>({
    name: '',
    description: '',
    duration: 1,
    isTemplate: false,
    showDoctorInfo: true,
    modalTitle: '',
    modalVideoUrl: '',
    modalDescription: '',
    modalButtonText: 'Learn more',
    modalButtonUrl: '',
    days: [
      {
        id: 'day-1',
        dayNumber: 1,
        title: 'Day 1',
        tasks: [],
        sessions: []
      }
    ],
    products: [],
    coverImage: ''
  });

  // Load available products
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const products = await response.json();
          setAvailableProducts(products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, []);

  const updateProtocolField = useCallback((field: keyof Protocol, value: any) => {
    setProtocol(prev => ({ ...prev, [field]: value }));
  }, []);

  const addDay = useCallback(() => {
    const newDayNumber = Math.max(...protocol.days.map(d => d.dayNumber)) + 1;
    const newDay: ProtocolDay = {
      id: `day-${newDayNumber}`,
      dayNumber: newDayNumber,
      title: `Day ${newDayNumber}`,
      tasks: [],
      sessions: []
    };
    setProtocol(prev => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
  }, [protocol.days]);

  const removeDay = useCallback((dayNumber: number) => {
    if (protocol.days.length <= 1) return;
    
    setProtocol(prev => ({
      ...prev,
      days: prev.days
        .filter(day => day.dayNumber !== dayNumber)
        .map((day, index) => ({
          ...day,
          dayNumber: index + 1,
          id: `day-${index + 1}`
        }))
    }));
  }, [protocol.days.length]);

  const duplicateDay = useCallback((dayNumber: number) => {
    const dayToDuplicate = protocol.days.find(d => d.dayNumber === dayNumber);
    if (!dayToDuplicate) return;

    const newDayNumber = Math.max(...protocol.days.map(d => d.dayNumber)) + 1;
    const newDay: ProtocolDay = {
      id: `day-${newDayNumber}`,
      dayNumber: newDayNumber,
      tasks: dayToDuplicate.tasks.map(task => ({
        ...task,
        id: `task-${Date.now()}-${Math.random()}`
      })),
      sessions: dayToDuplicate.sessions.map(session => ({
        ...session,
        id: `session-${Date.now()}-${Math.random()}`,
        tasks: session.tasks.map(task => ({
          ...task,
          id: `task-${Date.now()}-${Math.random()}`
        }))
      }))
    };

    setProtocol(prev => ({
      ...prev,
      days: [...prev.days, newDay]
    }));
  }, [protocol.days]);

  const updateDay = useCallback((dayNumber: number, field: string, value: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? { ...day, [field]: value }
          : day
      )
    }));
  }, []);

  const addSession = useCallback((dayNumber: number) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sessions: [
                ...day.sessions,
                {
                  id: `session-${Date.now()}`,
                  name: `Session ${day.sessions.length + 1}`,
                  order: day.sessions.length,
                  tasks: []
                }
              ]
            }
          : day
      )
    }));
  }, []);

  const removeSession = useCallback((dayNumber: number, sessionId: string) => {
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
  }, []);

  const updateSession = useCallback((dayNumber: number, sessionId: string, field: string, value: string) => {
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
  }, []);

  const addTask = useCallback((dayNumber: number, sessionId?: string) => {
    const newTask: ProtocolTask = {
      id: `task-${Date.now()}`,
      title: '',
      order: 0,
      hasMoreInfo: false,
      videoUrl: '',
      fullExplanation: '',
      productId: '',
      modalTitle: '',
      modalButtonText: 'Learn more',
      modalButtonUrl: ''
    };

    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day;

        if (sessionId) {
          return {
            ...day,
            sessions: day.sessions.map(session =>
              session.id === sessionId
                ? {
                    ...session,
                    tasks: [...session.tasks, { ...newTask, order: session.tasks.length }]
                  }
                : session
            )
          };
        } else {
          return {
            ...day,
            tasks: [...day.tasks, { ...newTask, order: day.tasks.length }]
          };
        }
      })
    }));
  }, []);

  const removeTask = useCallback((dayNumber: number, taskId: string, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day;

        if (sessionId) {
          return {
            ...day,
            sessions: day.sessions.map(session =>
              session.id === sessionId
                ? {
                    ...session,
                    tasks: session.tasks.filter(task => task.id !== taskId)
                  }
                : session
            )
          };
        } else {
          return {
            ...day,
            tasks: day.tasks.filter(task => task.id !== taskId)
          };
        }
      })
    }));
  }, []);

  const updateTask = useCallback((dayNumber: number, taskId: string, field: string, value: string | boolean, sessionId?: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day;

        if (sessionId) {
          return {
            ...day,
            sessions: day.sessions.map(session =>
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
          };
        } else {
          return {
            ...day,
            tasks: day.tasks.map(task =>
              task.id === taskId
                ? { ...task, [field]: value }
                : task
            )
          };
        }
      })
    }));
  }, []);

  const reorderTasks = useCallback((dayNumber: number, sessionId: string, oldIndex: number, newIndex: number) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day;

        return {
          ...day,
          sessions: day.sessions.map(session => {
            if (session.id !== sessionId) return session;

            const newTasks = [...session.tasks];
            const [reorderedTask] = newTasks.splice(oldIndex, 1);
            newTasks.splice(newIndex, 0, reorderedTask);

            return {
              ...session,
              tasks: newTasks.map((task, index) => ({
                ...task,
                order: index
              }))
            };
          })
        };
      })
    }));
  }, []);

  const reorderSessions = useCallback((dayNumber: number, oldIndex: number, newIndex: number) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day;

        const newSessions = [...day.sessions];
        const [reorderedSession] = newSessions.splice(oldIndex, 1);
        newSessions.splice(newIndex, 0, reorderedSession);

        return {
          ...day,
          sessions: newSessions.map((session, index) => ({
            ...session,
            order: index
          }))
        };
      })
    }));
  }, []);

  const addProduct = (productId: string) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;

    const newProtocolProduct: ProtocolProduct = {
      id: `temp-product-${Date.now()}`,
      productId: productId,
      order: protocol.products.length + 1,
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

  const updateProtocolProduct = useCallback((protocolProductId: string, field: string, value: any) => {
    setProtocol(prev => ({
      ...prev,
      products: prev.products.map(pp =>
        pp.id === protocolProductId
          ? { ...pp, [field]: value }
          : pp
      )
    }));
  }, []);

  const availableProductsToAdd = availableProducts.filter(
    product => !protocol.products.some(pp => pp.productId === product.id)
  );

  const saveProtocol = async () => {
    if (!protocol.name.trim()) {
      setErrorMessage('Protocol name is required');
      setShowErrorAlert(true);
      return;
    }

    try {
      setIsLoading(true);
      setShowSuccessAlert(false);
      setShowErrorAlert(false);
      setErrorMessage('');
      
      // Automatically set duration based on number of days
      const protocolToSave = {
        ...protocol,
        duration: Math.max(protocol.duration || 1, protocol.days.length)
      };
      
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(protocolToSave)
      });

      if (response.ok) {
        const newProtocol = await response.json();
        setShowSuccessAlert(true);
        setTimeout(() => {
          router.push(`/doctor/protocols/${newProtocol.id}`);
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Error creating protocol');
        setShowErrorAlert(true);
      }
    } catch (error) {
      console.error('Error creating protocol:', error);
      setErrorMessage('Error creating protocol');
      setShowErrorAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if modal content is configured
  const isModalEnabled = !!(protocol.modalTitle || protocol.modalVideoUrl || protocol.modalDescription);

  const handleImageSelect = useCallback((url: string) => {
    updateProtocolField('coverImage', url);
  }, [updateProtocolField]);

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8">
        
          {/* Header */}
          <div className="flex items-center gap-6 mb-8">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/protocols">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                New Protocol
              </h1>
              <p className="text-gray-600 font-medium">
                Create a custom protocol for your patients
              </p>
            </div>
            <Button 
              onClick={saveProtocol} 
              disabled={isLoading}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Protocol'}
            </Button>
          </div>

          {/* Success Alert */}
          {showSuccessAlert && (
            <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900">Protocol Created Successfully!</h4>
                  <p className="text-xs text-green-700 mt-1">Redirecting to protocol details...</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuccessAlert(false)}
                  className="text-green-500 hover:text-green-600 hover:bg-green-100 rounded-lg h-6 w-6 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {showErrorAlert && (
            <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-red-100 to-rose-100 rounded-full flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-900">Error Creating Protocol</h4>
                  <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowErrorAlert(false)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-100 rounded-lg h-6 w-6 p-0"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Tabs Interface */}
          <ProtocolEditTabs
            protocol={protocol}
            setProtocol={setProtocol}
            availableCourses={[]}
            addCourse={() => {}}
            removeCourse={() => {}}
            updateCourse={() => {}}
            reorderCourses={() => {}}
            protocolId=""
          >
            {{
              basicInfo: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-gray-900 font-semibold">Protocol Name</Label>
                          <Input
                            id="name"
                            value={protocol.name}
                            onChange={(e) => updateProtocolField('name', e.target.value)}
                            placeholder="e.g., Post-Facial Filler Protocol"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-gray-900 font-semibold">Description</Label>
                          <Textarea
                            id="description"
                            value={protocol.description}
                            onChange={(e) => updateProtocolField('description', e.target.value)}
                            placeholder="Describe the purpose and characteristics of the protocol..."
                            rows={4}
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration" className="text-gray-900 font-semibold">Duration (days)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            value={protocol.duration || protocol.days.length}
                            onChange={(e) => updateProtocolField('duration', parseInt(e.target.value) || 1)}
                            placeholder="Number of days"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                          />
                          <p className="text-xs text-gray-500">
                            This will be automatically set to match the number of days you add in the Schedule tab
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="isTemplate"
                              checked={protocol.isTemplate}
                              onChange={(e) => updateProtocolField('isTemplate', e.target.checked)}
                              className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                            />
                            <Label htmlFor="isTemplate" className="text-gray-900 font-medium">
                              Save as template
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="showDoctorInfo"
                              checked={protocol.showDoctorInfo}
                              onChange={(e) => updateProtocolField('showDoctorInfo', e.target.checked)}
                              className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                            />
                            <Label htmlFor="showDoctorInfo" className="text-gray-900 font-medium">
                              Show responsible doctor
                            </Label>
                            <span className="text-xs text-gray-500">
                              (Shows your photo and name on patient screen)
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-900 font-semibold">Cover Image</Label>
                          <ProtocolImagePicker
                            selectedImage={protocol.coverImage || ''}
                            onSelectImage={handleImageSelect}
                            mode="upload-only"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ),
              modalConfig: (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Modal Configuration</CardTitle>
                    <p className="text-gray-600 font-medium mt-1">
                      Configure what happens when the protocol is unavailable or inactive.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="modalEnabled"
                          checked={isModalEnabled}
                          onChange={(e) => {
                            if (!e.target.checked) {
                              updateProtocolField('modalTitle', '');
                              updateProtocolField('modalVideoUrl', '');
                              updateProtocolField('modalDescription', '');
                              updateProtocolField('modalButtonText', '');
                              updateProtocolField('modalButtonUrl', '');
                            }
                          }}
                          className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                        />
                        <Label htmlFor="modalEnabled" className="text-gray-900 font-medium">
                          Enable modal
                        </Label>
                      </div>

                      {isModalEnabled && (
                        <div className="grid lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="modalTitle" className="text-gray-900 font-semibold">Modal Title</Label>
                              <Input
                                id="modalTitle"
                                value={protocol.modalTitle}
                                onChange={(e) => updateProtocolField('modalTitle', e.target.value)}
                                placeholder="Ex: Protocol in Development"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="modalVideoUrl" className="text-gray-900 font-semibold">Video URL (optional)</Label>
                              <Input
                                id="modalVideoUrl"
                                value={protocol.modalVideoUrl}
                                onChange={(e) => updateProtocolField('modalVideoUrl', e.target.value)}
                                placeholder="Ex: https://www.youtube.com/embed/..."
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="modalDescription" className="text-gray-900 font-semibold">Description</Label>
                              <Textarea
                                id="modalDescription"
                                value={protocol.modalDescription}
                                onChange={(e) => updateProtocolField('modalDescription', e.target.value)}
                                placeholder="Ex: This protocol is currently in development and will be available soon..."
                                rows={4}
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="modalButtonText" className="text-gray-900 font-semibold">Button Text</Label>
                                <Input
                                  id="modalButtonText"
                                  value={protocol.modalButtonText}
                                  onChange={(e) => updateProtocolField('modalButtonText', e.target.value)}
                                  placeholder="Ex: Learn More"
                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="modalButtonUrl" className="text-gray-900 font-semibold">Button URL</Label>
                                <Input
                                  id="modalButtonUrl"
                                  value={protocol.modalButtonUrl}
                                  onChange={(e) => updateProtocolField('modalButtonUrl', e.target.value)}
                                  placeholder="Ex: https://..."
                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ),
              days: (
                <ProtocolDayEditor
                  days={protocol.days}
                  availableProducts={availableProducts}
                  addTask={addTask}
                  removeTask={removeTask}
                  updateTask={updateTask}
                  reorderTasks={reorderTasks}
                  reorderSessions={reorderSessions}
                  addSession={addSession}
                  removeSession={removeSession}
                  updateSession={updateSession}
                  addDay={addDay}
                  removeDay={removeDay}
                  duplicateDay={duplicateDay}
                  updateDay={updateDay}
                  protocol={protocol}
                  setProtocol={setProtocol}
                />
              )
            }}
          </ProtocolEditTabs>
        </div>
      </div>
    </div>
  );
} 