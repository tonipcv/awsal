'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  MessageSquareIcon,
  UserIcon,
  BotIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ShoppingBagIcon,
  ActivityIcon
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface FAQ {
  id: string;
  question: string;
  category: string;
  answer: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isFromFAQ: boolean;
  faq?: FAQ;
  confidence?: number;
  needsReview: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  patient: Patient;
  createdAt: string;
  updatedAt: string;
}

interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  needsReviewCount: number;
  faqUsedCount: number;
  averageConfidence: number;
}

export default function DoctorConversationDetailPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewingAll, setReviewingAll] = useState(false);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/doctor/ai-conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        setMessages(data.messages);
        setStats(data.stats);
      } else {
        toast.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      toast.error('Error loading conversation');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsReviewed = async () => {
    try {
      setReviewingAll(true);
      const response = await fetch(`/api/doctor/ai-conversations/${conversationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsReviewed: true })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Marked ${data.updatedCount} messages as reviewed`);
        loadConversation(); // Reload to update the UI
      } else {
        toast.error('Failed to mark messages as reviewed');
      }
    } catch (error) {
      console.error('Error marking messages as reviewed:', error);
      toast.error('Error marking messages as reviewed');
    } finally {
      setReviewingAll(false);
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Conversation not found
              </h3>
              <p className="text-gray-600 mb-4">
                The conversation you're looking for doesn't exist or you don't have access to it.
              </p>
              <Link href="/doctor/ai-conversations">
                <Button variant="outline">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Conversations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/doctor/ai-conversations">
              <Button variant="outline" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Conversation with {conversation.patient.name}
              </h1>
              <p className="text-gray-600 text-sm">
                {conversation.title} • Started {formatTime(conversation.createdAt)}
              </p>
            </div>
          </div>

          {stats && stats.needsReviewCount > 0 && (
            <Button 
              onClick={markAllAsReviewed}
              disabled={reviewingAll}
              className="flex items-center gap-2"
            >
              <CheckCircleIcon className="h-4 w-4" />
              {reviewingAll ? 'Reviewing...' : `Mark All as Reviewed (${stats.needsReviewCount})`}
            </Button>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalMessages}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.userMessages}</div>
                  <div className="text-sm text-gray-600">Patient Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.assistantMessages}</div>
                  <div className="text-sm text-gray-600">AI Responses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.needsReviewCount}</div>
                  <div className="text-sm text-gray-600">Need Review</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.faqUsedCount}</div>
                  <div className="text-sm text-gray-600">FAQ Used</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Info */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                {conversation.patient.image ? (
                  <img 
                    src={conversation.patient.image} 
                    alt={conversation.patient.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-lg">
                    {getInitials(conversation.patient.name)}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {conversation.patient.name}
                </h3>
                <p className="text-gray-600">{conversation.patient.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <Card 
              key={message.id} 
              className={`bg-white border-gray-200 shadow-sm ${
                message.needsReview && !message.reviewedAt ? 'border-amber-300 bg-amber-50' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {message.role === 'user' ? (
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <BotIcon className="h-5 w-5 text-green-600" />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">
                        {message.role === 'user' ? conversation.patient.name : 'AI Assistant'}
                      </span>
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3" />
                        {formatTime(message.createdAt)}
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1">
                        {message.isFromFAQ && (
                          <Badge variant="outline" className="text-xs">
                            <BookOpenIcon className="h-3 w-3 mr-1" />
                            FAQ
                          </Badge>
                        )}
                        
                        {message.role === 'assistant' && message.confidence && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getConfidenceColor(message.confidence)}`}
                          >
                            <ActivityIcon className="h-3 w-3 mr-1" />
                            {getConfidenceText(message.confidence)}
                          </Badge>
                        )}
                        
                        {message.needsReview && !message.reviewedAt && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangleIcon className="h-3 w-3 mr-1" />
                            Needs Review
                          </Badge>
                        )}
                        
                        {message.reviewedAt && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Reviewed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Message Text */}
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* FAQ Reference */}
                    {message.faq && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-600 font-semibold mb-1">
                          Referenced FAQ ({message.faq.category})
                        </div>
                        <div className="text-sm text-blue-800">
                          <strong>Q:</strong> {message.faq.question}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {messages.length === 0 && (
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <MessageSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-600">
                This conversation hasn't started yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 