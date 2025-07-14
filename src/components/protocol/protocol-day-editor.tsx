'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  PlayIcon,
  ShoppingBagIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

interface ProtocolDayEditorProps {
  days: any[];
  availableProducts: any[];
  addTask: (dayNumber: number, sessionId?: string) => void;
  removeTask: (dayNumber: number, taskId: string, sessionId?: string) => void;
  updateTask: (dayNumber: number, taskId: string, field: string, value: any, sessionId?: string) => void;
  reorderTasks: (dayNumber: number, sessionId: string, oldIndex: number, newIndex: number) => void;
  reorderSessions: (dayNumber: number, oldIndex: number, newIndex: number) => void;
  addSession: (dayNumber: number) => void;
  removeSession: (dayNumber: number, sessionId: string) => void;
  updateSession: (dayNumber: number, sessionId: string, field: string, value: string) => void;
  addDay: () => void;
  removeDay: (dayNumber: number) => void;
  duplicateDay: (dayNumber: number) => void;
  updateDay: (dayNumber: number, field: string, value: string) => void;
  protocol: any;
  setProtocol: (protocol: any) => void;
}

// Simple Task Component
function TaskItem({ task, dayNumber, sessionId, onUpdate, onRemove, availableProducts, dragHandleProps }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImprovingTitle, setIsImprovingTitle] = useState(false);
  const [isImprovingExplanation, setIsImprovingExplanation] = useState(false);

  const improveTitleWithAI = async () => {
    if (!task.title?.trim()) {
      alert('Please write something in the task title before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingTitle(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: task.title,
          context: 'task_title'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate('title', data.improvedText);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving task title:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingTitle(false);
    }
  };

  const improveExplanationWithAI = async () => {
    if (!task.fullExplanation?.trim()) {
      alert('Please write something in the full explanation before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingExplanation(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: task.fullExplanation,
          context: 'task_explanation'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate('fullExplanation', data.improvedText);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving task explanation:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingExplanation(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Task Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Drag to reorder"
              >
                <Bars3Icon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1 min-w-0 relative">
              <Input
                placeholder="Task title"
                value={task.title || ''}
                onChange={(e) => onUpdate('title', e.target.value)}
                className="border-0 p-0 h-auto text-sm font-medium bg-transparent focus:ring-0 focus:border-0 pr-8"
              />
              {task.title?.trim() && (
                <button
                  type="button"
                  onClick={improveTitleWithAI}
                  disabled={isImprovingTitle}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Improve title with AI"
                >
                  {isImprovingTitle ? (
                    <div className="h-3 w-3 animate-spin rounded-full border border-purple-600 border-t-transparent"></div>
                  ) : (
                    <SparklesIcon className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 h-6 w-6 p-0"
            >
              <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(task.id)}
              className="text-red-400 hover:text-red-600 hover:bg-red-50 h-6 w-6 p-0"
            >
              <TrashIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Extra Content Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={task.hasMoreInfo || false}
              onChange={(e) => onUpdate('hasMoreInfo', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <InformationCircleIcon className="h-4 w-4" />
              Add extra content
            </span>
          </div>

          {task.hasMoreInfo && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Video URL */}
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <PlayIcon className="h-4 w-4" />
                  Video URL
                </Label>
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={task.videoUrl || ''}
                  onChange={(e) => onUpdate('videoUrl', e.target.value)}
                  className="text-sm h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              {/* Full Explanation */}
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <InformationCircleIcon className="h-4 w-4" />
                  Full Explanation
                </Label>
                <div className="relative">
                  <Textarea
                    placeholder="Detailed explanation for this task..."
                    value={task.fullExplanation || ''}
                    onChange={(e) => onUpdate('fullExplanation', e.target.value)}
                    rows={3}
                    className="text-sm resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  {task.fullExplanation?.trim() && (
                    <button
                      type="button"
                      onClick={improveExplanationWithAI}
                      disabled={isImprovingExplanation}
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-purple-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                      title="Improve explanation with AI"
                    >
                      {isImprovingExplanation ? (
                        <div className="h-3 w-3 animate-spin rounded-full border border-purple-600 border-t-transparent"></div>
                      ) : (
                        <SparklesIcon className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Related Product */}
              <div>
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <ShoppingBagIcon className="h-4 w-4" />
                  Related Product
                </Label>
                <Select 
                  value={task.productId || 'none'} 
                  onValueChange={(value) => onUpdate('productId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No product</SelectItem>
                    {availableProducts.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Modal Configuration */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <Label className="text-sm font-semibold text-gray-800">Modal Configuration</Label>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Button Text</Label>
                    <Input
                      placeholder="Learn more"
                      value={task.modalButtonText || ''}
                      onChange={(e) => onUpdate('modalButtonText', e.target.value)}
                      className="text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Button URL</Label>
                    <Input
                      placeholder="https://example.com"
                      value={task.modalButtonUrl || ''}
                      onChange={(e) => onUpdate('modalButtonUrl', e.target.value)}
                      className="text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Day Title Editor Component
function DayTitleEditor({ day, onUpdate }: any) {
  const [isImprovingTitle, setIsImprovingTitle] = useState(false);

  const improveTitleWithAI = async () => {
    if (!day.title?.trim()) {
      alert('Please write something in the day title before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingTitle(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: day.title,
          context: 'day_title'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate('title', data.improvedText);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving day title:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingTitle(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 min-w-0 relative">
        <Input
          placeholder={`Day ${day.dayNumber}`}
          value={day.title || ''}
          onChange={(e) => onUpdate('title', e.target.value)}
          className="border-0 p-0 h-auto text-base font-semibold bg-transparent focus:ring-0 focus:border-0 pr-8 text-gray-900"
        />
        {day.title?.trim() && (
          <button
            type="button"
            onClick={improveTitleWithAI}
            disabled={isImprovingTitle}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Improve title with AI"
          >
            {isImprovingTitle ? (
              <div className="h-3 w-3 animate-spin rounded-full border border-purple-600 border-t-transparent"></div>
            ) : (
              <SparklesIcon className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Simple Session Component
function SessionItem({ session, dayNumber, onUpdate, onRemove, addTask, removeTask, updateTask, availableProducts, reorderTasks, dragHandleProps }: any) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImprovingName, setIsImprovingName] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = session.tasks.findIndex((task: any) => task.id === active.id);
      const newIndex = session.tasks.findIndex((task: any) => task.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTasks(dayNumber, session.id, oldIndex, newIndex);
      }
    }
  };

  const improveNameWithAI = async () => {
    if (!session.name?.trim()) {
      alert('Please write something in the session name before using AI to improve it.');
      return;
    }

    try {
      setIsImprovingName(true);
      
      const response = await fetch('/api/ai/improve-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: session.name,
          context: 'session_name'
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate('name', data.improvedText);
      } else {
        const errorData = await response.json();
        alert(`Error improving text: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error improving session name:', error);
      alert('Connection error while trying to improve text with AI.');
    } finally {
      setIsImprovingName(false);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-blue-50">
      {/* Session Header */}
      <div className="p-3 border-b border-blue-200 bg-blue-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 rounded"
                title="Drag to reorder"
              >
                <Bars3Icon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Input
                  placeholder="Session name"
                  value={session.name || ''}
                  onChange={(e) => onUpdate('name', e.target.value)}
                  className="border-0 p-0 h-auto text-sm font-medium bg-transparent focus:ring-0 focus:border-0 pr-8"
                />
                {session.name?.trim() && (
                  <button
                    type="button"
                    onClick={improveNameWithAI}
                    disabled={isImprovingName}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-purple-600 hover:bg-gray-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Improve name with AI"
                  >
                    {isImprovingName ? (
                      <div className="h-3 w-3 animate-spin rounded-full border border-purple-600 border-t-transparent"></div>
                    ) : (
                      <SparklesIcon className="h-3 w-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Badge variant="secondary" className="text-xs">
              {session.tasks.length} tasks
            </Badge>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
            >
              <ChevronDownIcon 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-red-500 hover:text-red-700 rounded"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Session Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={session.tasks.map((task: any) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {session.tasks.map((task: any) => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  dayNumber={dayNumber}
                  sessionId={session.id}
                  onUpdate={(field: string, value: any) => updateTask(dayNumber, task.id, field, value, session.id)}
                  onRemove={() => removeTask(dayNumber, task.id, session.id)}
                  availableProducts={availableProducts}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => addTask(dayNumber, session.id)}
            className="w-full h-8 text-sm border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Add Task to Session
          </Button>
        </div>
      )}
    </div>
  );
}

// Sortable Task Item Component
function SortableTaskItem({ task, dayNumber, sessionId, onUpdate, onRemove, availableProducts }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <TaskItem
        task={task}
        dayNumber={dayNumber}
        sessionId={sessionId}
        onUpdate={onUpdate}
        onRemove={onRemove}
        availableProducts={availableProducts}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Sortable Session Component
function SortableSessionItem({ session, dayNumber, onUpdate, onRemove, addTask, removeTask, updateTask, availableProducts, reorderTasks }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'z-50' : ''}>
      <SessionItem
        session={session}
        dayNumber={dayNumber}
        onUpdate={onUpdate}
        onRemove={onRemove}
        addTask={addTask}
        removeTask={removeTask}
        updateTask={updateTask}
        availableProducts={availableProducts}
        reorderTasks={reorderTasks}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Main Component
export function ProtocolDayEditor({
  days,
  availableProducts,
  addTask,
  removeTask,
  updateTask,
  reorderTasks,
  reorderSessions,
  addSession,
  removeSession,
  updateSession,
  addDay,
  removeDay,
  duplicateDay,
  updateDay,
  protocol,
  setProtocol
}: ProtocolDayEditorProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSessionDragEnd = (event: DragEndEvent, dayNumber: number) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const day = days.find(d => d.dayNumber === dayNumber);
      if (!day) return;

      const oldIndex = day.sessions.findIndex((session: any) => session.id === active.id);
      const newIndex = day.sessions.findIndex((session: any) => session.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSessions(dayNumber, oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Protocol Schedule</h3>
          <p className="text-sm text-gray-500">
            {days.length} {days.length === 1 ? 'day' : 'days'} configured
          </p>
        </div>
        <Button
          onClick={addDay}
          className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 text-sm rounded-lg"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Day
        </Button>
      </div>

      {/* Empty State */}
      {days.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <PlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No days configured</h4>
          <p className="text-gray-500 mb-4">Start by adding the first day of your protocol</p>
          <Button
            onClick={addDay}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add First Day
          </Button>
        </div>
      )}

      {/* Days List */}
      {days.map((day) => {
        const isDayExpanded = expandedDays.has(day.id);
        
        return (
          <Card key={day.id} className="border-gray-200 shadow-sm">
            <CardHeader 
              className="hover:bg-gray-50 transition-colors py-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleDay(day.id)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <ChevronDownIcon 
                      className={`h-5 w-5 transition-transform ${
                        isDayExpanded ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <DayTitleEditor
                      day={day}
                      onUpdate={(field: string, value: string) => updateDay(day.dayNumber, field, value)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {day.sessions.length} sessions • {day.sessions.reduce((total: number, session: any) => total + session.tasks.length, 0)} total tasks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSession(day.dayNumber);
                    }}
                    className="h-7 px-2 text-xs border-gray-300"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateDay(day.dayNumber);
                    }}
                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-gray-300"
                    title="Duplicate this day"
                  >
                    <DocumentDuplicateIcon className="h-3 w-3" />
                  </Button>
                  {days.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDay(day.dayNumber);
                      }}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {isDayExpanded && (
              <CardContent className="space-y-4 pt-0">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleSessionDragEnd(event, day.dayNumber)}
                >
                  <SortableContext
                    items={day.sessions.map((session: any) => session.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {day.sessions.map((session: any) => (
                      <SortableSessionItem
                        key={session.id}
                        session={session}
                        dayNumber={day.dayNumber}
                        onUpdate={(field: string, value: string) => updateSession(day.dayNumber, session.id, field, value)}
                        onRemove={() => removeSession(day.dayNumber, session.id)}
                        addTask={addTask}
                        removeTask={removeTask}
                        updateTask={updateTask}
                        availableProducts={availableProducts}
                        reorderTasks={reorderTasks}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
} 