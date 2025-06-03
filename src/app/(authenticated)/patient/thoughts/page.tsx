'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrashIcon, ArrowRightIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Thought {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image: string;
  };
}

export default function ThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingThought, setEditingThought] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        blockquote: false,
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[100px] w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-turquoise disabled:cursor-not-allowed disabled:opacity-50 font-light',
        placeholder: 'O que você está pensando? (Use Ctrl+B para negrito, Ctrl+I para itálico, Ctrl+U para sublinhado)',
      },
    },
  });

  const editEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        codeBlock: false,
        blockquote: false,
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[100px] w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-turquoise disabled:cursor-not-allowed disabled:opacity-50 font-light',
        placeholder: 'O que você está pensando? (Use Ctrl+B para negrito, Ctrl+I para itálico, Ctrl+U para sublinhado)',
      },
    },
  });

  useEffect(() => {
    loadThoughts();
  }, []);

  const loadThoughts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/thoughts');
      const data = await response.json();
      if (Array.isArray(data)) {
        setThoughts(data);
      }
    } catch (error) {
      console.error('Error loading thoughts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor || !editor.getText().trim()) return;

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editor.getHTML() })
      });

      if (response.ok) {
        const thought = await response.json();
        setThoughts(prev => [thought, ...prev]);
        editor.commands.setContent('');
      }
    } catch (error) {
      console.error('Error creating thought:', error);
    }
  };

  const handleEdit = async (thoughtId: string) => {
    if (!editEditor || !editEditor.getText().trim()) {
      setEditingThought(null);
      return;
    }

    try {
      const response = await fetch(`/api/thoughts/${thoughtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editEditor.getHTML() })
      });

      if (response.ok) {
        const updatedThought = await response.json();
        setThoughts(prev => prev.map(t => 
          t.id === thoughtId ? updatedThought : t
        ));
        setEditingThought(null);
        editEditor.commands.setContent('');
      }
    } catch (error) {
      console.error('Error updating thought:', error);
    }
  };

  const handleDelete = async (thoughtId: string) => {
    if (!confirm('Tem certeza que deseja excluir este pensamento?')) return;

    try {
      const response = await fetch(`/api/thoughts/${thoughtId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setThoughts(prev => prev.filter(t => t.id !== thoughtId));
      }
    } catch (error) {
      console.error('Error deleting thought:', error);
    }
  };

  const startEditing = (thought: Thought) => {
    setEditingThought(thought.id);
    if (editEditor) {
      editEditor.commands.setContent(thought.content);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset hours to compare only dates
    const thoughtDate = new Date(date);
    thoughtDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - thoughtDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, "HH:mm", { locale: ptBR });
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays === 2) {
      return "2 dias atrás";
    } else if (diffDays === 3) {
      return "3 dias atrás";
    }
    return format(date, "d MMM", { locale: ptBR }); // ex: 15 mar
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col space-y-4 pb-4 lg:pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 pt-[72px] lg:pt-4">
          <CardTitle className="text-xs font-normal text-white/70">Pensamentos</CardTitle>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 space-y-6 px-4 lg:px-6">
          {/* Form for new thought */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <EditorContent editor={editor} />
              <div className="absolute bottom-3 right-3">
                <Button 
                  type="submit" 
                  size="icon"
                  className="h-8 w-8 rounded-full border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                  disabled={!editor?.getText().trim() || isLoading}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* List of thoughts */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Carregando...</span>
              </div>
            ) : thoughts.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Nenhum pensamento registrado</span>
              </div>
            ) : (
              thoughts.map((thought) => (
                <Card 
                  key={thought.id} 
                  className="border border-white/10 hover:border-turquoise/50 transition-all duration-300 bg-gradient-to-br from-background to-background/50"
                >
                  <CardContent className="p-6 space-y-3">
                    {editingThought === thought.id ? (
                      <div className="space-y-2">
                        <EditorContent editor={editEditor} />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingThought(null);
                              editEditor?.commands.setContent('');
                            }}
                            className="text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(thought.id)}
                            className="text-xs border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                            disabled={!editEditor?.getText().trim()}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <div className="flex items-start gap-3">
                          {/* User Profile Image */}
                          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                            {thought.user?.image ? (
                              <Image
                                src={thought.user.image}
                                alt={thought.user.name || 'Profile'}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-white/5" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* User Name and Verified Badge */}
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-sm font-medium text-white truncate">
                                {thought.user?.name || 'Usuário'}
                              </span>
                              <CheckBadgeIcon className="h-4 w-4 text-turquoise" />
                            </div>

                            {/* Thought Content */}
                            <div 
                              className="text-base font-light cursor-pointer hover:text-white/90 transition-colors"
                              onDoubleClick={() => startEditing(thought)}
                              dangerouslySetInnerHTML={{ __html: thought.content }}
                            />
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2 hover:text-red-400 flex-shrink-0"
                            onClick={() => handleDelete(thought.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 mt-4">
                          <div className="h-[1px] w-4 bg-turquoise/30" />
                          <p className="text-[11px] font-medium tracking-wide text-turquoise/50 uppercase">
                            {formatDate(thought.createdAt)}
                          </p>
                        </div>
                      </div>
                    )}
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