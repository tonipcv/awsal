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
      alert('Select a template and enter the protocol name');
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
        // Redirect to the created protocol
        window.location.href = `/doctor/protocols/${newProtocol.id}`;
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating protocol');
      }
    } catch (error) {
      console.error('Error creating protocol from template:', error);
      alert('Error creating protocol');
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
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-80 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Templates List Skeleton */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Search Skeleton */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                </div>

                {/* Templates Grid Skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                            <div className="h-6 bg-gray-100 rounded-xl w-24 animate-pulse"></div>
                          </div>
                          <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
                          <div className="flex items-center gap-6">
                            <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                            <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                          </div>
                        </div>
                        <div className="h-5 w-5 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar Skeleton */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
                  <div className="space-y-6">
                    <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="space-y-4">
                      <div className="h-4 bg-gray-100 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                      <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
        
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Protocol Templates
              </h1>
              <p className="text-gray-600 font-medium">
                Use predefined templates to create protocols quickly
              </p>
            </div>
            
            <Button asChild variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-6 shadow-md font-semibold">
              <Link href="/doctor/protocols/new">
                <PlusIcon className="h-4 w-4 mr-2" />
                Create from Scratch
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
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Templates Grid */}
              {filteredTemplates.length === 0 ? (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardContent className="p-8">
                    <div className="text-center">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold mb-2 text-gray-900">
                        {searchTerm ? 'No templates found' : 'No templates available'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 font-medium">
                        {searchTerm 
                          ? 'Try adjusting your search term'
                          : 'Create your first custom protocol'
                        }
                      </p>
                      <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold">
                        <Link href="/doctor/protocols/new">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Protocol
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
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                              {isCustomTemplate(template) && (
                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-sm bg-[#5154e7] text-white font-semibold">
                                  Custom
                                </span>
                              )}
                            </div>
                            
                            <p className="text-gray-600 mb-4 font-medium">
                              {template.description}
                            </p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span className="font-medium">{template.duration} days</span>
                              </div>
                              <span className="font-medium">
                                {template.days.reduce((acc, day) => acc + day.tasks.length, 0)} tasks
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
                    {selectedTemplate ? 'Create Protocol' : 'Select a Template'}
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
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <span className="font-medium">{selectedTemplate.duration} days</span>
                          </div>
                          <span className="font-medium">
                            {selectedTemplate.days.reduce((acc, day) => acc + day.tasks.length, 0)} tasks
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold mb-3 block text-gray-900">
                          New Protocol Name
                        </label>
                        <Input
                          placeholder="e.g., Post-Botox Protocol - John"
                          value={protocolName}
                          onChange={(e) => setProtocolName(e.target.value)}
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12"
                        />
                      </div>

                      <Button 
                        onClick={createFromTemplate}
                        disabled={isCreating || !protocolName.trim()}
                        className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 font-semibold shadow-md"
                      >
                        {isCreating ? 'Creating...' : 'Create Protocol'}
                      </Button>

                      {/* Preview of days */}
                      <div className="border-t border-gray-200 pt-6">
                        <h5 className="text-sm font-bold mb-4 text-gray-900">Days Preview</h5>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {selectedTemplate.days.slice(0, 3).map((day) => (
                            <div key={day.dayNumber} className="text-sm">
                              <div className="font-bold text-gray-900 mb-1">Day {day.dayNumber}</div>
                              <div className="text-gray-600 ml-3 space-y-1">
                                {day.tasks.slice(0, 2).map((task, i) => (
                                  <div key={i} className="font-medium">• {task.title}</div>
                                ))}
                                {day.tasks.length > 2 && (
                                  <div className="font-medium">• +{day.tasks.length - 2} more...</div>
                                )}
                              </div>
                            </div>
                          ))}
                          {selectedTemplate.days.length > 3 && (
                            <div className="text-sm text-gray-500 font-medium">
                              +{selectedTemplate.days.length - 3} remaining days...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        Select a template to see details and create a protocol
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