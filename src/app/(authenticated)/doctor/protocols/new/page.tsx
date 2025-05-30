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
  CheckIcon,
  FolderPlusIcon,
  Bars3Icon,
  ChevronDownIcon,
  InformationCircleIcon,
  PlayIcon,
  ShoppingBagIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ProtocolTask {
  id: string;
  title: string;
  description: string;
  order: number;
  hasMoreInfo: boolean;
  videoUrl: string;
  fullExplanation: string;
  productId: string;
  modalTitle: string;
  modalButtonText: string;
  modalButtonUrl: string;
}

interface ProtocolSection {
  id: string;
  name: string;
  order: number;
  tasks: ProtocolTask[];
}

interface ProtocolDay {
  id: string;
  dayNumber: number;
  sections: ProtocolSection[];
  tasks: ProtocolTask[]; // Tarefas soltas (fora de seções)
}

interface ProtocolForm {
  name: string;
  duration: number;
  description: string;
  isTemplate: boolean;
  days: ProtocolDay[];
}

const defaultSections = [
  'Morning',
  'Afternoon', 
  'Evening',
  'Medications',
  'Care',
  'Exercises',
  'Nutrition',
  'Notes'
];

export default function NewProtocolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAddOptions, setShowAddOptions] = useState<{[key: number]: boolean}>({});
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
          sections: [],
          tasks: []
        });
      }
    }
    setProtocol(prev => ({ ...prev, days: newDays }));
  }, [protocol.duration]);

  const toggleAddOptions = (dayNumber: number) => {
    setShowAddOptions(prev => ({
      ...prev,
      [dayNumber]: !prev[dayNumber]
    }));
  };

  // Funções para seções
  const addSection = (dayNumber: number, sectionName?: string) => {
    const name = sectionName || `New Section`;
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sections: [
                ...day.sections,
                {
                  id: `section-${Date.now()}`,
                  name,
                  order: day.sections.length,
                  tasks: []
                }
              ]
            }
          : day
      )
    }));
    setShowAddOptions(prev => ({ ...prev, [dayNumber]: false }));
  };

  const removeSection = (dayNumber: number, sectionId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sections: day.sections.filter(section => section.id !== sectionId)
            }
          : day
      )
    }));
  };

  const updateSectionName = (dayNumber: number, sectionId: string, name: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sections: day.sections.map(section => 
                section.id === sectionId 
                  ? { ...section, name }
                  : section
              )
            }
          : day
      )
    }));
  };

  // Funções para tarefas dentro de seções
  const addTaskToSection = (dayNumber: number, sectionId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sections: day.sections.map(section =>
                section.id === sectionId
                  ? {
                      ...section,
                      tasks: [
                        ...section.tasks,
                        {
                          id: `task-${Date.now()}`,
                          title: '',
                          description: '',
                          order: section.tasks.length,
                          hasMoreInfo: false,
                          videoUrl: '',
                          fullExplanation: '',
                          productId: '',
                          modalTitle: '',
                          modalButtonText: 'Learn more',
                          modalButtonUrl: ''
                        }
                      ]
                    }
                  : section
              )
            }
          : day
      )
    }));
  };

  const removeTaskFromSection = (dayNumber: number, sectionId: string, taskId: string) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sections: day.sections.map(section =>
                section.id === sectionId
                  ? {
                      ...section,
                      tasks: section.tasks.filter(task => task.id !== taskId)
                    }
                  : section
              )
            }
          : day
      )
    }));
  };

  const updateTaskInSection = (dayNumber: number, sectionId: string, taskId: string, field: keyof ProtocolTask, value: any) => {
    setProtocol(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber 
          ? {
              ...day,
              sections: day.sections.map(section =>
                section.id === sectionId
                  ? {
                      ...section,
                      tasks: section.tasks.map(task =>
                        task.id === taskId
                          ? { ...task, [field]: value }
                          : task
                      )
                    }
                  : section
              )
            }
          : day
      )
    }));
  };

  // Funções para tarefas soltas
  const addLooseTask = (dayNumber: number) => {
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
                  order: day.tasks.length,
                  hasMoreInfo: false,
                  videoUrl: '',
                  fullExplanation: '',
                  productId: '',
                  modalTitle: '',
                  modalButtonText: 'Learn more',
                  modalButtonUrl: ''
                }
              ]
            }
          : day
      )
    }));
    setShowAddOptions(prev => ({ ...prev, [dayNumber]: false }));
  };

  const removeLooseTask = (dayNumber: number, taskId: string) => {
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

  const updateLooseTask = (dayNumber: number, taskId: string, field: keyof ProtocolTask, value: any) => {
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
      alert('Protocol name is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/protocols', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(protocol)
      });

      if (response.ok) {
        const newProtocol = await response.json();
        router.push(`/doctor/protocols/${newProtocol.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating protocol');
      }
    } catch (error) {
      console.error('Error creating protocol:', error);
      alert('Error creating protocol');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
        
          {/* Header */}
          <div className="flex items-center gap-6 mb-8">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-4 shadow-md font-semibold">
              <Link href="/doctor/protocols">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                New Protocol
              </h1>
              <p className="text-gray-600 font-medium">
                Create a custom protocol for your clients
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Protocol Info */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6 bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">Protocol Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="name" className="text-gray-900 font-semibold">Protocol Name</Label>
                    <Input
                      id="name"
                      value={protocol.name}
                      onChange={(e) => setProtocol(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Post-Facial Filler Protocol"
                      className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration" className="text-gray-900 font-semibold">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="365"
                      value={protocol.duration}
                      onChange={(e) => setProtocol(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                      className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 rounded-xl h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-900 font-semibold">Description</Label>
                    <Textarea
                      id="description"
                      value={protocol.description}
                      onChange={(e) => setProtocol(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the purpose and characteristics of the protocol..."
                      rows={3}
                      className="mt-2 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isTemplate"
                      checked={protocol.isTemplate}
                      onChange={(e) => setProtocol(prev => ({ ...prev, isTemplate: e.target.checked }))}
                      className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                    />
                    <Label htmlFor="isTemplate" className="text-gray-900 font-medium">
                      Save as template
                    </Label>
                  </div>

                  <Button 
                    onClick={saveProtocol} 
                    disabled={isLoading}
                    className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold shadow-md"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Protocol'}
                  </Button>

                  {/* Quick Add Sections */}
                  <div className="border-t border-gray-200 pt-6">
                    <Label className="text-gray-900 font-semibold mb-3 block">Quick Sections</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {defaultSections.map((sectionName) => (
                        <Button
                          key={sectionName}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Adicionar a seção ao primeiro dia que não tem essa seção
                            const firstDay = protocol.days.find(day => 
                              !day.sections.some(section => section.name === sectionName)
                            );
                            if (firstDay) {
                              addSection(firstDay.dayNumber, sectionName);
                            }
                          }}
                          className="text-xs border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg h-8 px-2 font-medium"
                        >
                          {sectionName}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Protocol Days */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {protocol.days.map((day) => (
                  <Card key={day.id} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900">
                          Day {day.dayNumber}
                        </CardTitle>
                        <div className="relative">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAddOptions(day.dayNumber)}
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-4 shadow-md font-semibold"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add
                            <ChevronDownIcon className="h-3 w-3 ml-2" />
                          </Button>
                          
                          {showAddOptions[day.dayNumber] && (
                            <div className="absolute right-0 top-12 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[160px]">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addSection(day.dayNumber)}
                                className="w-full justify-start px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-none h-auto font-medium"
                              >
                                <FolderPlusIcon className="h-4 w-4 mr-3" />
                                Add Section
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addLooseTask(day.dayNumber)}
                                className="w-full justify-start px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-none h-auto font-medium"
                              >
                                <PlusIcon className="h-4 w-4 mr-3" />
                                Add Task
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Tarefas Soltas */}
                      {day.tasks.map((task) => (
                        <div key={task.id} className="border border-gray-200 rounded-xl bg-gray-50">
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-4">
                                {/* Campos Básicos */}
                                <div className="space-y-4">
                                  <Input
                                    placeholder="Task title"
                                    value={task.title}
                                    onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'title', e.target.value)}
                                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12 font-semibold"
                                  />
                                  <Textarea
                                    placeholder="Basic description"
                                    value={task.description}
                                    onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'description', e.target.value)}
                                    rows={2}
                                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl"
                                  />
                                </div>

                                {/* Toggle para Mais Informações */}
                                <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                                  <input
                                    type="checkbox"
                                    id={`hasMoreInfo-${task.id}`}
                                    checked={task.hasMoreInfo}
                                    onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'hasMoreInfo', e.target.checked)}
                                    className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                                  />
                                  <Label htmlFor={`hasMoreInfo-${task.id}`} className="text-gray-700 font-medium flex items-center gap-2">
                                    <InformationCircleIcon className="h-4 w-4" />
                                    Add extra content
                                  </Label>
                                </div>

                                {/* Campos Extras */}
                                {task.hasMoreInfo && (
                                  <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="grid grid-cols-1 gap-4">
                                      <div>
                                        <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                          <PlayIcon className="h-4 w-4" />
                                          Video URL
                                        </Label>
                                        <Input
                                          placeholder="https://youtube.com/watch?v=..."
                                          value={task.videoUrl}
                                          onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'videoUrl', e.target.value)}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                        />
                                      </div>
                                      
                                      <div>
                                        <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                          <InformationCircleIcon className="h-4 w-4" />
                                          Full Explanation
                                        </Label>
                                        <Textarea
                                          placeholder="Detailed task explanation..."
                                          value={task.fullExplanation}
                                          onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'fullExplanation', e.target.value)}
                                          rows={3}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl"
                                        />
                                      </div>

                                      <div>
                                        <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                          <ShoppingBagIcon className="h-4 w-4" />
                                          Product ID (optional)
                                        </Label>
                                        <Input
                                          placeholder="Related product ID"
                                          value={task.productId}
                                          onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'productId', e.target.value)}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                            <EyeIcon className="h-4 w-4" />
                                            Modal Title
                                          </Label>
                                          <Input
                                            placeholder="Custom title"
                                            value={task.modalTitle}
                                            onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'modalTitle', e.target.value)}
                                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                          />
                                        </div>
                                        
                                        <div>
                                          <Label className="text-gray-900 font-semibold mb-2 block">
                                            Button Text
                                          </Label>
                                          <Input
                                            placeholder="Learn more"
                                            value={task.modalButtonText}
                                            onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'modalButtonText', e.target.value)}
                                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <Label className="text-gray-900 font-semibold mb-2 block">
                                          Button URL
                                        </Label>
                                        <Input
                                          placeholder="https://example.com/product"
                                          value={task.modalButtonUrl}
                                          onChange={(e) => updateLooseTask(day.dayNumber, task.id, 'modalButtonUrl', e.target.value)}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLooseTask(day.dayNumber, task.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Seções */}
                      {day.sections.map((section) => (
                        <div key={section.id} className="border border-gray-200 rounded-xl bg-gray-50/50">
                          {/* Section Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                            <div className="flex items-center gap-3 flex-1">
                              <Bars3Icon className="h-4 w-4 text-gray-500" />
                              <Input
                                value={section.name}
                                onChange={(e) => updateSectionName(day.dayNumber, section.id, e.target.value)}
                                placeholder="Section name"
                                className="border-0 bg-transparent text-gray-900 font-semibold p-0 h-auto focus:ring-0 focus:border-0"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSection(day.dayNumber, section.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Section Tasks */}
                          <div className="p-4 space-y-4">
                            {section.tasks.map((task) => (
                              <div key={task.id} className="border border-gray-200 rounded-xl bg-white">
                                <div className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className="flex-1 space-y-4">
                                      {/* Campos Básicos */}
                                      <div className="space-y-3">
                                        <Input
                                          placeholder="Task title"
                                          value={task.title}
                                          onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'title', e.target.value)}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10 font-semibold"
                                        />
                                        <Textarea
                                          placeholder="Basic description"
                                          value={task.description}
                                          onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'description', e.target.value)}
                                          rows={2}
                                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl"
                                        />
                                      </div>

                                      {/* Toggle para Mais Informações */}
                                      <div className="flex items-center space-x-3 pt-2 border-t border-gray-200">
                                        <input
                                          type="checkbox"
                                          id={`hasMoreInfo-section-${task.id}`}
                                          checked={task.hasMoreInfo}
                                          onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'hasMoreInfo', e.target.checked)}
                                          className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
                                        />
                                        <Label htmlFor={`hasMoreInfo-section-${task.id}`} className="text-gray-700 font-medium flex items-center gap-2">
                                          <InformationCircleIcon className="h-4 w-4" />
                                          Add extra content
                                        </Label>
                                      </div>

                                      {/* Campos Extras */}
                                      {task.hasMoreInfo && (
                                        <div className="space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                          <div className="grid grid-cols-1 gap-4">
                                            <div>
                                              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                <PlayIcon className="h-4 w-4" />
                                                Video URL
                                              </Label>
                                              <Input
                                                placeholder="https://youtube.com/watch?v=..."
                                                value={task.videoUrl}
                                                onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'videoUrl', e.target.value)}
                                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                              />
                                            </div>
                                            
                                            <div>
                                              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                <InformationCircleIcon className="h-4 w-4" />
                                                Full Explanation
                                              </Label>
                                              <Textarea
                                                placeholder="Detailed task explanation..."
                                                value={task.fullExplanation}
                                                onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'fullExplanation', e.target.value)}
                                                rows={3}
                                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl"
                                              />
                                            </div>

                                            <div>
                                              <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                <ShoppingBagIcon className="h-4 w-4" />
                                                Product ID (optional)
                                              </Label>
                                              <Input
                                                placeholder="Related product ID"
                                                value={task.productId}
                                                onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'productId', e.target.value)}
                                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                              />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-gray-900 font-semibold flex items-center gap-2 mb-2">
                                                  <EyeIcon className="h-4 w-4" />
                                                  Modal Title
                                                </Label>
                                                <Input
                                                  placeholder="Custom title"
                                                  value={task.modalTitle}
                                                  onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'modalTitle', e.target.value)}
                                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                                />
                                              </div>
                                              
                                              <div>
                                                <Label className="text-gray-900 font-semibold mb-2 block">
                                                  Button Text
                                                </Label>
                                                <Input
                                                  placeholder="Learn more"
                                                  value={task.modalButtonText}
                                                  onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'modalButtonText', e.target.value)}
                                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                                />
                                              </div>
                                            </div>

                                            <div>
                                              <Label className="text-gray-900 font-semibold mb-2 block">
                                                Button URL
                                              </Label>
                                              <Input
                                                placeholder="https://example.com/product"
                                                value={task.modalButtonUrl}
                                                onChange={(e) => updateTaskInSection(day.dayNumber, section.id, task.id, 'modalButtonUrl', e.target.value)}
                                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-10"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeTaskFromSection(day.dayNumber, section.id, task.id)}
                                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8 p-0"
                                    >
                                      <TrashIcon className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTaskToSection(day.dayNumber, section.id)}
                              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 font-semibold"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Empty State */}
                      {day.tasks.length === 0 && day.sections.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                          <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 font-medium mb-4">No tasks or sections created</p>
                          <p className="text-gray-500 text-sm">Click "Add" to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 