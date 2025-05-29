'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Course {
  id: string;
  name: string;
  description: string | null;
  modalTitle: string | null;
  modalDescription: string | null;
  modalVideoUrl: string | null;
  modalButtonText: string | null;
  modalButtonUrl: string | null;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  modules: Array<{
    id: string;
    name: string;
    description: string | null;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      videoUrl: string | null;
      duration: number | null;
      order: number;
    }>;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    videoUrl: string | null;
    duration: number | null;
    order: number;
  }>;
  assignments: Array<{
    id: string;
    status: string;
    startDate: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function CourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      } else {
        alert('Erro ao carregar curso');
        router.push('/doctor/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Erro ao carregar curso');
      router.push('/doctor/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async () => {
    if (!course) return;
    
    if (!confirm('Tem certeza que deseja excluir este curso?')) {
      return;
    }

    try {
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
    }
  };

  const getTotalLessons = () => {
    if (!course) return 0;
    const moduleLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    return moduleLessons + course.lessons.length;
  };

  const getTotalDuration = () => {
    if (!course) return 0;
    const moduleDuration = course.modules.reduce((acc, module) => 
      acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
    );
    const directDuration = course.lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);
    return moduleDuration + directDuration;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Carregando curso...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-xs text-muted-foreground">Curso não encontrado</span>
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
              {course.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="border-border/30 text-white/70 hover:bg-white/5">
              <Link href={`/doctor/courses/${courseId}/edit`}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={deleteCourse}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Course Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-light text-white mb-2">{course.name}</h1>
                {course.description && (
                  <p className="text-white/70">{course.description}</p>
                )}
                <p className="text-xs text-white/50 mt-2">
                  Criado em {formatDate(course.createdAt)}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-background/10 border-border/20">
                  <CardContent className="p-4 text-center">
                    <BookOpenIcon className="h-6 w-6 text-turquoise mx-auto mb-2" />
                    <div className="text-lg font-medium text-white">{course.modules.length}</div>
                    <div className="text-xs text-white/60">Módulos</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background/10 border-border/20">
                  <CardContent className="p-4 text-center">
                    <PlayIcon className="h-6 w-6 text-turquoise mx-auto mb-2" />
                    <div className="text-lg font-medium text-white">{getTotalLessons()}</div>
                    <div className="text-xs text-white/60">Aulas</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background/10 border-border/20">
                  <CardContent className="p-4 text-center">
                    <ClockIcon className="h-6 w-6 text-turquoise mx-auto mb-2" />
                    <div className="text-lg font-medium text-white">{formatDuration(getTotalDuration())}</div>
                    <div className="text-xs text-white/60">Duração</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-background/10 border-border/20">
                  <CardContent className="p-4 text-center">
                    <UsersIcon className="h-6 w-6 text-turquoise mx-auto mb-2" />
                    <div className="text-lg font-medium text-white">{course.assignments.length}</div>
                    <div className="text-xs text-white/60">Alunos</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Modal Configuration */}
            {(course.modalTitle || course.modalDescription || course.modalVideoUrl) && (
              <div className="space-y-4">
                <h2 className="text-lg font-light text-white border-b border-border/30 pb-2">
                  Configuração do Modal
                </h2>
                <Card className="bg-background/10 border-border/20">
                  <CardContent className="p-4 space-y-3">
                    {course.modalTitle && (
                      <div>
                        <span className="text-xs text-white/50">Título:</span>
                        <p className="text-white">{course.modalTitle}</p>
                      </div>
                    )}
                    {course.modalDescription && (
                      <div>
                        <span className="text-xs text-white/50">Descrição:</span>
                        <p className="text-white/70">{course.modalDescription}</p>
                      </div>
                    )}
                    {course.modalVideoUrl && (
                      <div>
                        <span className="text-xs text-white/50">Vídeo:</span>
                        <p className="text-white/70 break-all">{course.modalVideoUrl}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-white/50">Botão:</span>
                      <span className="text-white">{course.modalButtonText || 'Saber mais'}</span>
                      {course.modalButtonUrl && (
                        <span className="text-white/70 break-all">{course.modalButtonUrl}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Modules */}
            {course.modules.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-light text-white border-b border-border/30 pb-2">
                  Módulos ({course.modules.length})
                </h2>
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <Card key={module.id} className="bg-background/10 border-border/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">
                          {index + 1}. {module.name}
                        </CardTitle>
                        {module.description && (
                          <p className="text-xs text-white/60">{module.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex items-center justify-between p-2 bg-background/5 rounded border border-border/10">
                            <div className="flex-1">
                              <span className="text-sm text-white">{lessonIndex + 1}. {lesson.title}</span>
                              {lesson.description && (
                                <p className="text-xs text-white/50 mt-1">{lesson.description}</p>
                              )}
                            </div>
                            {lesson.duration && (
                              <Badge variant="outline" className="text-xs border-border/30 text-white/60">
                                {lesson.duration}min
                              </Badge>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Lessons */}
            {course.lessons.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-light text-white border-b border-border/30 pb-2">
                  Aulas Diretas ({course.lessons.length})
                </h2>
                <div className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-background/10 rounded border border-border/20">
                      <div className="flex-1">
                        <span className="text-sm text-white">{index + 1}. {lesson.title}</span>
                        {lesson.description && (
                          <p className="text-xs text-white/50 mt-1">{lesson.description}</p>
                        )}
                      </div>
                      {lesson.duration && (
                        <Badge variant="outline" className="text-xs border-border/30 text-white/60">
                          {lesson.duration}min
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assigned Students */}
            {course.assignments.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-light text-white border-b border-border/30 pb-2">
                  Alunos Atribuídos ({course.assignments.length})
                </h2>
                <div className="space-y-2">
                  {course.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-background/10 rounded border border-border/20">
                      <div className="flex-1">
                        <span className="text-sm text-white">{assignment.user.name}</span>
                        <p className="text-xs text-white/50">{assignment.user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs border-border/30 ${
                            assignment.status === 'active' ? 'text-green-400 border-green-500/30' :
                            assignment.status === 'completed' ? 'text-blue-400 border-blue-500/30' :
                            assignment.status === 'paused' ? 'text-yellow-400 border-yellow-500/30' :
                            assignment.status === 'unavailable' ? 'text-orange-400 border-orange-500/30' :
                            'text-gray-400 border-gray-500/30'
                          }`}
                        >
                          {assignment.status === 'active' ? 'Ativo' :
                           assignment.status === 'completed' ? 'Concluído' :
                           assignment.status === 'paused' ? 'Pausado' :
                           assignment.status === 'unavailable' ? 'Indisponível' :
                           'Inativo'}
                        </Badge>
                        <span className="text-xs text-white/50">
                          Desde {formatDate(assignment.startDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {course.modules.length === 0 && course.lessons.length === 0 && (
              <div className="text-center py-12">
                <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Curso sem conteúdo
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Este curso ainda não possui módulos ou aulas.
                </p>
                <Button asChild className="bg-turquoise hover:bg-turquoise/90 text-background">
                  <Link href={`/doctor/courses/${courseId}/edit`}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Adicionar Conteúdo
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 