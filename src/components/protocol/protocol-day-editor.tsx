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
  ShoppingBagIcon
} from '@heroicons/react/24/outline';

interface ProtocolDayEditorProps {
  days: any[];
  availableProducts: any[];
  addTask: (dayNumber: number, sessionId?: string) => void;
  removeTask: (dayNumber: number, taskId: string, sessionId?: string) => void;
  updateTask: (dayNumber: number, taskId: string, field: string, value: any, sessionId?: string) => void;
  addSession: (dayNumber: number) => void;
  removeSession: (dayNumber: number, sessionId: string) => void;
  updateSession: (dayNumber: number, sessionId: string, field: string, value: string) => void;
  moveTaskToSession: (dayNumber: number, taskId: string, targetSessionId: string) => void;
  moveTaskFromSession: (dayNumber: number, taskId: string, sourceSessionId: string) => void;
  addDay: () => void;
  removeDay: (dayNumber: number) => void;
}

// Simple Task Component
function TaskItem({ task, dayNumber, sessionId, onUpdate, onRemove, availableProducts }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Task Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Task title"
              value={task.title || ''}
              onChange={(e) => onUpdate('title', e.target.value)}
              className="border-0 p-0 h-auto text-sm font-medium bg-transparent focus:ring-0 focus:border-0"
            />
          </div>
          <div className="flex items-center gap-1 ml-2">
            {task.hasMoreInfo && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                Extra Content
              </Badge>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <ChevronDownIcon 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
            <button
              onClick={onRemove}
              className="p-1 text-red-400 hover:text-red-600 rounded"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="p-3 space-y-3">
        <Textarea
          placeholder="Task description"
          value={task.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          rows={2}
          className="text-sm resize-none border-gray-200 rounded-md"
        />

        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
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
                  <Textarea
                    placeholder="Detailed explanation for this task..."
                    value={task.fullExplanation || ''}
                    onChange={(e) => onUpdate('fullExplanation', e.target.value)}
                    rows={3}
                    className="text-sm resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Related Product */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                    <ShoppingBagIcon className="h-4 w-4" />
                    Related Product (optional)
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
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                            {product.brand && (
                              <span className="text-xs text-gray-500">({product.brand})</span>
                            )}
                          </div>
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
                      <Label className="text-xs text-gray-600 mb-1 block">Modal Title</Label>
                      <Input
                        placeholder="Custom modal title"
                        value={task.modalTitle || ''}
                        onChange={(e) => onUpdate('modalTitle', e.target.value)}
                        className="text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Button Text</Label>
                      <Input
                        placeholder="Learn more"
                        value={task.modalButtonText || ''}
                        onChange={(e) => onUpdate('modalButtonText', e.target.value)}
                        className="text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
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

                {/* Additional Options */}
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <Label className="text-sm font-semibold text-gray-800">Additional Options</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.isOptional || false}
                        onChange={(e) => onUpdate('isOptional', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Mark as optional task</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.requiresConfirmation || false}
                        onChange={(e) => onUpdate('requiresConfirmation', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Requires confirmation to complete</span>
                    </div>
                  </div>
                </div>

                {/* Task Timing */}
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <Label className="text-sm font-semibold text-gray-800">Task Timing</Label>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Estimated Duration (minutes)</Label>
                      <Input
                        type="number"
                        placeholder="15"
                        value={task.estimatedDuration || ''}
                        onChange={(e) => onUpdate('estimatedDuration', e.target.value)}
                        className="text-sm h-8 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">Best Time</Label>
                      <Select 
                        value={task.bestTime || 'anytime'} 
                        onValueChange={(value) => onUpdate('bestTime', value)}
                      >
                        <SelectTrigger className="h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="anytime">Anytime</SelectItem>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Session Component
function SessionItem({ session, dayNumber, onUpdate, onRemove, addTask, removeTask, updateTask, availableProducts }: any) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-300 rounded-lg bg-blue-50">
      {/* Session Header */}
      <div className="p-3 border-b border-blue-200 bg-blue-100 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 space-y-1">
            <Input
              placeholder="Session name"
              value={session.name || ''}
              onChange={(e) => onUpdate('name', e.target.value)}
              className="border-0 p-0 h-auto text-sm font-medium bg-transparent focus:ring-0 focus:border-0"
            />
            <Input
              placeholder="Session description"
              value={session.description || ''}
              onChange={(e) => onUpdate('description', e.target.value)}
              className="border-0 p-0 h-auto text-xs bg-transparent focus:ring-0 focus:border-0 text-gray-600"
            />
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
          {session.tasks.map((task: any) => (
            <TaskItem
              key={task.id}
              task={task}
              dayNumber={dayNumber}
              sessionId={session.id}
              onUpdate={(field: string, value: any) => updateTask(dayNumber, task.id, field, value, session.id)}
              onRemove={() => removeTask(dayNumber, task.id, session.id)}
              availableProducts={availableProducts}
            />
          ))}
          
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

// Main Component
export function ProtocolDayEditor({
  days,
  availableProducts,
  addTask,
  removeTask,
  updateTask,
  addSession,
  removeSession,
  updateSession,
  addDay,
  removeDay
}: ProtocolDayEditorProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleDay = useCallback((dayId: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayId)) {
        newSet.delete(dayId);
      } else {
        newSet.add(dayId);
      }
      return newSet;
    });
  }, []);

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
              className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
              onClick={() => toggleDay(day.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChevronDownIcon 
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isDayExpanded ? 'rotate-180' : ''
                    }`} 
                  />
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Day {day.dayNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {day.sessions.length} sessions • {day.sessions.reduce((total: number, session: any) => total + session.tasks.length, 0) + day.tasks.length} total tasks
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
                {/* Sessions */}
                {day.sessions.map((session: any) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    dayNumber={day.dayNumber}
                    onUpdate={(field: string, value: string) => updateSession(day.dayNumber, session.id, field, value)}
                    onRemove={() => removeSession(day.dayNumber, session.id)}
                    addTask={addTask}
                    removeTask={removeTask}
                    updateTask={updateTask}
                    availableProducts={availableProducts}
                  />
                ))}

                {/* Direct Tasks */}
                {day.tasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Direct Tasks
                      </Badge>
                    </div>
                    {day.tasks.map((task: any) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        dayNumber={day.dayNumber}
                        onUpdate={(field: string, value: any) => updateTask(day.dayNumber, task.id, field, value)}
                        onRemove={() => removeTask(day.dayNumber, task.id)}
                        availableProducts={availableProducts}
                      />
                    ))}
                  </div>
                )}
                
                {/* Add Direct Task Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addTask(day.dayNumber)}
                  className="w-full h-10 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Direct Task to Day {day.dayNumber}
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
} 