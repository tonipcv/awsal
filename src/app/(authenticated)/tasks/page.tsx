'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, CheckIcon, TrashIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Pomodoro from '@/components/Pomodoro';

const fontStyles = {
  primary: 'font-satoshi tracking-[-0.03em]',
  secondary: 'font-satoshi tracking-[-0.02em] font-light'
};

interface Task {
  id: string;
  userId: string;
  title: string;
  dueDate: string | Date;
  isCompleted: boolean;
  importance: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface DayStars {
  [key: string]: number;
}

const importanceEmojis = {
  1: '||||',
  2: '|||',
  3: '||',
  4: '|',
};

const importanceLabels = {
  1: 'Urgent and Important',
  2: 'Important not Urgent',
  3: 'Urgent not Important',
  4: 'Neither Urgent nor Important',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayStars, setDayStars] = useState<DayStars>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    importance: 1
  });
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date();
  const currentDateKey = format(currentDate, 'yyyy-MM-dd');
  const currentDayName = format(currentDate, 'EEEE').toLowerCase();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const todayIndex = weekDays.indexOf(currentDayName);
      const scrollPosition = todayIndex * scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  }, [isMobile, currentDayName]);

  // Calcular progresso da semana
  const calculateWeekProgress = () => {
    const startDate = startOfWeek(new Date());
    const endDate = endOfWeek(new Date());
    
    const weekTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= startDate && taskDate <= endDate;
    });

    if (weekTasks.length === 0) return 0;

    const completedTasks = weekTasks.filter(task => task.isCompleted).length;
    return Math.round((completedTasks / weekTasks.length) * 100);
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const [tasksResponse, starsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/pomodoro-stars')
      ]);
      
      const [tasksData, starsData] = await Promise.all([
        tasksResponse.json(),
        starsResponse.json()
      ]);

      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      }
      
      setDayStars(starsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Função para adicionar estrela ao dia
  const addStarToDay = async (date: string) => {
    try {
      const response = await fetch('/api/pomodoro-stars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });

      if (!response.ok) {
        throw new Error('Failed to save pomodoro star');
      }

      const { totalStars } = await response.json();
      
      setDayStars(prev => ({
        ...prev,
        [date]: totalStars
      }));
    } catch (error) {
      console.error('Error saving pomodoro star:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          return;
        }

        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === editingTask.id ? updatedTask : task
        ));
      } else {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          return;
        }

        const task = await response.json();
        setTasks(prev => [...prev, task]);
      }

      setNewTask({
        title: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        importance: 1
      });
      setEditingTask(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
      importance: task.importance
    });
    setIsModalOpen(true);
  };

  const toggleTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: 'PUT'
      });
      
      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        ));
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Ordenar tarefas por importância e data
  const sortedTasks = [...tasks].sort((a, b) => {
    // Primeiro, ordenar por status de conclusão
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    // Depois, ordenar por importância
    if (a.importance !== b.importance) {
      return a.importance - b.importance;
    }
    // Por fim, ordenar por data
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Agrupar tarefas por semana e dia
  const groupedTasks = sortedTasks.reduce((groups, task) => {
    const taskDate = new Date(task.dueDate);
    const weekStart = startOfWeek(taskDate, { weekStartsOn: 1 }); // 1 = Monday
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    const dayKey = format(taskDate, 'EEEE').toLowerCase();
    
    if (!groups[weekKey]) {
      groups[weekKey] = {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      };
    }
    groups[weekKey][dayKey].push(task);
    return groups;
  }, {} as Record<string, Record<string, Task[]>>);

  // Ordenar as semanas
  const sortedWeeks = Object.keys(groupedTasks).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Reordenar os dias da semana começando pelo dia atual
  const currentDayIndex = weekDays.indexOf(currentDayName);
  const reorderedWeekDays = [
    ...weekDays.slice(currentDayIndex),
    ...weekDays.slice(0, currentDayIndex)
  ];

  // Função para mudar o dia
  const changeDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 pb-2 lg:pb-4 sticky top-0 bg-background z-20 pt-[72px] lg:pt-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <CardTitle className={`text-xs font-normal text-white/70 ${fontStyles.secondary}`}>
              {isMobile ? format(selectedDate, 'EEEE, MMM d') : 'Eisenhower Matrix'}
            </CardTitle>
            {isMobile && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={() => changeDay('prev')}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent hover:bg-white/5 h-8 px-3"
                  onClick={() => setSelectedDate(new Date())}
                >
                  <span className={`text-xs ${fontStyles.secondary}`}>Today</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={() => changeDay('next')}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Dialog open={isModalOpen} onOpenChange={(open) => {
              if (!open) {
                setEditingTask(null);
                setNewTask({
                  title: '',
                  dueDate: format(new Date(), 'yyyy-MM-dd'),
                  importance: 1
                });
              }
              setIsModalOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className={`text-base font-medium ${fontStyles.primary}`}>
                    {editingTask ? 'Edit Task' : 'New Task'}
                  </DialogTitle>
                  <DialogDescription className={`text-sm text-muted-foreground ${fontStyles.secondary}`}>
                    {editingTask ? 'Edit your task details' : 'Add a new task to your Eisenhower matrix'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className={`text-sm ${fontStyles.secondary}`}>Task title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Ex: Prepare presentation"
                      className={`text-sm ${fontStyles.secondary}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate" className={`text-sm ${fontStyles.secondary}`}>Due date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className={`text-sm ${fontStyles.secondary}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className={`text-sm ${fontStyles.secondary}`}>Quadrant</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {[1, 2, 3, 4].map((level) => (
                        <Button
                          key={level}
                          type="button"
                          variant={newTask.importance === level ? 'default' : 'outline'}
                          className={cn(
                            "text-sm justify-start h-auto py-3 w-full",
                            newTask.importance === level 
                              ? "border-turquoise bg-turquoise/10 hover:bg-turquoise/20 text-white" 
                              : "text-muted-foreground hover:text-white"
                          )}
                          onClick={() => setNewTask({ ...newTask, importance: level })}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base font-mono text-turquoise">
                              {importanceEmojis[level as keyof typeof importanceEmojis]}
                            </span>
                            <span className="text-sm leading-tight">
                              {importanceLabels[level as keyof typeof importanceLabels]}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full text-sm border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                  >
                    {editingTask ? 'Save Changes' : 'Add Task'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
              <div className="hidden lg:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={() => setSelectedWeek(prev => {
                    const newDate = new Date(prev);
                    newDate.setDate(newDate.getDate() - 7);
                    return newDate;
                  })}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent hover:bg-white/5 h-8 px-3"
                  onClick={() => setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  <span className="text-xs">Today</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={() => setSelectedWeek(prev => {
                    const newDate = new Date(prev);
                    newDate.setDate(newDate.getDate() + 7);
                    return newDate;
                  })}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-white/70 flex items-center gap-2">
                <span className={fontStyles.secondary}>Weekly progress</span>
                <span className={`text-turquoise font-medium ${fontStyles.primary}`}>
                  {calculateWeekProgress()}%
                </span>
              </div>
            </div>
            <Pomodoro onComplete={() => addStarToDay(format(new Date(), 'yyyy-MM-dd'))} />
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 px-0">
          {isLoading ? (
            <div className="text-center py-8">
              <span className={`text-xs text-muted-foreground ${fontStyles.secondary}`}>Loading...</span>
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-8">
              <span className={`text-xs text-muted-foreground ${fontStyles.secondary}`}>No tasks registered</span>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide" ref={containerRef}>
              <div className={cn(
                "inline-flex gap-3 lg:gap-6 px-4 lg:px-6 min-w-full",
                isMobile && "snap-x snap-mandatory"
              )}>
                {isMobile ? (
                  // Mobile view - single day
                  <div className="w-full px-4">
                    <div className={cn(
                      "bg-background border border-white/10 rounded-lg h-full",
                      format(selectedDate, 'yyyy-MM-dd') === currentDateKey && "bg-turquoise/5 border-turquoise/20"
                    )}>
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <h2 className={cn(
                            `text-sm font-medium capitalize ${fontStyles.primary}`,
                            format(selectedDate, 'yyyy-MM-dd') === currentDateKey ? "text-turquoise" : "text-white/90"
                          )}>
                            {format(selectedDate, 'EEEE')}
                          </h2>
                          <div className="flex items-center gap-0.5">
                            {dayStars[format(selectedDate, 'yyyy-MM-dd')] > 0 && (
                              <>
                                <StarIcon className="w-3 h-3 text-yellow-400" />
                                <span className={`text-xs text-yellow-400 ${fontStyles.secondary}`}>
                                  {dayStars[format(selectedDate, 'yyyy-MM-dd')]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={cn(
                          `text-xs ${fontStyles.secondary}`,
                          format(selectedDate, 'yyyy-MM-dd') === currentDateKey ? "text-turquoise" : "text-white/50"
                        )}>
                          {format(selectedDate, 'MMM d')}
                        </span>
                      </div>
                      <div className="space-y-2 p-3">
                        {sortedTasks
                          .filter(task => format(new Date(task.dueDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
                          .map((task) => (
                            <Card key={task.id} className="border border-white/10 group">
                              <CardContent 
                                className="p-3 cursor-pointer"
                                onDoubleClick={() => handleEditTask(task)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2 flex-1">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={cn(
                                        "h-5 w-5 lg:h-6 lg:w-6 rounded-full shrink-0",
                                        task.isCompleted 
                                          ? "bg-turquoise border-turquoise text-background hover:bg-turquoise/90" 
                                          : "hover:border-turquoise/50"
                                      )}
                                      onClick={() => toggleTask(task.id)}
                                    >
                                      {task.isCompleted && <CheckIcon className="h-3 w-3" />}
                                    </Button>
                                    <div className="space-y-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className={cn(
                                          `text-sm font-light break-words flex-1 ${fontStyles.secondary}`,
                                          task.isCompleted && "line-through text-white/50"
                                        )}>
                                          {task.title}
                                        </p>
                                        <span className={`text-base font-mono text-turquoise/90 shrink-0 ${fontStyles.primary}`}>
                                          {importanceEmojis[task.importance as keyof typeof importanceEmojis]}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <TrashIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Desktop view - week view
                  weekDays.map((day, index) => {
                    const dayDate = new Date(selectedWeek);
                    dayDate.setDate(dayDate.getDate() + index);
                    const dateKey = format(dayDate, 'yyyy-MM-dd');
                    const formattedDate = format(dayDate, 'MMM d');
                    const dayTasks = sortedTasks.filter(task => 
                      format(new Date(task.dueDate), 'yyyy-MM-dd') === dateKey
                    );
                    const stars = dayStars[dateKey] || 0;
                    const isToday = dateKey === currentDateKey;

                    return (
                      <div 
                        key={day} 
                        className={cn(
                          "flex-none lg:w-auto lg:flex-1 lg:min-w-[300px] lg:max-w-[350px] first:pl-0 last:pr-4",
                          isMobile && "w-full snap-center px-4",
                          isToday && "lg:min-w-[350px]"
                        )}
                      >
                        <div className={cn(
                          "bg-background border border-white/10 rounded-lg h-full",
                          isToday && "bg-turquoise/5 border-turquoise/20"
                        )}>
                          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                            <div className="flex items-center gap-2">
                              <h2 className={cn(
                                `text-sm font-medium capitalize ${fontStyles.primary}`,
                                isToday ? "text-turquoise" : "text-white/90"
                              )}>
                                {format(dayDate, 'EEEE')}
                              </h2>
                              <div className="flex items-center gap-0.5">
                                {stars > 0 && (
                                  <>
                                    <StarIcon className="w-3 h-3 text-yellow-400" />
                                    <span className={`text-xs text-yellow-400 ${fontStyles.secondary}`}>{stars}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className={cn(
                              `text-xs ${fontStyles.secondary}`,
                              isToday ? "text-turquoise" : "text-white/50"
                            )}>
                              {formattedDate}
                            </span>
                          </div>
                          <div className="space-y-2 p-3">
                            {dayTasks.map((task) => (
                              <Card key={task.id} className="border border-white/10 group">
                                <CardContent 
                                  className="p-3 cursor-pointer"
                                  onDoubleClick={() => handleEditTask(task)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2 flex-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                          "h-5 w-5 lg:h-6 lg:w-6 rounded-full shrink-0",
                                          task.isCompleted 
                                            ? "bg-turquoise border-turquoise text-background hover:bg-turquoise/90" 
                                            : "hover:border-turquoise/50"
                                        )}
                                        onClick={() => toggleTask(task.id)}
                                      >
                                        {task.isCompleted && <CheckIcon className="h-3 w-3" />}
                                      </Button>
                                      <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className={cn(
                                            `text-sm font-light break-words flex-1 ${fontStyles.secondary}`,
                                            task.isCompleted && "line-through text-white/50"
                                          )}>
                                            {task.title}
                                          </p>
                                          <span className={`text-base font-mono text-turquoise/90 shrink-0 ${fontStyles.primary}`}>
                                            {importanceEmojis[task.importance as keyof typeof importanceEmojis]}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground hover:text-white transition-colors shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                                      onClick={() => deleteTask(task.id)}
                                    >
                                      <TrashIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
