/* eslint-disable */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon, CheckIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

interface Habit {
  id: string;
  title: string;
  category: string;
  progress: Array<{
    date: string;
    isChecked: boolean;
  }>;
}

export default function ChecklistPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({ title: '', category: 'personal' });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isTodayColumnSticky, setIsTodayColumnSticky] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const todayColumnRef = useRef<HTMLTableCellElement>(null);

  const categories = [
    { id: 'personal', name: 'Pessoal' },
    { id: 'health', name: 'Saúde' },
    { id: 'work', name: 'Trabalho' },
  ];

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Pegar o primeiro dia da semana (0 = Domingo, 1 = Segunda, etc)
    const firstDayOfWeek = start.getDay();
    
    // Adicionar dias do mês anterior para completar a primeira semana
    const previousMonthDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      previousMonthDays.push(date);
    }

    // Adicionar dias do próximo mês para completar a última semana
    const lastDayOfWeek = end.getDay();
    const nextMonthDays = [];
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }

    return [...previousMonthDays, ...days, ...nextMonthDays];
  };

  const days = getDaysInMonth();

  const loadHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const month = currentDate.toISOString();
      const response = await fetch(`/api/habits?month=${month}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Garantir que cada hábito tenha um array de progress
        const habitsWithProgress = data.map(habit => ({
          ...habit,
          progress: habit.progress || []
        }));
        setHabits(habitsWithProgress);
      } else {
        setHabits([]);
        console.error('Invalid data format:', data);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Update isTodayColumnSticky state when the table is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (todayColumnRef.current && tableRef.current) {
        const columnRect = todayColumnRef.current.getBoundingClientRect();
        const tableRect = tableRef.current.getBoundingClientRect();
        
        if (columnRect.left < tableRect.left + 192) {
          setIsTodayColumnSticky(true);
        } else {
          setIsTodayColumnSticky(false);
        }
      }
    };

    if (tableRef.current) {
      tableRef.current.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call in case today is already out of view
    }

    return () => {
      tableRef.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleHabit = async (habitId: string, date: string) => {
    try {
      const response = await fetch('/api/habits/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date })
      });
      
      if (response.ok) {
        setHabits(habits.map(habit => {
          if (habit.id === habitId) {
            const existingProgress = habit.progress.find(p => p.date === date);
            if (existingProgress) {
              return {
                ...habit,
                progress: habit.progress.map(p => 
                  p.date === date ? { ...p, isChecked: !p.isChecked } : p
                )
              };
            } else {
              return {
                ...habit,
                progress: [...habit.progress, { date, isChecked: true }]
              };
            }
          }
          return habit;
        }));
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title.trim()) return;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHabit)
      });

      const data = await response.json();

      if (response.ok) {
        if (data.error) {
          console.error('Server error:', data.error);
          return;
        }
        
        setHabits(prevHabits => [...prevHabits, data]);
        setNewHabit({ title: '', category: 'personal' });
        setIsModalOpen(false);
      } else {
        console.error('Error adding habit:', data.error || data.details || response.statusText);
      }
    } catch (error) {
      console.error('Network error adding habit:', error);
    }
  };

  const handleEditHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHabit || !editTitle.trim()) return;

    try {
      const response = await fetch(`/api/habits/${selectedHabit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editTitle,
          category: editCategory 
        })
      });

      if (response.ok) {
        const updatedHabit = await response.json();
        setHabits(prev => prev.map(h => h.id === selectedHabit.id ? updatedHabit : h));
        setIsEditModalOpen(false);
        setSelectedHabit(null);
        setEditTitle('');
        setEditCategory('');
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedHabit) return;
    
    try {
      const response = await fetch(`/api/habits/${selectedHabit.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setHabits(prev => prev.filter(h => h.id !== selectedHabit.id));
        setIsEditModalOpen(false);
        setSelectedHabit(null);
        setEditTitle('');
        setEditCategory('');
        setIsConfirmingDelete(false);
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  // Calcular estatísticas
  const totalHabits = habits.length;
  const completedToday = habits.filter(habit => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return habit.progress.some(p => p.date === today && p.isChecked);
  }).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101010' }}>
        <span className="text-xs text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
        {/* Padding para header no topo e menu em baixo */}
        <div className="pt-[88px] pb-32 lg:pt-20 lg:pb-24">
          
          {/* Hero Section Compacto */}
          <div className="relative overflow-hidden">
            <div className="relative py-4 lg:py-6">
              <div className="max-w-6xl mx-auto px-3 lg:px-6">
                <div className="text-center max-w-3xl mx-auto">
                  <div className="mb-4 lg:mb-6">
                    <div className="h-10 lg:h-14 bg-gray-800/50 rounded-lg w-56 mx-auto mb-2 lg:mb-3 animate-pulse"></div>
                    <div className="h-6 lg:h-8 bg-gray-700/50 rounded-lg w-40 mx-auto mb-3 lg:mb-4 animate-pulse"></div>
                    <div className="h-4 lg:h-6 bg-gray-700/50 rounded w-64 mx-auto mb-6 lg:mb-8 animate-pulse"></div>
                    
                    {/* Stats Skeleton */}
                    <div className="flex items-center justify-center gap-6 lg:gap-8">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="text-center">
                          <div className="h-6 lg:h-8 bg-gray-800/50 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                          <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
      {/* Padding para header no topo e menu em baixo */}
      <div className="pt-[88px] pb-32 lg:pt-20 lg:pb-24">
        
        {/* Hero Section Compacto */}
        <div className="relative overflow-hidden">
          <div className="relative py-4 lg:py-6">
            <div className="max-w-6xl mx-auto px-3 lg:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <div className="mb-4 lg:mb-6">
                  <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 tracking-tight">
                    Olá, {session?.user?.name || 'Paciente'}!
                  </h1>
                  <h2 className="text-lg lg:text-xl font-light text-turquoise tracking-tight">
                    Checklist de Hábitos
                  </h2>
                  <p className="text-sm lg:text-base text-gray-300 mt-2">
                    Acompanhe seus hábitos diários e mantenha-se no caminho certo
                  </p>
                </div>
                
                {/* Stats Compactas */}
                <div className="flex items-center justify-center gap-4 lg:gap-8">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-white mb-0.5">
                      {totalHabits}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {totalHabits === 1 ? 'Hábito' : 'Hábitos'}
                    </div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-700" />
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-white mb-0.5">
                      {completedToday}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      Concluídos hoje
                    </div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-700" />
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-turquoise mb-0.5">
                      {completionRate}%
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      Taxa de conclusão
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-3 lg:px-6 pb-8 lg:pb-12">
          {/* Header com navegação e botão de adicionar */}
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <div className="flex items-center gap-4">
              <h3 className="text-lg lg:text-xl font-light text-white flex items-center gap-2">
                <CalendarDaysIcon className="h-5 w-5 text-turquoise" />
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 lg:h-9 lg:w-9 border-gray-700 hover:border-turquoise/50 text-white"
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 lg:h-9 lg:w-9 border-gray-700 hover:border-turquoise/50 text-white"
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8 lg:h-9 lg:w-9 border-turquoise/50 bg-turquoise/10 hover:bg-turquoise/20 text-turquoise"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-sm font-normal text-white">Novo Hábito</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={addHabit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-white">Nome do hábito</Label>
                      <Input
                        id="title"
                        value={newHabit.title}
                        onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                        placeholder="Ex: Meditar"
                        className="text-xs bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-white">Categoria</Label>
                      <Select
                        value={newHabit.category}
                        onValueChange={(value) => setNewHabit({ ...newHabit, category: value })}
                      >
                        <SelectTrigger className="text-xs bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id} className="text-xs text-white hover:bg-gray-700">
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Adicionando..." : "Adicionar"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabela de hábitos */}
          <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl overflow-hidden backdrop-blur-sm">
            {habits.length === 0 ? (
              <div className="text-center py-12 lg:py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarDaysIcon className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg lg:text-xl font-light text-white mb-2 lg:mb-3">
                    Nenhum hábito cadastrado
                  </h3>
                  <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                    Comece adicionando seus primeiros hábitos para acompanhar seu progresso diário.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-x-auto" ref={tableRef}>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800/40">
                      <th className="text-left p-3 lg:p-4 font-normal text-gray-400 w-48 lg:w-64 sticky left-0 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/90 z-10 text-xs">
                        Hábito
                      </th>
                      {days.map(day => {
                        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        return (
                          <th 
                            key={day.toString()} 
                            data-today={isToday}
                            ref={isToday ? todayColumnRef : null}
                            className={cn(
                              "p-1 lg:p-2 font-light text-center min-w-[36px] lg:min-w-[40px]",
                              day.getMonth() !== currentDate.getMonth() && "text-gray-500",
                              isToday && "text-turquoise",
                              isToday && isTodayColumnSticky && "sticky-today left-[192px]"
                            )}
                          >
                            <div className="flex flex-col items-center">
                              <span className={cn(
                                "text-[10px] text-gray-400",
                                isToday && "text-turquoise"
                              )}>
                                {format(day, 'EEE', { locale: ptBR })}
                              </span>
                              <span className={cn(
                                "text-xs",
                                isToday && "text-turquoise"
                              )}>
                                {format(day, 'd')}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {habits.map(habit => (
                      <tr key={habit.id} className="border-b border-gray-800/20 group hover:bg-gray-800/20">
                        <td className="p-3 lg:p-4 sticky left-0 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/90 z-10">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setSelectedHabit(habit);
                                setEditTitle(habit.title);
                                setEditCategory(habit.category);
                                setIsEditModalOpen(true);
                              }}
                              className="flex items-center gap-2 hover:text-turquoise transition-colors text-left"
                            >
                              <span className="font-light text-xs text-white">{habit.title}</span>
                              <span className="hidden lg:inline-block text-[10px] text-gray-400">
                                {categories.find(c => c.id === habit.category)?.name}
                              </span>
                            </button>
                          </div>
                        </td>
                        {days.map(day => {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const progress = habit.progress.find(p => p.date === dateStr);
                          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                          
                          return (
                            <td 
                              key={dateStr} 
                              ref={isToday ? todayColumnRef : null}
                              className={cn(
                                "p-1 lg:p-2 text-center",
                                isToday && "text-turquoise",
                                isToday && isTodayColumnSticky && "sticky-today left-[192px]"
                              )}
                            >
                              <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                  "w-7 h-7 lg:w-8 lg:h-8 rounded-full border-gray-600",
                                  day.getMonth() !== currentDate.getMonth() && "opacity-50",
                                  progress?.isChecked 
                                    ? "bg-turquoise border-turquoise text-gray-900 hover:bg-turquoise/90" 
                                    : "hover:border-turquoise/50 hover:bg-gray-800/50",
                                  isToday && !progress?.isChecked && "border-turquoise/50"
                                )}
                                onClick={() => toggleHabit(habit.id, dateStr)}
                              >
                                {progress?.isChecked && <CheckIcon className="h-3 w-3 lg:h-4 lg:w-4" />}
                              </Button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setSelectedHabit(null);
          setEditTitle('');
          setEditCategory('');
          setIsConfirmingDelete(false);
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-sm font-normal text-white">
              {isConfirmingDelete ? 'Confirmar exclusão' : 'Editar hábito'}
            </DialogTitle>
          </DialogHeader>
          
          {isConfirmingDelete ? (
            <div className="space-y-4 pt-4">
              <p className="text-sm text-gray-300">
                Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmingDelete(false)}
                  className="text-xs border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDeleteConfirm}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  Excluir
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleEditHabit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-white">Nome do hábito</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Ex: Meditar"
                  className="text-xs bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-white">Categoria</Label>
                <Select
                  value={editCategory}
                  onValueChange={setEditCategory}
                >
                  <SelectTrigger className="text-xs bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id} className="text-xs text-white hover:bg-gray-700">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                >
                  Excluir hábito
                </Button>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-xs border-gray-600 text-white hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                    disabled={!editTitle.trim()}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 