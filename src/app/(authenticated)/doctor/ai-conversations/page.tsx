'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Patient {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Conversation {
  id: string;
  title: string;
  patient: Patient;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageRole: 'user' | 'assistant';
  messageCount: number;
  needsReviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DoctorAIConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadConversations();
  }, [pagination.page, filterNeedsReview]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filterNeedsReview && { needsReview: 'true' })
      });

      const response = await fetch(`/api/doctor/ai-conversations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
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
              <div className="flex gap-3">
                <div className="h-10 bg-gray-100 rounded-xl w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Search and Filters Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 bg-gray-100 rounded-xl w-28 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Conversations List Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-200 shadow-lg rounded-2xl p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                          <div className="h-6 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
                        <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
                        <div className="flex items-center gap-6">
                          <div className="h-4 bg-gray-100 rounded w-20 animate-pulse"></div>
                          <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                    <div className="h-8 w-16 bg-gray-100 rounded-xl animate-pulse"></div>
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
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                AI Conversations
              </h1>
              <p className="text-gray-600 font-medium">
                Monitor and review AI assistant conversations with your patients
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm font-semibold border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-xl">
                {pagination.total} total conversations
              </Badge>
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
                      placeholder="Search by patient name, conversation title, or message..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </div>
                
                <Button
                  variant={filterNeedsReview ? "default" : "outline"}
                  onClick={() => setFilterNeedsReview(!filterNeedsReview)}
                  className={filterNeedsReview 
                    ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold" 
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-6 font-semibold"
                  }
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Needs Review
                  {filterNeedsReview && (
                    <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">
                      {conversations.filter(c => c.needsReviewCount > 0).length}
                    </Badge>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Conversations List */}
          {filteredConversations.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-2 text-gray-900">
                    {searchTerm || filterNeedsReview ? 'No conversations found' : 'No AI conversations yet'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 font-medium">
                    {searchTerm || filterNeedsReview 
                      ? 'Try adjusting your search or filters'
                      : 'Your patients haven\'t started any AI conversations yet'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Patient Avatar */}
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          {conversation.patient.image ? (
                            <img 
                              src={conversation.patient.image} 
                              alt={conversation.patient.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-semibold text-sm">
                              {getInitials(conversation.patient.name)}
                            </span>
                          )}
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 truncate">
                              {conversation.patient.name}
                            </h3>
                            <Badge variant="outline" className="text-xs font-semibold border-gray-300 text-gray-700 bg-white px-3 py-1 rounded-xl">
                              {conversation.messageCount} messages
                            </Badge>
                            {conversation.needsReviewCount > 0 && (
                              <Badge variant="destructive" className="text-xs font-semibold bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-xl">
                                {conversation.needsReviewCount} need review
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3 font-medium">
                            {conversation.title}
                          </p>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <div className={`w-2 h-2 rounded-full ${
                              conversation.lastMessageRole === 'user' ? 'bg-blue-400' : 'bg-green-400'
                            }`} />
                            <span className="truncate max-w-md font-medium">
                              {conversation.lastMessage}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <ClockIcon className="h-4 w-4" />
                              <span className="font-medium">{formatTime(conversation.lastMessageAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4" />
                              <span className="font-medium">{conversation.patient.email}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        {conversation.needsReviewCount > 0 && (
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                        >
                          <Link href={`/doctor/ai-conversations/${conversation.id}`}>
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card className="mt-6 bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} conversations
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-semibold"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={pageNum === pagination.page 
                              ? "bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl w-8 h-8 p-0 font-semibold"
                              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl w-8 h-8 p-0 font-semibold"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-semibold"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 