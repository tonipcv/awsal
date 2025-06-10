'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical, Save, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { 
  Cog6ToothIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DailyCheckinQuestion {
  id: string;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT' | 'YES_NO';
  options?: string;
  isRequired: boolean;
  order: number;
  isActive: boolean;
}

interface CheckinQuestionsManagerProps {
  protocolId: string;
}

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', description: 'Pre-defined options' },
  { value: 'SCALE', label: 'Scale', description: 'Numeric scale (e.g. 0-10)' },
  { value: 'YES_NO', label: 'Yes/No', description: 'Binary response' },
  { value: 'TEXT', label: 'Free Text', description: 'Open response' }
];

export default function CheckinQuestionsManager({ protocolId }: CheckinQuestionsManagerProps) {
  const [questions, setQuestions] = useState<DailyCheckinQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<DailyCheckinQuestion | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImprovingQuestion, setIsImprovingQuestion] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    type: 'MULTIPLE_CHOICE' as 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT' | 'YES_NO',
    options: '',
    isRequired: true
  });

  useEffect(() => {
    loadQuestions();
  }, [protocolId]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions`);
      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data.questions || []);
      } else {
        setError(data.error || 'Error loading questions');
      }
    } catch (error: any) {
      setError('Error loading questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    try {
      setError(null);
      
      // Prepare options based on type
      let optionsData = '';
      if (formData.type === 'MULTIPLE_CHOICE') {
        const options = formData.options.split('\n').filter(opt => opt.trim());
        optionsData = JSON.stringify(options);
      } else if (formData.type === 'SCALE') {
        optionsData = JSON.stringify({ min: 0, max: 10, step: 1 });
      }

      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          type: formData.type,
          options: optionsData,
          isRequired: formData.isRequired,
          order: questions.length
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setQuestions(prev => [...prev, data.question]);
        setIsCreating(false);
        setFormData({ question: '', type: 'MULTIPLE_CHOICE', options: '', isRequired: true });
      } else {
        setError(data.error || 'Error creating question');
      }
    } catch (error: any) {
      setError('Error creating question');
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      setError(null);
      
      let optionsData = editingQuestion.options;
      if (formData.type === 'MULTIPLE_CHOICE') {
        const options = formData.options.split('\n').filter(opt => opt.trim());
        optionsData = JSON.stringify(options);
      } else if (formData.type === 'SCALE') {
        optionsData = JSON.stringify({ min: 0, max: 10, step: 1 });
      }

      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: formData.question,
          type: formData.type,
          options: optionsData,
          isRequired: formData.isRequired
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? data.question : q));
        setEditingQuestion(null);
        setFormData({ question: '', type: 'MULTIPLE_CHOICE', options: '', isRequired: true });
      } else {
        setError(data.error || 'Error updating question');
      }
    } catch (error: any) {
      setError('Error updating question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions/${questionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setQuestions(prev => prev.filter(q => q.id !== questionId));
      } else {
        const data = await response.json();
        setError(data.error || 'Error deleting question');
      }
    } catch (error: any) {
      setError('Error deleting question');
    }
  };

  const startEditing = (question: DailyCheckinQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question: question.question,
      type: question.type,
      options: question.type === 'MULTIPLE_CHOICE' && question.options 
        ? JSON.parse(question.options).join('\n') 
        : '',
      isRequired: question.isRequired
    });
  };

  const cancelEditing = () => {
    setEditingQuestion(null);
    setIsCreating(false);
    setFormData({ question: '', type: 'MULTIPLE_CHOICE', options: '', isRequired: true });
    setError(null);
  };

  const improveQuestionWithAI = async () => {
    if (!formData.question.trim()) {
      alert('Enter a question before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingQuestion(true);
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.question,
          context: 'checkin_question'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.improvedText) {
        setFormData(prev => ({ ...prev, question: data.improvedText }));
      } else {
        alert('Error improving question with AI');
      }
    } catch (error) {
      console.error('Error improving question:', error);
      alert('Connection error when trying to improve question with AI');
    } finally {
      setIsImprovingQuestion(false);
    }
  };

  const renderQuestionForm = () => (
    <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900">
          {editingQuestion ? 'Edit Question' : 'New Question'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="question" className="text-gray-900 font-semibold">Question *</Label>
          <div className="relative">
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter your question..."
              className="min-h-[80px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl pr-12 resize-none"
            />
            {formData.question.trim() && (
              <button
                type="button"
                onClick={improveQuestionWithAI}
                disabled={isImprovingQuestion}
                className="absolute right-3 top-3 p-1.5 text-gray-400 hover:text-[#5154e7] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Improve with AI"
              >
                {isImprovingQuestion ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5154e7] border-t-transparent"></div>
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900 font-semibold">Question Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value: 'MULTIPLE_CHOICE' | 'SCALE' | 'TEXT' | 'YES_NO') => 
              setFormData(prev => ({ 
                ...prev, 
                type: value,
                options: value === 'MULTIPLE_CHOICE' ? prev.options : ''
              }))
            }
          >
            <SelectTrigger className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 rounded-xl h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {questionTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-gray-500">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            <Label className="text-gray-900 font-semibold">Options (one per line)</Label>
            <Textarea
              value={formData.options}
              onChange={(e) => setFormData(prev => ({ ...prev, options: e.target.value }))}
              placeholder="Full of energy&#10;Tired&#10;Headache&#10;Anxious"
              className="min-h-[100px] border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl resize-none"
            />
          </div>
        )}

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isRequired"
            checked={formData.isRequired}
            onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
            className="rounded border-gray-300 text-[#5154e7] focus:ring-[#5154e7]"
          />
          <Label htmlFor="isRequired" className="text-gray-900 font-medium">
            Required question
          </Label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
            disabled={!formData.question.trim()}
            className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl font-semibold"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {editingQuestion ? 'Update' : 'Create'} Question
          </Button>
          
          <Button
            variant="outline"
            onClick={cancelEditing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Cog6ToothIcon className="h-6 w-6 text-[#5154e7]" />
              Daily Check-in Questions
            </CardTitle>
            <p className="text-gray-600 font-medium mt-1">
              Configure questions for daily patient monitoring
            </p>
          </div>
          
          {!isCreating && !editingQuestion && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Question
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <XMarkIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-900">Error</h4>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {(isCreating || editingQuestion) && renderQuestionForm()}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5154e7] border-t-transparent"></div>
          </div>
        ) : questions.length === 0 && !isCreating ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
            <Cog6ToothIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No questions configured</h4>
            <p className="text-gray-600 mb-6">Create questions to track your patients' daily progress</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Question
            </Button>
          </div>
        ) : questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Configured Questions</h3>
              <Badge variant="secondary" className="bg-[#5154e7] text-white border-[#5154e7] font-semibold">
                {questions.length} {questions.length === 1 ? 'question' : 'questions'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <div key={question.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-500">
                        <GripVertical className="w-4 h-4" />
                        <span className="text-sm font-bold w-6 text-center">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {question.question}
                          {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            {questionTypes.find(t => t.value === question.type)?.label}
                          </Badge>
                          {question.type === 'MULTIPLE_CHOICE' && question.options && (
                            <span>{JSON.parse(question.options).length} options</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(question)}
                        className="text-gray-500 hover:text-[#5154e7] hover:bg-gray-100 rounded-lg h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 