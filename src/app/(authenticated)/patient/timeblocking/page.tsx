'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addHours, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TimeBlock {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  color: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const COLORS = [
  'bg-turquoise/80 hover:bg-turquoise/90',
  'bg-turquoise/60 hover:bg-turquoise/70',
  'bg-turquoise/40 hover:bg-turquoise/50',
  'bg-purple-500/60 hover:bg-purple-500/70',
  'bg-indigo-500/60 hover:bg-indigo-500/70',
  'bg-blue-500/60 hover:bg-blue-500/70',
  'bg-pink-500/60 hover:bg-pink-500/70',
  'bg-violet-500/60 hover:bg-violet-500/70',
];

export default function TimeBlockingPage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: '',
    start: '09:00',
    end: '10:00',
    color: COLORS[0],
  });
  const [isMobile, setIsMobile] = useState(false);

  // Carregar blocos do localStorage ao iniciar
  useEffect(() => {
    const savedBlocks = localStorage.getItem('timeBlocks');
    if (savedBlocks) {
      setBlocks(JSON.parse(savedBlocks));
    }
  }, []);

  // Salvar blocos no localStorage quando houver mudanças
  useEffect(() => {
    localStorage.setItem('timeBlocks', JSON.stringify(blocks));
  }, [blocks]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBlock.title.trim()) {
      alert('Por favor, adicione um título para o bloco');
      return;
    }

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const startDateTime = parseISO(`${selectedDateStr}T${newBlock.start}:00`);
    const endDateTime = parseISO(`${selectedDateStr}T${newBlock.end}:00`);

    if (endDateTime <= startDateTime) {
      alert('O horário de término deve ser depois do horário de início');
      return;
    }

    const newTimeBlock: TimeBlock = {
      id: crypto.randomUUID(),
      title: newBlock.title.trim(),
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      color: newBlock.color,
    };

    setBlocks(prev => [...prev, newTimeBlock]);
    setIsModalOpen(false);
    setNewBlock({
      title: '',
      start: '09:00',
      end: '10:00',
      color: COLORS[0],
    });
  };

  const deleteBlock = (blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  };

  const getBlocksForHour = (hour: number, date: Date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    return blocks.filter(block => {
      const blockStart = parseISO(block.start);
      const blockStartHour = blockStart.getHours();
      const blockDate = format(blockStart, 'yyyy-MM-dd');
      return blockStartHour === hour && blockDate === dayStr;
    });
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
  );

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0 pb-2 lg:pb-4 sticky top-0 bg-background z-20 pt-[72px] lg:pt-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xs font-normal text-white/70">Time Blocking</CardTitle>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                  <DialogTitle className="text-base font-medium">Novo Bloco de Tempo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBlock} className="space-y-6 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={newBlock.title}
                      onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                      placeholder="Ex: Reunião de equipe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">Início</Label>
                      <Input
                        id="start"
                        type="time"
                        value={newBlock.start}
                        onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">Fim</Label>
                      <Input
                        id="end"
                        type="time"
                        value={newBlock.end}
                        onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="grid grid-cols-8 gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-full",
                            color,
                            newBlock.color === color && "ring-2 ring-white ring-offset-2 ring-offset-background"
                          )}
                          onClick={() => setNewBlock({ ...newBlock, color })}
                        />
                      ))}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full border-turquoise border bg-transparent hover:bg-turquoise/10 text-white"
                  >
                    Criar Bloco
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2">
            {isMobile ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={handlePrevDay}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-3 border-white/20 bg-transparent hover:bg-white/5 min-w-[120px]"
                  onClick={() => setSelectedDate(new Date())}
                >
                  <span className="text-xs">
                    {format(selectedDate, "EEE, d 'de' MMM", { locale: ptBR })}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-white/20 bg-transparent hover:bg-white/5"
                  onClick={handleNextDay}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="border-white/20 bg-transparent hover:bg-white/5 h-8 px-3"
                onClick={() => setSelectedDate(new Date())}
              >
                <span className="text-xs">Hoje</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className={cn(
            "grid divide-x divide-white/10",
            isMobile ? "grid-cols-[40px_1fr]" : "grid-cols-[40px_repeat(7,1fr)]"
          )}>
            {/* Time labels */}
            <div className="space-y-0 pt-[42px]">
              <div className="h-[42px] sticky top-[72px] lg:top-[60px] bg-background z-20" />
              {HOURS.map((hour) => (
                <div key={hour} className="h-14 px-1 text-right">
                  <span className="text-[10px] text-white/50">
                    {hour.toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>

            {isMobile ? (
              // Mobile view - single day
              <div className="min-h-full">
                {HOURS.map((hour) => {
                  const dayStr = format(selectedDate, 'yyyy-MM-dd');
                  const blocksInHour = blocks.filter(block => {
                    const blockStart = parseISO(block.start);
                    const blockStartHour = blockStart.getHours();
                    const blockDate = format(blockStart, 'yyyy-MM-dd');
                    return blockStartHour === hour && blockDate === dayStr;
                  });

                  return (
                    <div 
                      key={hour}
                      className={cn(
                        "h-14 border-b border-white/10 relative",
                        hour === new Date().getHours() && 
                        format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 
                        "bg-white/5"
                      )}
                    >
                      {blocksInHour.map((block) => {
                        const start = new Date(block.start);
                        const end = new Date(block.end);
                        const durationInMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
                        const heightPercentage = (durationInMinutes / 60) * 100;
                        const topOffset = (start.getMinutes() / 60) * 100;

                        return (
                          <div
                            key={block.id}
                            className={cn(
                              "absolute left-0 right-0 mx-1 rounded-sm px-2 py-0.5 group",
                              block.color,
                              "hover:z-10 hover:ring-1 hover:ring-white/20"
                            )}
                            style={{
                              top: `${topOffset}%`,
                              height: `${heightPercentage}%`,
                              minHeight: '16px'
                            }}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate leading-tight">
                                  {block.title}
                                </p>
                                <p className="text-[10px] text-white/70 leading-tight">
                                  {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteBlock(block.id)}
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Desktop view - week view
              <>
                {/* Fixed header row */}
                <div className="col-span-7 grid grid-cols-7 divide-x divide-white/10 sticky top-[72px] lg:top-[60px] bg-background z-20">
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "px-2 py-2 text-center border-b border-white/10",
                        format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && "bg-turquoise/5"
                      )}
                    >
                      <p className="text-[10px] uppercase text-white/70">
                        {format(day, 'EEE', { locale: ptBR })}
                      </p>
                      <p className="text-xs font-medium">
                        {format(day, 'd')}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Days columns */}
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="min-h-full pt-[42px]">
                    {/* Hours grid */}
                    {HOURS.map((hour) => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const blocksInHour = blocks.filter(block => {
                        const blockStart = parseISO(block.start);
                        const blockStartHour = blockStart.getHours();
                        const blockDate = format(blockStart, 'yyyy-MM-dd');
                        return blockStartHour === hour && blockDate === dayStr;
                      });

                      return (
                        <div 
                          key={hour}
                          className={cn(
                            "h-14 border-b border-white/10 relative",
                            hour === new Date().getHours() && 
                            format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && 
                            "bg-white/5"
                          )}
                        >
                          {blocksInHour.map((block) => {
                            const start = new Date(block.start);
                            const end = new Date(block.end);
                            const durationInMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
                            const heightPercentage = (durationInMinutes / 60) * 100;
                            const topOffset = (start.getMinutes() / 60) * 100;

                            return (
                              <div
                                key={block.id}
                                className={cn(
                                  "absolute left-0 right-0 mx-0.5 rounded-sm px-1 group backdrop-blur-sm",
                                  block.color,
                                  "hover:z-10 hover:ring-1 hover:ring-white/20"
                                )}
                                style={{
                                  top: `${topOffset}%`,
                                  height: `${heightPercentage}%`,
                                  minHeight: '16px'
                                }}
                              >
                                <div className="flex items-start justify-between gap-0.5">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-white truncate leading-tight">
                                      {block.title}
                                    </p>
                                    <p className="text-[8px] text-white/70 leading-tight">
                                      {format(start, 'HH:mm')}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteBlock(block.id)}
                                  >
                                    <TrashIcon className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 