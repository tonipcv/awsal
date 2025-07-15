'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface CheckinQuestion {
  id: string;
  question: string;
  type: string;
  options?: string;
  order: number;
}

interface CheckinQuestionsManagerProps {
  protocolId: string;
}

export default function CheckinQuestionsManager({ protocolId }: CheckinQuestionsManagerProps) {
  const [questions, setQuestions] = useState<CheckinQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, Record<string, any>>>({});
  const [focusNewQuestion, setFocusNewQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (focusNewQuestion) {
      const inputElement = document.querySelector(`input[data-question-id="${focusNewQuestion}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
        setFocusNewQuestion(null);
      }
    }
  }, [focusNewQuestion]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch questions');
      }

      setQuestions(data.questions || []);
      
      // Initialize editing values
      const initialValues = (data.questions || []).reduce((acc: Record<string, Record<string, any>>, question: CheckinQuestion) => {
        acc[question.id] = {
          question: question.question,
          type: question.type,
          options: question.options || '',
        };
        return acc;
      }, {});
      setEditingValues(initialValues);
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [protocolId]);

  const addQuestion = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: 'Nova pergunta',
          type: 'TEXT',
          order: questions.length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `Dados inválidos: ${data.details.map((e: any) => e.message).join(', ')}` 
          : data.error || 'Falha ao adicionar questão';
        throw new Error(errorMessage);
      }

      setQuestions([...questions, data.question]);
      setEditingValues(prev => ({
        ...prev,
        [data.question.id]: {
          question: data.question.question,
          type: data.question.type,
          options: data.question.options || '',
        }
      }));
      setFocusNewQuestion(data.question.id);
    } catch (error: any) {
      console.error('Error adding question:', error);
      setError(error.message || 'Falha ao adicionar questão. Por favor, tente novamente.');
    }
  };

  const updateQuestion = async (questionId: string, field: string, value: any) => {
    // Update local state immediately
    setEditingValues(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const saveQuestion = async (questionId: string) => {
    try {
      setError(null);
      const values = editingValues[questionId];
      
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `Dados inválidos: ${data.details.map((e: any) => e.message).join(', ')}` 
          : data.error || 'Falha ao atualizar questão';
        throw new Error(errorMessage);
      }

      setQuestions(questions.map(q => 
        q.id === questionId ? { ...q, ...values } : q
      ));
    } catch (error: any) {
      console.error('Error updating question:', error);
      setError(error.message || 'Falha ao atualizar questão. Por favor, tente novamente.');
      
      // Reverter as alterações locais em caso de erro
      const question = questions.find(q => q.id === questionId);
      if (question) {
        setEditingValues(prev => ({
          ...prev,
          [questionId]: {
            question: question.question,
            type: question.type,
            options: question.options || '',
          }
        }));
      }
    }
  };

  const removeQuestion = async (questionId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions/${questionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `Dados inválidos: ${data.details.map((e: any) => e.message).join(', ')}` 
          : data.error || 'Falha ao remover questão';
        throw new Error(errorMessage);
      }

        setQuestions(questions.filter(q => q.id !== questionId));
        // Remove from editing values
        setEditingValues(prev => {
          const newValues = { ...prev };
          delete newValues[questionId];
          return newValues;
        });
    } catch (error: any) {
      console.error('Error removing question:', error);
      setError(error.message || 'Falha ao remover questão. Por favor, tente novamente.');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setQuestions(updatedItems);

    try {
      setError(null);
      const response = await fetch(`/api/protocols/${protocolId}/checkin-questions/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questions: updatedItems }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to reorder questions');
        // Revert the changes if the API call fails
        setQuestions(questions);
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
      setError('Failed to reorder questions. Please try again.');
      // Revert the changes if the API call fails
      setQuestions(questions);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-96 mt-1" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-white rounded-lg border">
                    <div className="space-y-4">
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-10" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-10" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-64" />
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <Skeleton className="h-5 w-16 mb-2" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
            <Button 
              onClick={fetchQuestions}
              className="mt-4"
              variant="outline"
          size="sm"
            >
          Tentar Novamente
            </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium leading-none">Check-in Questions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure the questions that patients will answer during their daily check-ins
                </p>
              </div>
              <Button onClick={addQuestion}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start by adding your first check-in question
                </p>
                <Button onClick={addQuestion}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="questions">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {questions.map((question, index) => (
                        <Draggable key={question.id} draggableId={question.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-4 bg-white rounded-lg border"
                            >
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">Question</Label>
                                  <Input
                                    value={editingValues[question.id]?.question || ''}
                                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                                    onBlur={() => saveQuestion(question.id)}
                                    className="mt-1"
                                    data-question-id={question.id}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Type</Label>
                                    <Select
                                      value={editingValues[question.id]?.type || 'TEXT'}
                                      onValueChange={(value) => {
                                        updateQuestion(question.id, 'type', value);
                                        saveQuestion(question.id);
                                      }}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="TEXT">Text</SelectItem>
                                        <SelectItem value="YES_NO">Yes/No</SelectItem>
                                        <SelectItem value="SCALE">Scale (1-5)</SelectItem>
                                        <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {editingValues[question.id]?.type === 'MULTIPLE_CHOICE' && (
                                    <div>
                                      <Label className="text-sm font-medium">Options (comma-separated)</Label>
                                      <Input
                                        value={editingValues[question.id]?.options || ''}
                                        onChange={(e) => updateQuestion(question.id, 'options', e.target.value)}
                                        onBlur={() => saveQuestion(question.id)}
                                        placeholder="Option 1, Option 2, Option 3"
                                        className="mt-1"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    {/* Removido os switches de Required e Active */}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(question.id)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium leading-none">Settings Help</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Learn how to configure check-in questions effectively
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium leading-none mb-2">Question Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li><strong>Text:</strong> Free-form text response</li>
                    <li><strong>Yes/No:</strong> Simple yes or no answer</li>
                    <li><strong>Scale:</strong> Rating from 1 to 5</li>
                    <li><strong>Multiple Choice:</strong> Select from options</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg border">
                  <h4 className="text-sm font-medium leading-none mb-2">Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>Keep questions clear and concise</li>
                    <li>Organize questions in a logical order</li>
                    <li>Limit the number of questions to avoid fatigue</li>
                    <li>Use appropriate question types for better responses</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 