'use client';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CircleItem {
  id: number;
  title: string;
  clicks: number;
  maxClicks: number;
}

export default function CirclesPage() {
  const [items, setItems] = useState<CircleItem[]>([]);
  const [newItem, setNewItem] = useState({ title: '', maxClicks: 5 });
  const [isLoading, setIsLoading] = useState(true);

  // Load circles on mount
  useEffect(() => {
    loadCircles();
  }, []);

  const loadCircles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/circles');
      const data = await response.json();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (error) {
      console.error('Error loading circles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    try {
      const response = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      const data = await response.json();
      if (response.ok) {
        setItems(prev => [data, ...prev]);
        setNewItem({ title: '', maxClicks: 5 });
      } else {
        console.error('Error adding circle:', data.error);
      }
    } catch (error) {
      console.error('Error adding circle:', error);
    }
  };

  const incrementClicks = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newClicks = item.clicks >= item.maxClicks ? 0 : item.clicks + 1;

    try {
      const response = await fetch(`/api/circles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clicks: newClicks })
      });

      if (response.ok) {
        setItems(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, clicks: newClicks };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error('Error updating circle:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:p-8">
      <Card className="lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10">
          <CardTitle className="text-xs font-normal text-white/70">Círculos de Progresso</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Form to add new item */}
          <form onSubmit={addItem} className="mb-8 flex flex-col lg:flex-row gap-4 sticky top-[5.5rem] bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 py-4">
            <Input
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Novo item..."
              className="flex-1 text-xs"
            />
            <Input
              type="number"
              value={newItem.maxClicks}
              onChange={(e) => setNewItem({ ...newItem, maxClicks: Math.max(1, parseInt(e.target.value)) })}
              placeholder="Máximo de cliques"
              className="w-40 text-xs"
              min="1"
            />
            <Button type="submit" className="w-full lg:w-auto text-xs">
              <PlusIcon className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </form>

          {/* Items grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8">
                <span className="text-xs text-muted-foreground">Carregando...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <span className="text-xs text-muted-foreground">Nenhum item cadastrado</span>
              </div>
            ) : (
              items.map(item => (
                <Card key={item.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: item.maxClicks }).map((_, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="icon"
                          className={`w-8 h-8 rounded-full relative ${
                            index < item.clicks
                              ? 'bg-turquoise border-turquoise text-background hover:bg-turquoise/90'
                              : 'hover:border-turquoise/50'
                          }`}
                          onClick={() => incrementClicks(item.id)}
                        >
                          {index < item.clicks && (
                            <CheckIcon className="h-4 w-4 absolute" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 