'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isFromFAQ?: boolean;
  faq?: {
    question: string;
    category: string;
  };
  confidence?: number;
  needsReview?: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  doctorName: string;
  createdAt: string;
}

export default function PatientAIChatPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user?.id) {
      loadDoctorInfo();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDoctorInfo = async () => {
    try {
      const response = await fetch('/api/patient/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.user?.doctorId) {
          setDoctorId(data.user.doctorId);
          loadWelcomeMessage(data.user.doctorId);
        }
      }
    } catch (error) {
      console.error('Error loading doctor info:', error);
    }
  };

  const loadWelcomeMessage = async (docId: string) => {
    try {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! I am your doctor\'s AI assistant. How can I help you today? I can answer questions about your treatment, medications, and healthcare.',
        createdAt: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    } catch (error) {
      console.error('Error loading welcome message:', error);
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hello! How can I help you today?',
        createdAt: new Date().toISOString()
      };
      setMessages([welcomeMsg]);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !doctorId || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/patient/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          doctorId: doctorId,
          conversationId: conversation?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          confidence: data.confidence,
          needsReview: data.needsReview,
          createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);

        if (data.conversationId && !conversation) {
          setConversation({
            id: data.conversationId,
            title: currentMessage.slice(0, 50),
            doctorName: 'Seu Médico',
            createdAt: new Date().toISOString()
          });
        }

        if (data.needsReview) {
          toast.info('Your question has been forwarded to the doctor for review');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error sending message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!doctorId) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-teal-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🩺</span>
          </div>
          <h3 className="text-xl font-light text-white mb-3">
            Assistant Unavailable
          </h3>
          <p className="text-gray-400 leading-relaxed max-w-md">
            You need to be linked to a doctor to use the AI assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header fixo - minimalista */}
      <div className="flex-shrink-0 pt-[100px] lg:pt-8 lg:ml-64 px-4 lg:px-6 pb-6">
        <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-light text-white mb-2 tracking-tight">
            Medical Assistant
          </h1>
          <p className="text-gray-300 text-base lg:text-lg font-light">
            Available 24/7 to help you
          </p>
        </div>
      </div>

      {/* Área de mensagens - ocupa todo o espaço disponível */}
      <div className="flex-1 overflow-hidden lg:ml-64">
        <div className="h-full flex flex-col">
          
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-teal-400 to-teal-500 text-black'
                      : 'bg-gray-800/80 text-white border border-gray-700/50'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed text-base">
                    {message.content}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>{formatTime(message.createdAt)}</span>
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2">
                        {message.isFromFAQ && (
                          <Badge className="bg-teal-400/20 text-teal-300 border-teal-400/30 text-xs">
                            Quick
                          </Badge>
                        )}
                        {message.needsReview && (
                          <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-xs">
                            Review
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/80 rounded-2xl px-4 py-3 border border-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-gray-300 text-sm">Typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input fixo na parte inferior - com padding para mobile menu */}
          <div className="flex-shrink-0 border-t border-gray-800/50 bg-black/50 backdrop-blur-sm p-4 lg:p-6 pb-[100px] lg:pb-8">
            <div className="flex gap-3">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                disabled={loading}
                className="flex-1 bg-gray-800/60 border-gray-700/50 text-white placeholder-gray-400 rounded-2xl px-4 py-3 text-base focus:border-teal-400/50 focus:ring-teal-400/20 focus:bg-gray-800/80"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !currentMessage.trim()}
                size="icon"
                className="rounded-2xl w-12 h-12 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black shadow-lg disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This assistant uses AI and may make mistakes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 