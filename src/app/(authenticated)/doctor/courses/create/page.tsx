'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lesson {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  duration: number;
}

interface Module {
  name: string;
  description: string;
  lessons: Lesson[];
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
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
      const response = await fetch('/api/courses', {
        method: 'POST',
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
          modules,
          lessons: directLessons
        })
      });

      if (response.ok) {
        router.push('/doctor/courses');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao criar curso');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Erro ao criar curso');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-[88px] lg:pt-8 pb-24 lg:pb-8 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/courses">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Criar Novo Curso
              </h1>
              <p className="text-gray-600 font-medium">
                Configure módulos, aulas e conteúdo educacional
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            
            {/* Basic Information */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 font-semibold">Nome do Curso *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Curso de Mindfulness"
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-900 font-semibold">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva o curso..."
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl font-medium min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Modal Configuration */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">
                  Configuração do Modal (Opcional)
                </CardTitle>
                <p className="text-gray-600 font-medium">
                  Configure um modal informativo que será exibido quando o curso estiver indisponível para um paciente.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modalTitle" className="text-gray-900 font-semibold">Título do Modal</Label>
                    <Input
                      id="modalTitle"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      placeholder="Ex: Curso em Breve"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modalVideoUrl" className="text-gray-900 font-semibold">URL do Vídeo</Label>
                    <Input
                      id="modalVideoUrl"
                      value={modalVideoUrl}
                      onChange={(e) => setModalVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modalDescription" className="text-gray-900 font-semibold">Descrição do Modal</Label>
                  <Textarea
                    id="modalDescription"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="Mensagem para o paciente..."
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl font-medium"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modalButtonText" className="text-gray-900 font-semibold">Texto do Botão</Label>
                    <Input
                      id="modalButtonText"
                      value={modalButtonText}
                      onChange={(e) => setModalButtonText(e.target.value)}
                      placeholder="Saber mais"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modalButtonUrl" className="text-gray-900 font-semibold">URL do Botão</Label>
                    <Input
                      id="modalButtonUrl"
                      value={modalButtonUrl}
                      onChange={(e) => setModalButtonUrl(e.target.value)}
                      placeholder="https://exemplo.com"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12 font-medium"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Módulos
                  </CardTitle>
                  <Button
                    type="button"
                    onClick={addModule}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Módulo
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {modules.map((module, moduleIndex) => (
                  <Card key={moduleIndex} className="bg-gray-50 border-gray-200 rounded-xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900">Módulo {moduleIndex + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeModule(moduleIndex)}
                          className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-8 w-8 p-0"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-gray-900 font-semibold">Nome do Módulo</Label>
                          <Input
                            value={module.name}
                            onChange={(e) => updateModule(moduleIndex, 'name', e.target.value)}
                            placeholder="Ex: Fundamentos"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-900 font-semibold">Descrição</Label>
                          <Input
                            value={module.description}
                            onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                            placeholder="Descrição do módulo"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                          />
                        </div>
                      </div>

                      {/* Module Lessons */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gray-900">Aulas do Módulo</h4>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addLessonToModule(moduleIndex)}
                            className="bg-teal-100 hover:bg-teal-200 text-teal-700 border-teal-300 rounded-xl h-8 px-3 font-semibold"
                          >
                            <PlusIcon className="h-3 w-3 mr-1" />
                            Aula
                          </Button>
                        </div>

                        {module.lessons.map((lesson, lessonIndex) => (
                          <Card key={lessonIndex} className="bg-white border-gray-200 rounded-xl">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-700">Aula {lessonIndex + 1}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeLessonFromModule(moduleIndex, lessonIndex)}
                                  className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 h-6 w-6 p-0 rounded-lg"
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="grid gap-3 md:grid-cols-2">
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                  placeholder="Título da aula"
                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-lg h-9 text-sm font-medium"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={lesson.duration}
                                  onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                  placeholder="Duração (min)"
                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-lg h-9 text-sm font-medium"
                                />
                              </div>
                              
                              <Input
                                value={lesson.description}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                                placeholder="Descrição da aula"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-lg h-9 text-sm font-medium"
                              />
                              
                              <Input
                                value={lesson.videoUrl}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'videoUrl', e.target.value)}
                                placeholder="URL do vídeo"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-lg h-9 text-sm font-medium"
                              />
                              
                              <Textarea
                                value={lesson.content}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                                placeholder="Conteúdo da aula"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-lg text-sm font-medium min-h-[60px]"
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Direct Lessons */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Aulas Diretas (sem módulo)
                  </CardTitle>
                  <Button
                    type="button"
                    onClick={addDirectLesson}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-10 px-4 font-semibold"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Aula
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {directLessons.map((lesson, index) => (
                  <Card key={index} className="bg-gray-50 border-gray-200 rounded-xl">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">Aula {index + 1}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDirectLesson(index)}
                          className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-8 w-8 p-0"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateDirectLesson(index, 'title', e.target.value)}
                          placeholder="Título da aula"
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={lesson.duration}
                          onChange={(e) => updateDirectLesson(index, 'duration', parseInt(e.target.value) || 0)}
                          placeholder="Duração (min)"
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                        />
                      </div>
                      
                      <Input
                        value={lesson.description}
                        onChange={(e) => updateDirectLesson(index, 'description', e.target.value)}
                        placeholder="Descrição da aula"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                      />
                      
                      <Input
                        value={lesson.videoUrl}
                        onChange={(e) => updateDirectLesson(index, 'videoUrl', e.target.value)}
                        placeholder="URL do vídeo"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-10 font-medium"
                      />
                      
                      <Textarea
                        value={lesson.content}
                        onChange={(e) => updateDirectLesson(index, 'content', e.target.value)}
                        placeholder="Conteúdo da aula"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl font-medium min-h-[80px]"
                      />
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                asChild
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-12 px-6 font-semibold"
              >
                <Link href="/doctor/courses">Cancelar</Link>
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
              >
                {isLoading ? 'Criando...' : 'Criar Curso'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 