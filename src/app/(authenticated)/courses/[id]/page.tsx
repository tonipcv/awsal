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
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Ativo</Badge>;
      case 'completed':
        return <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">Concluído</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Pausado</Badge>;
      case 'unavailable':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Indisponível</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">Inativo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-xs text-gray-300">Carregando curso...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <span className="text-xs text-gray-300">Curso não encontrado</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
      {/* Header */}
      <div className="sticky top-[88px] lg:top-0 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/80 z-10 border-b border-gray-800/40">
        <div className="max-w-6xl mx-auto px-3 lg:px-6 py-2 lg:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" asChild className="text-gray-300 hover:text-white flex-shrink-0 h-7 px-2">
                <Link href="/courses">
                  <ArrowLeftIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  <span className="hidden sm:inline text-xs lg:text-sm">Cursos</span>
                </Link>
              </Button>
              <div className="h-3 w-px bg-gray-500 flex-shrink-0" />
              <h1 className="text-xs lg:text-base font-light text-white truncate">
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
      <div className="max-w-6xl mx-auto px-3 lg:px-6">
        <div className="space-y-4 lg:space-y-6 pt-4 lg:pt-6">
          {/* Course Overview */}
          <div className="bg-gray-900/40 border border-gray-800/40 rounded-lg p-3 lg:p-4 backdrop-blur-sm">
            <div className="space-y-3 lg:space-y-4">
              <div>
                <h2 className="text-base lg:text-lg font-light text-white mb-1">
                  {course.name}
                </h2>
                {course.description && (
                  <p className="hidden lg:block text-sm text-gray-300 leading-relaxed">
                    {course.description}
                  </p>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  Iniciado em {formatDate(course.assignment.startDate)}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className="text-center">
                  <div className="text-base lg:text-lg font-light text-teal-400">{course.assignment.progress || 0}%</div>
                  <div className="text-xs text-gray-400">Progresso</div>
                </div>
                <div className="text-center">
                  <div className="text-base lg:text-lg font-light text-green-400">
                    {getAllLessonsInOrder().filter(l => l.completed).length}
                  </div>
                  <div className="text-xs text-gray-400">Concluídas</div>
                </div>
                <div className="hidden lg:block text-center">
                  <div className="text-lg font-light text-white">{getTotalLessons()}</div>
                  <div className="text-xs text-gray-400">Aulas</div>
                </div>
                <div className="hidden lg:block text-center">
                  <div className="text-lg font-light text-white">{formatDuration(getTotalDuration())}</div>
                  <div className="text-xs text-gray-400">Duração</div>
                </div>
              </div>

              {/* Progress Bar - Hidden on mobile */}
              <div className="hidden lg:block space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300">Progresso do Curso</span>
                  <span className="text-white">{course.assignment.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                  <div 
                    className="bg-teal-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${course.assignment.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Start Course Button */}
              {getFirstLesson() && (
                <div className="flex justify-center pt-1">
                  <Button asChild className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black px-4 lg:px-6 py-1.5 lg:py-2 text-xs lg:text-sm font-medium">
                    <Link href={`/courses/${courseId}/lessons/${getFirstLesson()!.id}`}>
                      {getButtonText()}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="space-y-4 lg:space-y-6">
            {/* Modules */}
            {course.modules.length > 0 && (
              <div className="space-y-3 lg:space-y-4">
                <h3 className="text-base lg:text-lg font-light text-white">
                  Módulos
                </h3>
                
                <div className="space-y-2 lg:space-y-3">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="bg-gray-900/40 border border-gray-800/40 rounded-lg backdrop-blur-sm">
                      {/* Module Header */}
                      <div 
                        className="p-3 lg:p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className={`w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              isModuleCompleted(module)
                                ? 'bg-green-500 text-white'
                                : 'bg-teal-400 text-black'
                            }`}>
                              {isModuleCompleted(module) ? (
                                <CheckCircleIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div>
                              <h4 className="text-sm lg:text-base font-light text-white">{module.name}</h4>
                              {module.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{module.description}</p>
                              )}
                              <div className="flex items-center gap-2 lg:gap-3 mt-1 text-xs text-gray-500">
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
                          
                          <div className="text-gray-400">
                            {expandedModules.has(module.id) ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Module Lessons */}
                      {expandedModules.has(module.id) && (
                        <div className="border-t border-gray-600/30 p-3 lg:p-4 pt-2 lg:pt-3">
                          <div className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <Link 
                                key={lesson.id} 
                                href={`/courses/${courseId}/lessons/${lesson.id}`}
                                className="flex items-center justify-between p-2 lg:p-3 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-teal-400/30 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-5 h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-xs ${
                                    lesson.completed 
                                      ? 'bg-green-500 text-white' 
                                      : 'bg-gray-600/50 text-gray-300'
                                  }`}>
                                    {lesson.completed ? (
                                      <CheckCircleIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                                    ) : (
                                      lessonIndex + 1
                                    )}
                                  </div>
                                  <div>
                                    <span className={`text-xs lg:text-sm ${lesson.completed ? 'text-green-100' : 'text-white'}`}>
                                      {lesson.title}
                                    </span>
                                    {lesson.description && (
                                      <p className="text-xs text-gray-400 mt-0.5">{lesson.description}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {lesson.completed && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                      Concluída
                                    </Badge>
                                  )}
                                  {lesson.duration && (
                                    <span className="text-xs text-gray-400">
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
              <div className="space-y-3 lg:space-y-4">
                <h3 className="text-base lg:text-lg font-light text-white">
                  Aulas
                </h3>
                
                <div className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <Link 
                      key={lesson.id} 
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="flex items-center justify-between p-3 lg:p-4 bg-gray-900/40 border border-gray-800/40 rounded-lg hover:border-teal-400/30 transition-colors backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-2 lg:gap-3">
                        <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                          lesson.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-teal-400 text-black'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircleIcon className="h-3 w-3 lg:h-4 lg:w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <span className={`text-sm lg:text-base ${lesson.completed ? 'text-green-100' : 'text-white'}`}>
                            {lesson.title}
                          </span>
                          {lesson.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{lesson.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {lesson.completed && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Concluída
                          </Badge>
                        )}
                        {lesson.duration && (
                          <span className="text-xs text-gray-400">
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
              <div className="text-center py-12 lg:py-16">
                <div className="max-w-md mx-auto">
                  <h3 className="text-base lg:text-lg font-light text-white mb-2">
                    Curso sem conteúdo
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
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