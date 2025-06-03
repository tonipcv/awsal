'use client';
import { useState, useEffect, useCallback } from "react";
import { PlusIcon, TrashIcon, ChevronDownIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type TimeBlock = 'strategic' | 'buffer' | 'break';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  timeBlock: TimeBlock;
  scheduledTime?: string;
}

interface DayPlan {
  id: number;
  date: string;
  tasks: Task[];
  notes: string;
}

interface WeekPlan {
  id: number;
  weekNumber: number;
  vision: string;
  goals: string[];
  keyResults: {
    id: number;
    title: string;
    target: number;
    current: number;
  }[];
  days: DayPlan[];
  reflection: string;
  isExpanded: boolean;
}

interface Cycle {
  id: number;
  startDate: string;
  endDate: string;
  vision: string;
  weeks: WeekPlan[];
}

interface LatestCycleWeek {
  id: number;
  weekNumber: number;
  vision: string;
  reflection: string;
  isExpanded: boolean;
  goals: string[];
  keyResults: {
    id: number;
    title: string;
    target: number;
    current: number;
  }[];
  days: {
    id: number;
    date: string;
    notes: string;
    tasks: Task[];
  }[];
}

interface SelectValue {
  title: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function OneWeek() {
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    timeBlock: 'strategic' as TimeBlock,
    scheduledTime: '09:00'
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState('');

  const timeBlocks: Array<{ id: TimeBlock; name: string; color: string }> = [
    { id: 'strategic', name: 'Estratégico', color: 'bg-cyan-900 text-cyan-200' },
    { id: 'buffer', name: 'Buffer', color: 'bg-purple-900 text-purple-200' },
    { id: 'break', name: 'Pausa', color: 'bg-pink-900 text-pink-200' },
  ];

  const createNewCycle = useCallback(() => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 semanas

    const weeks: WeekPlan[] = Array.from({ length: 12 }, (_, i) => {
      const weekStartDate = new Date(startDate);
      weekStartDate.setDate(weekStartDate.getDate() + i * 7);
      
      const days: DayPlan[] = Array.from({ length: 7 }, (_, j) => {
        const dayDate = new Date(weekStartDate);
        dayDate.setDate(dayDate.getDate() + j);
        return {
          id: Date.now() + j,
          date: dayDate.toISOString().split('T')[0],
          tasks: [],
          notes: ''
        };
      });

      return {
        id: Date.now() + i,
        weekNumber: i + 1,
        vision: '',
        goals: [],
        keyResults: [],
        days,
        reflection: '',
        isExpanded: i === 0
      };
    });

    const newCycle = {
      id: Date.now(),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      vision: '',
      weeks
    };

    setCycle(newCycle);
    saveCycle(newCycle); // Salvar o novo ciclo no banco de dados
  }, []);

  useEffect(() => {
    const loadCycle = async () => {
      try {
        const response = await fetch('/api/cycles');
        const cycles = await response.json();
        if (cycles.length > 0) {
          const latestCycle = cycles[cycles.length - 1];
          setCycle({
            ...latestCycle,
            startDate: new Date(latestCycle.startDate).toISOString().split('T')[0],
            endDate: new Date(latestCycle.endDate).toISOString().split('T')[0],
            weeks: latestCycle.weeks.map((week: LatestCycleWeek) => ({
              ...week,
              days: week.days.map((day) => ({
                ...day,
                date: new Date(day.date).toISOString().split('T')[0]
              }))
            }))
          });
        } else {
          createNewCycle();
        }
      } catch (error) {
        console.error('Error loading cycle:', error);
        createNewCycle();
      }
    };

    loadCycle();
  }, [createNewCycle]);

