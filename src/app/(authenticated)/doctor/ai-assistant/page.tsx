'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ChatBubbleLeftRightIcon, 
  CogIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Bot } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
  isActive: boolean;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

interface AISettings {
  id: string;
  isEnabled: boolean;
  autoReplyEnabled: boolean;
  confidenceThreshold: number;
  businessHoursOnly: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  welcomeMessage: string;
  fallbackMessage: string;
  maxDailyMessages: number;
}

const categories = [
  { value: 'general', label: 'Geral' },
  { value: 'protocol', label: 'Protocolos' },
  { value: 'medication', label: 'Medicamentos' },
  { value: 'emergency', label: 'Emergência' },
  { value: 'appointment', label: 'Consultas' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'exercise', label: 'Exercícios' }
];

export default function AIAssistantPage() {
  const { data: session } = useSession();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  // Form states
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'general',
    priority: 0,
    tags: ''
  });

  useEffect(() => {
    if (session?.user?.id) {
      loadFaqs();
      loadSettings();
    }
  }, [session]);

  const showNotificationMessage = (message: string, type: 'success' | 'error' = 'success') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const loadFaqs = async () => {
    try {
      const response = await fetch('/api/doctor/faq');
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
      showNotificationMessage('Erro ao carregar FAQs', 'error');
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/doctor/ai-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showNotificationMessage('Erro ao carregar configurações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFaq = async () => {
    try {
      const url = editingFaq ? `/api/doctor/faq/${editingFaq.id}` : '/api/doctor/faq';
      const method = editingFaq ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqForm)
      });

      if (response.ok) {
        showNotificationMessage(editingFaq ? 'FAQ atualizado!' : 'FAQ criado!');
        setIsDialogOpen(false);
        setEditingFaq(null);
        setFaqForm({ question: '', answer: '', category: 'general', priority: 0, tags: '' });
        loadFaqs();
      } else {
        showNotificationMessage('Erro ao salvar FAQ', 'error');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      showNotificationMessage('Erro ao salvar FAQ', 'error');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este FAQ?')) return;

    try {
      const response = await fetch(`/api/doctor/faq/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showNotificationMessage('FAQ deletado!');
        loadFaqs();
      } else {
        showNotificationMessage('Erro ao deletar FAQ', 'error');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      showNotificationMessage('Erro ao deletar FAQ', 'error');
    }
  };

  const handleEditFaq = (faq: FAQ) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      priority: faq.priority,
      tags: faq.tags || ''
    });
    setIsDialogOpen(true);
  };

  const handleToggleFaq = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/doctor/faq/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        showNotificationMessage('FAQ atualizado!');
        loadFaqs();
      }
    } catch (error) {
      console.error('Error toggling FAQ:', error);
      showNotificationMessage('Erro ao atualizar FAQ', 'error');
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<AISettings>) => {
    try {
      const response = await fetch('/api/doctor/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        showNotificationMessage('Configurações atualizadas!');
      } else {
        showNotificationMessage('Erro ao atualizar configurações', 'error');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showNotificationMessage('Erro ao atualizar configurações', 'error');
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    selectedCategory === 'all' || faq.category === selectedCategory
  );

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
                <div className="h-10 bg-gray-100 rounded-xl w-20 animate-pulse"></div>
              </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="h-12 bg-gray-100 rounded-xl mb-6 animate-pulse"></div>

            {/* Content Skeleton */}
            <div className="bg-white border border-gray-200 shadow-lg rounded-2xl p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
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
          
          {/* Notification */}
          {showNotification && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border ${
              notificationType === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {notificationType === 'error' && <ExclamationTriangleIcon className="h-5 w-5" />}
                <span className="font-medium">{notificationMessage}</span>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                AI Assistant
              </h1>
              <p className="text-gray-600 font-medium">
                Configure your AI assistant and manage frequently asked questions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={settings?.isEnabled ? "default" : "secondary"}
                className={settings?.isEnabled 
                  ? "bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-xl font-semibold"
                  : "bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl font-semibold"
                }
              >
                {settings?.isEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          <Tabs defaultValue="faqs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl h-12">
              <TabsTrigger 
                value="faqs" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-semibold"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                FAQs
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-semibold"
              >
                <CogIcon className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-semibold"
              >
                <ChartBarIcon className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="faqs" className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="border-b border-gray-100 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Frequently Asked Questions
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-1 font-medium">
                        Manage questions and answers that the AI will use to respond to your patients
                      </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 shadow-md font-semibold"
                          onClick={() => {
                            setEditingFaq(null);
                            setFaqForm({ question: '', answer: '', category: 'general', priority: 0, tags: '' });
                          }}
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          New FAQ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl rounded-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-semibold">
                            {editingFaq ? 'Edit FAQ' : 'New FAQ'}
                          </DialogTitle>
                          <DialogDescription>
                            Add a frequently asked question and its answer
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="question" className="text-sm font-medium text-gray-700">Question</Label>
                            <Input
                              id="question"
                              value={faqForm.question}
                              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                              placeholder="Ex: How should I take the medication?"
                              className="mt-1 rounded-xl border-gray-200"
                            />
                          </div>
                          <div>
                            <Label htmlFor="answer" className="text-sm font-medium text-gray-700">Answer</Label>
                            <Textarea
                              id="answer"
                              value={faqForm.answer}
                              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                              placeholder="Detailed answer..."
                              rows={4}
                              className="mt-1 rounded-xl border-gray-200"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category</Label>
                              <Select
                                value={faqForm.category}
                                onValueChange={(value) => setFaqForm({ ...faqForm, category: value })}
                              >
                                <SelectTrigger className="mt-1 rounded-xl border-gray-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                                Priority: {faqForm.priority}
                              </Label>
                              <Input
                                id="priority"
                                type="number"
                                value={faqForm.priority}
                                onChange={(e) => setFaqForm({ ...faqForm, priority: parseInt(e.target.value) })}
                                min="0"
                                max="10"
                                className="mt-1 rounded-xl border-gray-200"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">Tags (comma separated)</Label>
                            <Input
                              id="tags"
                              value={faqForm.tags}
                              onChange={(e) => setFaqForm({ ...faqForm, tags: e.target.value })}
                              placeholder="medication, dosage, effects"
                              className="mt-1 rounded-xl border-gray-200"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsDialogOpen(false)}
                            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-semibold"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSaveFaq}
                            className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl font-semibold"
                          >
                            {editingFaq ? 'Update' : 'Create'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full lg:w-48 rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="outline" className="border-gray-300 text-gray-700 bg-white px-4 py-2 rounded-xl font-semibold">
                      {filteredFaqs.length} FAQs
                    </Badge>
                  </div>

                  <div className="space-y-6">
                    {filteredFaqs.map((faq) => (
                      <Card key={faq.id} className={`bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow ${!faq.isActive ? 'opacity-60' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge variant="outline" className="text-xs font-semibold border-gray-300 text-gray-700 bg-white px-3 py-1 rounded-xl">
                                  {categories.find(c => c.value === faq.category)?.label}
                                </Badge>
                                {faq.priority > 0 && (
                                  <Badge variant="secondary" className="text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-xl">
                                    Priority {faq.priority}
                                  </Badge>
                                )}
                                <Switch
                                  checked={faq.isActive}
                                  onCheckedChange={() => handleToggleFaq(faq.id, faq.isActive)}
                                />
                              </div>
                              <h3 className="text-xl font-bold mb-3 text-gray-900">{faq.question}</h3>
                              <p className="text-gray-600 mb-4 font-medium">{faq.answer}</p>
                              {faq.tags && (
                                <div className="flex flex-wrap gap-2">
                                  {faq.tags.split(',').map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                                      {tag.trim()}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditFaq(faq)}
                                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredFaqs.length === 0 && (
                      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                        <CardContent className="p-8">
                          <div className="text-center">
                            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2 text-gray-900">
                              No FAQs found
                            </h3>
                            <p className="text-sm text-gray-500 mb-4 font-medium">
                              Start by creating your first FAQ for the AI assistant
                            </p>
                            <Button 
                              onClick={() => setIsDialogOpen(true)}
                              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl shadow-md font-semibold"
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Create first FAQ
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              {settings && (
                <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="border-b border-gray-100 p-6">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Assistant Settings
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1 font-medium">
                      Configure how the AI assistant will interact with your patients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <Label htmlFor="enabled" className="text-sm font-medium text-gray-900">Assistant Active</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Enable or disable the AI assistant
                        </p>
                      </div>
                      <Switch
                        id="enabled"
                        checked={settings.isEnabled}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({ isEnabled: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <Label htmlFor="autoReply" className="text-sm font-medium text-gray-900">Auto Reply</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Automatically respond when confidence is high
                        </p>
                      </div>
                      <Switch
                        id="autoReply"
                        checked={settings.autoReplyEnabled}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({ autoReplyEnabled: checked })
                        }
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-900">
                        Confidence Threshold: {settings.confidenceThreshold}
                      </Label>
                      <p className="text-sm text-gray-600">
                        Minimum confidence for automatic response (0-1)
                      </p>
                      <Input
                        id="confidenceThreshold"
                        type="number"
                        value={settings.confidenceThreshold}
                        onChange={(e) => 
                          handleUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })
                        }
                        min="0"
                        max="1"
                        step="0.01"
                        className="rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div>
                        <Label htmlFor="businessHours" className="text-sm font-medium text-gray-900">Business Hours Only</Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Respond only during configured hours
                        </p>
                      </div>
                      <Switch
                        id="businessHours"
                        checked={settings.businessHoursOnly}
                        onCheckedChange={(checked) => 
                          handleUpdateSettings({ businessHoursOnly: checked })
                        }
                      />
                    </div>

                    {settings.businessHoursOnly && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Start Time</Label>
                          <Input
                            id="startTime"
                            type="time"
                            value={settings.businessHoursStart}
                            onChange={(e) => 
                              handleUpdateSettings({ businessHoursStart: e.target.value })
                            }
                            className="mt-1 rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700"
                          />
                        </div>
                        <div>
                          <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">End Time</Label>
                          <Input
                            id="endTime"
                            type="time"
                            value={settings.businessHoursEnd}
                            onChange={(e) => 
                              handleUpdateSettings({ businessHoursEnd: e.target.value })
                            }
                            className="mt-1 rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label htmlFor="maxMessages" className="text-sm font-medium text-gray-700">Maximum Messages per Day</Label>
                      <Input
                        id="maxMessages"
                        type="number"
                        value={settings.maxDailyMessages}
                        onChange={(e) => 
                          handleUpdateSettings({ maxDailyMessages: parseInt(e.target.value) })
                        }
                        min="1"
                        max="200"
                        className="rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="welcomeMessage" className="text-sm font-medium text-gray-700">Welcome Message</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={settings.welcomeMessage}
                        onChange={(e) => 
                          handleUpdateSettings({ welcomeMessage: e.target.value })
                        }
                        rows={3}
                        className="rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="fallbackMessage" className="text-sm font-medium text-gray-700">Fallback Message</Label>
                      <Textarea
                        id="fallbackMessage"
                        value={settings.fallbackMessage}
                        onChange={(e) => 
                          handleUpdateSettings({ fallbackMessage: e.target.value })
                        }
                        rows={3}
                        className="rounded-xl border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-700"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="border-b border-gray-100 p-6">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Reports and Analytics
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-1 font-medium">
                    View AI assistant usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2 text-gray-900">
                      Reports in Development
                    </h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Soon you'll be able to view detailed statistics about assistant usage
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 