'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Lesson {
  id?: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  duration: number;
}

interface Module {
  id?: string;
  name: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  modalTitle: string | null;
  modalDescription: string | null;
  modalVideoUrl: string | null;
  modalButtonText: string | null;
  modalButtonUrl: string | null;
  modules: Array<{
    id: string;
    name: string;
    description: string | null;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      videoUrl: string | null;
      duration: number | null;
    }>;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    videoUrl: string | null;
    duration: number | null;
  }>;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  
  // Course basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Modal configuration for unavailable courses
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalVideoUrl, setModalVideoUrl] = useState('');
  const [modalButtonText, setModalButtonText] = useState('Saber mais');
  const [modalButtonUrl, setModalButtonUrl] = useState('');
  
  // Course structure
  const [modules, setModules] = useState<Module[]>([]);
  const [directLessons, setDirectLessons] = useState<Lesson[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setIsLoadingCourse(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const course: Course = await response.json();
        
        // Set basic info
        setName(course.name);
        setDescription(course.description || '');
        
        // Set modal config
        setModalTitle(course.modalTitle || '');
        setModalDescription(course.modalDescription || '');
        setModalVideoUrl(course.modalVideoUrl || '');
        setModalButtonText(course.modalButtonText || 'Saber mais');
        setModalButtonUrl(course.modalButtonUrl || '');
        
        // Set modules and lessons
        setModules(course.modules.map(module => ({
          id: module.id,
          name: module.name,
          description: module.description || '',
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            content: lesson.content || '',
            videoUrl: lesson.videoUrl || '',
            duration: lesson.duration || 0
          }))
        })));
        
        setDirectLessons(course.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
          duration: lesson.duration || 0
        })));
      } else {
        alert('Erro ao carregar curso');
        router.push('/doctor/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Erro ao carregar curso');
      router.push('/doctor/courses');
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const addModule = () => {
    setModules([...modules, {
      name: '',
      description: '',
      lessons: []
    }]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof Module, value: string) => {
    const updated = [...modules];
    if (field === 'lessons') return; // Lessons are handled separately
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const addLessonToModule = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons.push({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0
    });
    setModules(updated);
  };

  const removeLessonFromModule = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updated);
  };

  const updateModuleLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: string | number) => {
    const updated = [...modules];
    if (field === 'duration') {
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      updated[moduleIndex].lessons[lessonIndex] = {
        ...updated[moduleIndex].lessons[lessonIndex],
        [field]: numValue > 0 ? numValue : 0
      };
    } else {
      updated[moduleIndex].lessons[lessonIndex] = {
        ...updated[moduleIndex].lessons[lessonIndex],
        [field]: value
      };
    }
    setModules(updated);
  };

  const addDirectLesson = () => {
    setDirectLessons([...directLessons, {
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0
    }]);
  };

  const removeDirectLesson = (index: number) => {
    setDirectLessons(directLessons.filter((_, i) => i !== index));
  };

  const updateDirectLesson = (index: number, field: keyof Lesson, value: string | number) => {
    const updated = [...directLessons];
    if (field === 'duration') {
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      updated[index] = { 
        ...updated[index], 
        [field]: numValue > 0 ? numValue : 0
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDirectLessons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Nome do curso é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          modalTitle: modalTitle.trim() || null,
          modalDescription: modalDescription.trim() || null,
          modalVideoUrl: modalVideoUrl.trim() || null,
          modalButtonText: modalButtonText.trim() || 'Saber mais',
          modalButtonUrl: modalButtonUrl.trim() || null,
          modules: modules.map(module => ({
            name: module.name,
            description: module.description,
            lessons: module.lessons
          })),
          lessons: directLessons
        })
      });

      if (response.ok) {
        router.push('/doctor/courses');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao atualizar curso');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Erro ao atualizar curso');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/doctor/courses');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao excluir curso');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Erro ao excluir curso');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Carregando curso...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 lg:pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 pt-[72px] lg:pt-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild className="border-border/30 text-white/70 hover:bg-white/5">
              <Link href="/doctor/courses">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <BookOpenIcon className="h-5 w-5 text-turquoise" />
            <CardTitle className="text-xs font-normal text-white/70">
              Editar Curso
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-light text-white border-b border-border/30 pb-2">
                Informações Básicas
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-white/70">Nome do Curso *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Curso de Mindfulness"
                    className="bg-background/10 border-border/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm text-white/70">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o curso..."
                    className="bg-background/10 border-border/20 text-white min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Configuration */}
            <div className="space-y-6">
              <h2 className="text-lg font-light text-white border-b border-border/30 pb-2">
                Configuração do Modal (Opcional)
              </h2>
              <p className="text-sm text-white/50">
                Configure um modal informativo que será exibido quando o curso estiver indisponível para um paciente.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modalTitle" className="text-sm text-white/70">Título do Modal</Label>
                  <Input
                    id="modalTitle"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="Ex: Curso em Breve"
                    className="bg-background/10 border-border/20 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modalVideoUrl" className="text-sm text-white/70">URL do Vídeo</Label>
                  <Input
                    id="modalVideoUrl"
                    value={modalVideoUrl}
                    onChange={(e) => setModalVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="bg-background/10 border-border/20 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalDescription" className="text-sm text-white/70">Descrição do Modal</Label>
                <Textarea
                  id="modalDescription"
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Mensagem para o paciente..."
                  className="bg-background/10 border-border/20 text-white"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="modalButtonText" className="text-sm text-white/70">Texto do Botão</Label>
                  <Input
                    id="modalButtonText"
                    value={modalButtonText}
                    onChange={(e) => setModalButtonText(e.target.value)}
                    placeholder="Saber mais"
                    className="bg-background/10 border-border/20 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modalButtonUrl" className="text-sm text-white/70">URL do Botão</Label>
                  <Input
                    id="modalButtonUrl"
                    value={modalButtonUrl}
                    onChange={(e) => setModalButtonUrl(e.target.value)}
                    placeholder="https://exemplo.com"
                    className="bg-background/10 border-border/20 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-light text-white border-b border-border/30 pb-2 flex-1">
                  Módulos
                </h2>
                <Button
                  type="button"
                  onClick={addModule}
                  className="bg-turquoise hover:bg-turquoise/90 text-background ml-4"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Módulo
                </Button>
              </div>

              {modules.map((module, moduleIndex) => (
                <Card key={moduleIndex} className="bg-background/10 border-border/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm text-white">Módulo {moduleIndex + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeModule(moduleIndex)}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm text-white/70">Nome do Módulo</Label>
                        <Input
                          value={module.name}
                          onChange={(e) => updateModule(moduleIndex, 'name', e.target.value)}
                          placeholder="Ex: Fundamentos"
                          className="bg-background/10 border-border/20 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-white/70">Descrição</Label>
                        <Input
                          value={module.description}
                          onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                          placeholder="Descrição do módulo"
                          className="bg-background/10 border-border/20 text-white"
                        />
                      </div>
                    </div>

                    {/* Module Lessons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white/70">Aulas do Módulo</h4>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addLessonToModule(moduleIndex)}
                          className="bg-turquoise/20 hover:bg-turquoise/30 text-turquoise border-turquoise/30"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          Aula
                        </Button>
                      </div>

                      {module.lessons.map((lesson, lessonIndex) => (
                        <Card key={lessonIndex} className="bg-background/5 border-border/10">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/50">Aula {lessonIndex + 1}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeLessonFromModule(moduleIndex, lessonIndex)}
                                className="text-red-400 border-red-500/30 hover:bg-red-500/10 h-6 w-6 p-0"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                placeholder="Título da aula"
                                className="bg-background/10 border-border/20 text-white text-sm"
                              />
                              <Input
                                type="number"
                                min="0"
                                value={lesson.duration}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                placeholder="Duração (min)"
                                className="bg-background/10 border-border/20 text-white text-sm"
                              />
                            </div>
                            
                            <Input
                              value={lesson.description}
                              onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                              placeholder="Descrição da aula"
                              className="bg-background/10 border-border/20 text-white text-sm"
                            />
                            
                            <Input
                              value={lesson.videoUrl}
                              onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'videoUrl', e.target.value)}
                              placeholder="URL do vídeo"
                              className="bg-background/10 border-border/20 text-white text-sm"
                            />
                            
                            <Textarea
                              value={lesson.content}
                              onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                              placeholder="Conteúdo da aula"
                              className="bg-background/10 border-border/20 text-white text-sm min-h-[60px]"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Direct Lessons */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-light text-white border-b border-border/30 pb-2 flex-1">
                  Aulas Diretas (sem módulo)
                </h2>
                <Button
                  type="button"
                  onClick={addDirectLesson}
                  className="bg-turquoise hover:bg-turquoise/90 text-background ml-4"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Aula
                </Button>
              </div>

              {directLessons.map((lesson, index) => (
                <Card key={index} className="bg-background/10 border-border/20">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Aula {index + 1}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDirectLesson(index)}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateDirectLesson(index, 'title', e.target.value)}
                        placeholder="Título da aula"
                        className="bg-background/10 border-border/20 text-white"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={lesson.duration}
                        onChange={(e) => updateDirectLesson(index, 'duration', parseInt(e.target.value) || 0)}
                        placeholder="Duração (min)"
                        className="bg-background/10 border-border/20 text-white"
                      />
                    </div>
                    
                    <Input
                      value={lesson.description}
                      onChange={(e) => updateDirectLesson(index, 'description', e.target.value)}
                      placeholder="Descrição da aula"
                      className="bg-background/10 border-border/20 text-white"
                    />
                    
                    <Input
                      value={lesson.videoUrl}
                      onChange={(e) => updateDirectLesson(index, 'videoUrl', e.target.value)}
                      placeholder="URL do vídeo"
                      className="bg-background/10 border-border/20 text-white"
                    />
                    
                    <Textarea
                      value={lesson.content}
                      onChange={(e) => updateDirectLesson(index, 'content', e.target.value)}
                      placeholder="Conteúdo da aula"
                      className="bg-background/10 border-border/20 text-white min-h-[80px]"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-border/30">
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 sm:w-auto"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Excluir Curso
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border-border/30">
                  <DialogHeader>
                    <DialogTitle className="text-white">Excluir Curso</DialogTitle>
                    <DialogDescription className="text-white/70">
                      Tem certeza que deseja excluir o curso "{name}"? 
                      Esta ação não pode ser desfeita e todos os dados do curso serão perdidos permanentemente.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDeleteDialogOpen(false)}
                      className="border-border/30 text-white/70 hover:bg-white/5"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={deleteCourse}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      {isDeleting ? 'Excluindo...' : 'Excluir Curso'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex gap-2 sm:ml-auto">
                <Button variant="outline" asChild className="border-border/30 text-white/70 hover:bg-white/5">
                  <Link href="/doctor/courses">
                    Cancelar
                  </Link>
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-turquoise hover:bg-turquoise/90 text-background"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 