  // Função para salvar alterações
  const saveCycle = async (updatedCycle: Cycle) => {
    try {
      await fetch('/api/cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCycle)
      });
    } catch (error) {
      console.error('Error saving cycle:', error);
    }
  };

  const addTask = async (weekId: number, dayId: number) => {
    if (!newTask.title.trim() || !cycle) return;

    const updatedCycle = {
      ...cycle,
      weeks: cycle.weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            days: week.days.map(day => {
              if (day.id === dayId) {
                return {
                  ...day,
                  tasks: [...day.tasks, {
                    id: Date.now(),
                    title: newTask.title,
                    completed: false,
                    timeBlock: newTask.timeBlock,
                    scheduledTime: newTask.scheduledTime
                  }]
                };
              }
              return day;
            })
          };
        }
        return week;
      })
    };

    setCycle(updatedCycle);
    await saveCycle(updatedCycle);
    
    setNewTask({
      title: '',
      timeBlock: 'strategic',
      scheduledTime: '09:00'
    });
    setSelectedDay(null);
  };

  const addGoal = (weekId: number) => {
    if (!newGoal.trim() || !cycle) return;

    setCycle({
      ...cycle,
      weeks: cycle.weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            goals: [...week.goals, newGoal]
          };
        }
        return week;
      })
    });

    setNewGoal('');
  };

  const toggleTask = (weekId: number, dayId: number, taskId: number) => {
    if (!cycle) return;

    setCycle({
      ...cycle,
      weeks: cycle.weeks.map(week => {
        if (week.id === weekId) {
          return {
            ...week,
            days: week.days.map(day => {
              if (day.id === dayId) {
                return {
                  ...day,
                  tasks: day.tasks.map(task => {
                    if (task.id === taskId) {
                      return { ...task, completed: !task.completed };
                    }
                    return task;
                  })
                };
              }
              return day;
            })
          };
        }
        return week;
      })
    });
  };

  const calculateWeekProgress = (week: WeekPlan) => {
    const totalTasks = week.days.reduce((acc, day) => acc + day.tasks.length, 0);
    if (totalTasks === 0) return 0;

    const completedTasks = week.days.reduce((acc, day) => 
      acc + day.tasks.filter(task => task.completed).length, 0
    );

    return Math.round((completedTasks / totalTasks) * 100);
  };

  if (!cycle) return null;

  return (
    <div className="min-h-screen bg-background lg:p-8">
      <Card className="lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10">
          <CardTitle className="text-xs font-normal text-white/70">12 Week Year</CardTitle>
          <CardDescription className="text-xs text-white/50">
            {new Date(cycle?.startDate || '').toLocaleDateString('pt-BR')} - {new Date(cycle?.endDate || '').toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Vision Section */}
          <div className="space-y-2">
            <h2 className="text-xs font-normal text-white/70">Visão do Ciclo</h2>
            <Textarea
              value={cycle?.vision}
              onChange={(e) => cycle && setCycle({ ...cycle, vision: e.target.value })}
              placeholder="Descreva sua visão para as próximas 12 semanas..."
              className="min-h-[100px] resize-none text-xs"
            />
          </div>

          {/* Weeks List */}
          <div className="space-y-4">
            {cycle?.weeks.map(week => (
              <Card key={week.id} className="border-border/50">
                <Collapsible>
                  <CardHeader className="pb-2">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between hover:bg-muted/50 h-auto py-2">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-normal">Semana {week.weekNumber}</span>
                          <div className="flex items-center gap-3">
                            <Progress value={calculateWeekProgress(week)} className="w-24" />
                            <span className="text-[10px] text-muted-foreground min-w-[2rem]">
                              {calculateWeekProgress(week)}%
                            </span>
                          </div>
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${week.isExpanded ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-2 pb-4 space-y-6">
                      {/* Goals Section */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-normal text-white/70">Metas da Semana</h4>
                        <div className="space-y-2">
                          {week.goals.map((goal, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded-lg">
                              <CheckCircleIcon className="w-4 h-4 text-primary" />
                              <span>{goal}</span>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              value={newGoal}
                              onChange={(e) => setNewGoal(e.target.value)}
                              placeholder="Nova meta..."
                              className="flex-1 text-xs"
                            />
                            <Button onClick={() => addGoal(week.id)} className="text-xs">
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Days Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {week.days.map(day => (
                          <Card key={day.id} className="border-border/50">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-normal text-white/70">
                                  {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                                </CardTitle>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedDay(day.id.toString())}
                                  className="h-6 w-6 hover:bg-muted/50"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </Button>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              {selectedDay === day.id.toString() && (
                                <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
                                  <Input
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Nova tarefa..."
                                    className="text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <Select
                                      value={newTask.timeBlock}
                                      onValueChange={(value: TimeBlock) => setNewTask({ ...newTask, timeBlock: value })}
                                    >
                                      <SelectTrigger className="text-xs">
                                        <SelectValue placeholder="Bloco" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeBlocks.map(block => (
                                          <SelectItem key={block.id} value={block.id} className="text-xs">
                                            {block.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="time"
                                      value={newTask.scheduledTime}
                                      onChange={(e) => setNewTask({ ...newTask, scheduledTime: e.target.value })}
                                      className="text-xs"
                                    />
                                  </div>
                                  <Button
                                    onClick={() => addTask(week.id, day.id)}
                                    className="w-full text-xs"
                                  >
                                    Adicionar
                                  </Button>
                                </div>
                              )}

                              <div className="space-y-1">
                                {day.tasks.map(task => (
                                  <div
                                    key={task.id}
                                    className={`flex items-start gap-2 p-2 rounded-lg border border-border/50 ${
                                      task.completed ? 'bg-muted/50' : ''
                                    }`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={`w-4 h-4 rounded-full ${
                                        task.completed ? 'bg-turquoise border-turquoise text-background' : ''
                                      }`}
                                      onClick={() => toggleTask(week.id, day.id, task.id)}
                                    >
                                      {task.completed && <CheckCircleIcon className="w-3 h-3" />}
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-xs ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                          timeBlocks.find(block => block.id === task.timeBlock)?.color
                                        }`}>
                                          {timeBlocks.find(block => block.id === task.timeBlock)?.name}
                                        </span>
                                        {task.scheduledTime && (
                                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3" />
                                            {task.scheduledTime}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => {
                                        setCycle({
                                          ...cycle,
                                          weeks: cycle.weeks.map(w => {
                                            if (w.id === week.id) {
                                              return {
                                                ...w,
                                                days: w.days.map(d => {
                                                  if (d.id === day.id) {
                                                    return {
                                                      ...d,
                                                      tasks: d.tasks.filter(t => t.id !== task.id)
                                                    };
                                                  }
                                                  return d;
                                                })
                                              };
                                            }
                                            return w;
                                          })
                                        });
                                      }}
                                    >
                                      <TrashIcon className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Week Reflection */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-normal text-white/70">Reflexão da Semana</h4>
                        <Textarea
                          value={week.reflection}
                          onChange={(e) => {
                            setCycle({
                              ...cycle,
                              weeks: cycle.weeks.map(w => 
                                w.id === week.id ? { ...w, reflection: e.target.value } : w
                              )
                            });
                          }}
                          placeholder="Reflexões sobre a semana..."
                          className="min-h-[80px] resize-none text-xs"
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 