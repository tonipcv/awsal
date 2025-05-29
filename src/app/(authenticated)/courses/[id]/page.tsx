'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  videoUrl: string | null;
  duration: number | null;
  order: number;
  completed?: boolean;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
  completed?: boolean;
  progress?: number;
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  modules: Module[];
  lessons: Lesson[];
  assignment: {
    id: string;
    status: string;
    startDate: string;
    progress?: number;
  };
}

export default function PatientCourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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
        // Expand first module by default
        if (data.modules.length > 0) {
          setExpandedModules(new Set([data.modules[0].id]));
        }
      } else {
        alert('Erro ao carregar curso');
        router.push('/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Erro ao carregar curso');
      router.push('/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
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

  const getAllLessonsInOrder = (): Lesson[] => {
    if (!course) return [];
    
    const allLessons: Lesson[] = [];
    
    // Add module lessons in order
    course.modules
      .sort((a, b) => a.order - b.order)
      .forEach(module => {
        module.lessons
          .sort((a, b) => a.order - b.order)
          .forEach(lesson => allLessons.push(lesson));
      });
    
    // Add direct lessons
    course.lessons
      .sort((a, b) => a.order - b.order)
      .forEach(lesson => allLessons.push(lesson));
    
    return allLessons;
  };

  const getFirstLesson = (): Lesson | null => {
    const allLessons = getAllLessonsInOrder();
    if (allLessons.length === 0) return null;
    
    // Find the first uncompleted lesson
    const firstUncompletedLesson = allLessons.find(lesson => !lesson.completed);
    
    // If all lessons are completed, return the first lesson
    // If no uncompleted lesson found, return the first lesson
    return firstUncompletedLesson || allLessons[0];
  };

  const getModuleProgress = (module: Module) => {
    if (module.lessons.length === 0) return 0;
    const completedLessons = module.lessons.filter(lesson => lesson.completed).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  };

  const isModuleCompleted = (module: Module) => {
    return module.lessons.length > 0 && module.lessons.every(lesson => lesson.completed);
  };

  const getButtonText = (): string => {
    const allLessons = getAllLessonsInOrder();
    if (allLessons.length === 0) return 'Começar Curso';
    
    const hasAnyCompletedLessons = allLessons.some(lesson => lesson.completed);
    const allLessonsCompleted = allLessons.every(lesson => lesson.completed);
    
    if (!hasAnyCompletedLessons) {
      return 'Começar Curso';
    } else if (allLessonsCompleted) {
      return 'Revisar Curso';
    } else {
      return 'Continuar Curso';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
      case 'completed':
        return <Badge className="bg-[#4e51e1]/20 text-[#4e51e1] border-[#4e51e1]/30">Concluído</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pausado</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Indisponível</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Inativo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-300">Carregando curso...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-300">Curso não encontrado</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 z-10 border-b border-zinc-600/30">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-[88px] lg:pt-6 pb-3 lg:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="sm" asChild className="text-zinc-300 hover:text-white flex-shrink-0">
                <Link href="/courses">
                  <ArrowLeftIcon className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Cursos</span>
                </Link>
              </Button>
              <div className="h-4 w-px bg-zinc-500 flex-shrink-0" />
              <h1 className="text-sm lg:text-xl font-light text-white truncate">
                {course.name}
              </h1>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(course.assignment.status)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        <div className="space-y-8 pt-8 lg:pt-12">
          {/* Course Overview */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-4 lg:p-8 backdrop-blur-sm">
            <div className="space-y-4 lg:space-y-6">
              <div>
                <h2 className="text-lg lg:text-2xl font-light text-white mb-2">
                  {course.name}
                </h2>
                {course.description && (
                  <p className="hidden lg:block text-base text-zinc-300 leading-relaxed">
                    {course.description}
                  </p>
                )}
                <div className="mt-3 lg:mt-4 text-xs lg:text-sm text-zinc-400">
                  Iniciado em {formatDate(course.assignment.startDate)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-light text-[#76e1d8]">{course.assignment.progress || 0}%</div>
                  <div className="text-xs text-zinc-400">Progresso</div>
                </div>
                <div className="text-center">
                  <div className="text-lg lg:text-2xl font-light text-green-400">
                    {getAllLessonsInOrder().filter(l => l.completed).length}
                  </div>
                  <div className="text-xs text-zinc-400">Concluídas</div>
                </div>
                <div className="hidden lg:block text-center">
                  <div className="text-2xl font-light text-white">{getTotalLessons()}</div>
                  <div className="text-xs text-zinc-400">Aulas</div>
                </div>
                <div className="hidden lg:block text-center">
                  <div className="text-2xl font-light text-white">{formatDuration(getTotalDuration())}</div>
                  <div className="text-xs text-zinc-400">Duração</div>
                </div>
              </div>

              {/* Progress Bar - Hidden on mobile */}
              <div className="hidden lg:block space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Progresso do Curso</span>
                  <span className="text-white">{course.assignment.progress || 0}%</span>
                </div>
                <div className="w-full bg-zinc-700/50 rounded-full h-2">
                  <div 
                    className="bg-[#76e1d8] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${course.assignment.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Start Course Button */}
              {getFirstLesson() && (
                <div className="flex justify-center pt-2">
                  <Button asChild className="bg-[#76e1d8] hover:bg-[#5dd4c8] text-white px-6 lg:px-8 py-2 lg:py-3 text-sm lg:text-base">
                    <Link href={`/courses/${courseId}/lessons/${getFirstLesson()!.id}`}>
                      {getButtonText()}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="space-y-8">
            {/* Modules */}
            {course.modules.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl lg:text-2xl font-light text-white">
                  Módulos
                </h3>
                
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg backdrop-blur-sm">
                      {/* Module Header */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              isModuleCompleted(module)
                                ? 'bg-green-500 text-white'
                                : 'bg-[#76e1d8] text-white'
                            }`}>
                              {isModuleCompleted(module) ? (
                                <CheckCircleIcon className="h-5 w-5" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div>
                              <h4 className="text-lg font-light text-white">{module.name}</h4>
                              {module.description && (
                                <p className="text-sm text-zinc-400 mt-1">{module.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                                <span>
                                  {module.lessons.filter(l => l.completed).length}/{module.lessons.length} concluídas
                                </span>
                                <span>•</span>
                                <span>{module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}</span>
                                {getModuleProgress(module) > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{getModuleProgress(module)}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-zinc-400">
                            {expandedModules.has(module.id) ? (
                              <ChevronDownIcon className="h-5 w-5" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Module Lessons */}
                      {expandedModules.has(module.id) && (
                        <div className="border-t border-zinc-600/30 p-6 pt-4">
                          <div className="space-y-3">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <Link 
                                key={lesson.id} 
                                href={`/courses/${courseId}/lessons/${lesson.id}`}
                                className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30 hover:border-[#76e1d8]/30 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                    lesson.completed 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-zinc-600/50 text-zinc-300'
                                  }`}>
                                    {lesson.completed ? (
                                      <CheckCircleIcon className="h-4 w-4" />
                                    ) : (
                                      lessonIndex + 1
                                    )}
                                  </div>
                                  <div>
                                    <span className={`text-sm ${lesson.completed ? 'text-green-100' : 'text-white'}`}>
                                      {lesson.title}
                                    </span>
                                    {lesson.description && (
                                      <p className="text-xs text-zinc-400 mt-1">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {lesson.completed && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                      Concluída
                                    </Badge>
                                  )}
                                  {lesson.duration && (
                                    <span className="text-xs text-zinc-400">
                                      {lesson.duration}min
                                    </span>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Lessons */}
            {course.lessons.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl lg:text-2xl font-light text-white">
                  Aulas
                </h3>
                
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => (
                    <Link 
                      key={lesson.id} 
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg hover:border-[#76e1d8]/30 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          lesson.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-[#76e1d8] text-white'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <span className={`text-base ${lesson.completed ? 'text-green-100' : 'text-white'}`}>
                            {lesson.title}
                          </span>
                          {lesson.description && (
                            <p className="text-sm text-zinc-400 mt-1">{lesson.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {lesson.completed && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Concluída
                          </Badge>
                        )}
                        {lesson.duration && (
                          <span className="text-sm text-zinc-400">
                            {lesson.duration}min
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {course.modules.length === 0 && course.lessons.length === 0 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-light text-white mb-3">
                    Curso sem conteúdo
                  </h3>
                  <p className="text-zinc-300 leading-relaxed">
                    Este curso ainda não possui conteúdo disponível.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 