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
  TrashIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

interface Protocol {
  id: string;
  name: string;
  duration: number;
  description?: string;
  isTemplate: boolean;
  createdAt: Date;
  coverImage?: string;
  assignments: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
    isActive: boolean;
  }>;
  isRecurring: boolean;
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
    if (!confirm('Are you sure you want to delete this protocol?')) return;

    try {
      const response = await fetch(`/api/protocols/${protocolId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProtocols(protocols.filter(p => p.id !== protocolId));
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Error deleting protocol';
        
        // Show more detailed error message
        if (errorData.activeAssignments && errorData.patients) {
          alert(`❌ ${errorMessage}\n\n📋 Assigned to: ${errorData.patients.join(', ')}\n\n💡 Go to each patient's page and deactivate the protocol assignments first.`);
        } else {
          alert(`❌ ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
      alert('❌ Connection error. Please try again.');
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
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-100 rounded-xl w-28 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-xl w-36 animate-pulse"></div>
              </div>
            </div>

            {/* Search and Filters Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded-xl w-16 animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Protocols List Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-6 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
                      <div className="flex items-center gap-6">
                        <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
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
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Protocols
              </h1>
              <p className="text-gray-600 font-small">
                Manage your protocols
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                asChild
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl px-6 shadow-md font-semibold"
              >
                <Link href="/doctor/protocols/upload">
                  <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                  Upload PDF
                </Link>
              </Button>
              <Button 
                asChild
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
              >
                <Link href="/doctor/protocols/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Protocol
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6 bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search protocols..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12"
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
                    All
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
                    Active
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Protocols List */}
          {filteredProtocols.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-gray-900">
                    {searchTerm ? 'No protocols found' : 'No protocols created'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 font-medium">
                    {searchTerm 
                      ? 'Try adjusting your search term or filters'
                      : 'Start by creating your first protocol or using a template'
                    }
                  </p>
                  {!searchTerm && (
                    <div className="flex gap-3 justify-center">
                      <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold">
                        <Link href="/doctor/protocols/new">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Create Protocol
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl shadow-md font-semibold">
                        <Link href="/doctor/protocols/upload">
                          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                          Upload PDF
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl shadow-md font-semibold">
                        <Link href="/doctor/templates">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          View Templates
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProtocols.map((protocol) => {
                const activeAssignments = getActiveAssignments(protocol);
                
                return (
                  <Card key={protocol.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    {protocol.coverImage && (
                      <div className="relative w-full h-48">
                        <Image
                          src={protocol.coverImage}
                          alt={protocol.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/60" />
                      </div>
                    )}
                    <CardContent className={`p-6 ${protocol.coverImage ? 'relative' : ''}`}>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                            {protocol.name}
                          </h3>
                          {protocol.isTemplate && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs bg-[#5154e7] text-white font-semibold">
                              Template
                            </span>
                          )}
                          {protocol.isRecurring && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs bg-purple-100 text-purple-700 border border-purple-200 font-semibold">
                              <ArrowPathIcon className="h-3 w-3 mr-1" />
                              Recurring
                            </span>
                          )}

                        </div>
                        
                        {protocol.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 font-medium">
                            {protocol.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <CalendarDaysIcon className="h-3.5 w-3.5" />
                            <span className="font-medium">{protocol.duration} days</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <UsersIcon className="h-3.5 w-3.5" />
                            <span className="font-medium">{protocol.assignments.length} assignment{protocol.assignments.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
                          >
                            <Link href={`/doctor/protocols/${protocol.id}`}>
                              <EyeIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
                          >
                            <Link href={`/doctor/protocols/${protocol.id}/edit`}>
                              <PencilIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteProtocol(protocol.id)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
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