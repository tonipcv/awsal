'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlayIcon,
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { cn } from "@/lib/utils";

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
    enrolledAt: string;
    completedAt?: string | null;
    progress: number;
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
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

  const getStatusBadge = () => {
    if (!course?.assignment) {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-sm font-medium">Não Atribuído</Badge>;
    }
    
    if (course.assignment.completedAt) {
      return <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30 text-sm font-medium">Concluído</Badge>;
    }
    
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm font-medium">Ativo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
            <div className="animate-pulse space-y-8">
              {/* Header skeleton */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 bg-gray-800/50 rounded"></div>
                  <div className="h-6 w-px bg-gray-700/50"></div>
                  <div className="h-6 bg-gray-800/50 rounded w-64"></div>
                </div>
                <div className="h-8 bg-gray-800/50 rounded w-96"></div>
                <div className="h-4 bg-gray-700/50 rounded w-48"></div>
            </div>

              {/* Stats skeleton */}
              <div className="bg-white/[0.02] border border-gray-800/60 rounded-2xl p-6 backdrop-blur-sm">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="text-center space-y-2">
                      <div className="h-8 bg-gray-800/50 rounded w-12 mx-auto"></div>
                      <div className="h-4 bg-gray-700/50 rounded w-16 mx-auto"></div>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-gray-800/50 rounded-full w-full mb-4"></div>
                <div className="h-10 bg-gray-800/50 rounded w-32"></div>
              </div>

              {/* Content skeleton */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white/[0.02] border border-gray-800/60 rounded-2xl"></div>
                ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Curso não encontrado</h2>
            <Button asChild className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold">
              <Link href="/courses">Voltar aos Cursos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalLessons = getTotalLessons();
  const completedLessons = getAllLessonsInOrder().filter(l => l.completed).length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[88px] pb-24 lg:pt-[88px] lg:pb-4 lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:px-6 lg:py-8">
          
          {/* Header Section */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-turquoise transition-colors -ml-2">
                <Link href="/courses">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-700/50" />
              <h1 className="text-xl lg:text-2xl font-medium text-white tracking-tight">
                {course.name}
              </h1>
      </div>

            {/* Course Overview Card */}
            <div className="bg-white/[0.02] border border-gray-800/60 rounded-2xl p-6 lg:p-8 backdrop-blur-sm mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                {course.description && (
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                    {course.description}
                  </p>
                )}
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                      Progresso: <span className="text-turquoise font-semibold">{course.assignment.progress}%</span>
                </div>
                    <div className="h-4 w-px bg-gray-700/50"></div>
                    <div className="text-sm text-gray-400">
                      {completedLessons} de {totalLessons} aulas concluídas
                </div>
                  </div>
                </div>
                <div className="ml-6">
                  {getStatusBadge()}
                </div>
              </div>

              {/* Action Button */}
              {getFirstLesson() && (
                <div className="flex justify-center">
                  <Button asChild size="lg" className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold px-8 py-3 text-base shadow-lg shadow-turquoise/25 hover:shadow-turquoise/40 hover:scale-105 transition-all duration-200">
                    <Link href={`/courses/${courseId}/lessons/${getFirstLesson()!.id}`} className="flex items-center gap-2">
                      <PlayIcon className="h-5 w-5" />
                      {getButtonText()}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Course Content */}
          <div className="space-y-6 lg:space-y-8">
            
            {/* Modules */}
            {course.modules.length > 0 && (
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <BookOpenIcon className="h-6 w-6 text-turquoise" />
                  Módulos do Curso
                </h2>
                
                <div className="space-y-4">
                  {course.modules.map((module, index) => (
                    <div key={module.id} className="bg-white/[0.02] border border-gray-800/60 rounded-2xl overflow-hidden backdrop-blur-sm">
                      {/* Module Header */}
                      <div 
                        className="p-6 cursor-pointer hover:bg-white/[0.01] transition-colors"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center text-lg font-semibold border-2 transition-all",
                              isModuleCompleted(module)
                                ? "bg-turquoise/15 border-turquoise/50 text-turquoise shadow-lg shadow-turquoise/10"
                                : "bg-gray-800/50 border-gray-700/50 text-gray-300"
                            )}>
                              {isModuleCompleted(module) ? (
                                <CheckCircleIcon className="h-6 w-6" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">{module.name}</h3>
                              {module.description && (
                                <p className="text-gray-400 mb-2">{module.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="font-medium">
                                  {module.lessons.filter(l => l.completed).length}/{module.lessons.length} aulas concluídas
                                </span>
                                <span>•</span>
                                <span>{module.lessons.length} {module.lessons.length === 1 ? 'aula' : 'aulas'}</span>
                                {getModuleProgress(module) > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold text-turquoise">{getModuleProgress(module)}% completo</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-gray-400">
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
                        <div className="border-t border-gray-800/40 bg-gray-800/20">
                          <div className="p-6 space-y-3">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <Link 
                                key={lesson.id} 
                                href={`/courses/${courseId}/lessons/${lesson.id}`}
                                className="flex items-center justify-between p-4 lg:p-5 bg-gray-800/30 rounded-xl border border-gray-700/40 hover:border-turquoise/30 hover:bg-gray-800/40 transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all",
                                    lesson.completed 
                                      ? "bg-turquoise/15 border-turquoise/50 text-turquoise" 
                                      : "bg-gray-700/50 text-gray-300"
                                  )}>
                                    {lesson.completed ? (
                                      <CheckCircleIcon className="h-4 w-4" />
                                    ) : (
                                      lessonIndex + 1
                                    )}
                                  </div>
                                  <div>
                                    <div className={cn(
                                      "font-medium",
                                      lesson.completed ? "text-turquoise-light" : "text-white"
                                    )}>
                                      {lesson.title}
                                    </div>
                                    {lesson.description && (
                                      <div className="text-sm text-gray-400 mt-1">{lesson.description}</div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {lesson.completed && (
                                    <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30 text-xs">
                                      Concluída
                                    </Badge>
                                  )}
                                  {lesson.duration && (
                                    <div className="flex items-center gap-1 text-sm text-gray-400">
                                      <ClockIcon className="h-4 w-4" />
                                      {lesson.duration}min
                                    </div>
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
              <div>
                <h2 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <AcademicCapIcon className="h-6 w-6 text-turquoise" />
                  Aulas do Curso
                </h2>
                
                <div className="space-y-3">
                  {course.lessons.map((lesson, index) => (
                    <Link 
                      key={lesson.id} 
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      className="flex items-center justify-between p-6 bg-white/[0.02] border border-gray-800/60 rounded-2xl hover:border-turquoise/30 hover:bg-white/[0.01] transition-all duration-200 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center text-lg font-semibold border-2 transition-all",
                          lesson.completed 
                            ? "bg-turquoise/15 border-turquoise/50 text-turquoise shadow-lg shadow-turquoise/10"
                            : "bg-gray-800/50 border-gray-700/50 text-gray-300"
                        )}>
                          {lesson.completed ? (
                            <CheckCircleIcon className="h-6 w-6" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div>
                          <div className={cn(
                            "text-lg font-semibold mb-1",
                            lesson.completed ? "text-turquoise-light" : "text-white"
                          )}>
                            {lesson.title}
                          </div>
                          {lesson.description && (
                            <div className="text-gray-400">{lesson.description}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {lesson.completed && (
                          <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30">
                            Concluída
                          </Badge>
                        )}
                        {lesson.duration && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <ClockIcon className="h-4 w-4" />
                            <span className="font-medium">{lesson.duration}min</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {course.modules.length === 0 && course.lessons.length === 0 && (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <BookOpenIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Curso sem conteúdo
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Este curso ainda não possui conteúdo disponível. Entre em contato com seu instrutor para mais informações.
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