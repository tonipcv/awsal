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

// Translations for internationalization
const translations = {
  pt: {
    backToCourses: 'Voltar aos Cursos',
    startCourse: 'Começar Curso',
    continueCourse: 'Continuar Curso',
    reviewCourse: 'Revisar Curso',
    notAssigned: 'Não Atribuído',
    inProgress: 'Em Progresso',
    completed: 'Concluído',
    enrolledOn: 'Inscrito em',
    completedOn: 'Concluído em',
    lessons: 'aulas',
    lesson: 'aula',
    minutes: 'min',
    hours: 'h',
    module: 'Módulo',
    additionalLessons: 'Aulas Adicionais',
    loadingCourse: 'Carregando curso...',
    errorLoadingCourse: 'Erro ao carregar curso',
    invalidDate: 'Data inválida',
    courseOverview: 'Visão Geral do Curso',
    progress: 'Progresso'
  },
  en: {
    backToCourses: 'Back to Courses',
    startCourse: 'Start Course',
    continueCourse: 'Continue Course',
    reviewCourse: 'Review Course',
    notAssigned: 'Not Assigned',
    inProgress: 'In Progress',
    completed: 'Completed',
    enrolledOn: 'Enrolled on',
    completedOn: 'Completed on',
    lessons: 'lessons',
    lesson: 'lesson',
    minutes: 'min',
    hours: 'h',
    module: 'Module',
    additionalLessons: 'Additional Lessons',
    loadingCourse: 'Loading course...',
    errorLoadingCourse: 'Error loading course',
    invalidDate: 'Invalid date',
    courseOverview: 'Course Overview',
    progress: 'Progress'
  }
};

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
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'pt';
    const detectedLang = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt';
    setLanguage(detectedLang);
  }, []);

  const t = translations[language];

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
        alert(t.errorLoadingCourse);
        router.push('/patient/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert(t.errorLoadingCourse);
      router.push('/patient/courses');
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
      return `${minutes}${t.minutes}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}${t.hours} ${remainingMinutes}${t.minutes}` : `${hours}${t.hours}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t.invalidDate;
      }
      return language === 'en' 
        ? date.toLocaleDateString('en-US')
        : date.toLocaleDateString('pt-BR');
    } catch (error) {
      return t.invalidDate;
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
    if (allLessons.length === 0) return t.startCourse;
    
    const hasAnyCompletedLessons = allLessons.some(lesson => lesson.completed);
    const allLessonsCompleted = allLessons.every(lesson => lesson.completed);
    
    if (!hasAnyCompletedLessons) {
      return t.startCourse;
    } else if (allLessonsCompleted) {
      return t.reviewCourse;
    } else {
      return t.continueCourse;
    }
  };

  const getStatusBadge = () => {
    if (!course?.assignment) {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-sm font-medium">{t.notAssigned}</Badge>;
    }

    if (course.assignment.completedAt) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm font-medium">{t.completed}</Badge>;
    }

    return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-sm font-medium">{t.inProgress}</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
          <div className="max-w-4xl mx-auto px-3 lg:px-6">
            <div className="space-y-6 pt-4 lg:pt-6">
              
              {/* Header Skeleton */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-gray-800/50 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-800/50 rounded w-32 animate-pulse"></div>
              </div>

              {/* Course Header Skeleton */}
              <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-800/50 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-700/50 rounded w-1/2 animate-pulse"></div>
                  <div className="h-12 bg-gray-800/50 rounded w-32 animate-pulse"></div>
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm p-6">
                    <div className="h-6 bg-gray-800/50 rounded w-48 mb-4 animate-pulse"></div>
                    <div className="space-y-2">
                      {[1, 2].map((j) => (
                        <div key={j} className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101010' }}>
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-4">{t.errorLoadingCourse}</h1>
          <Link href="/patient/courses">
            <Button className="bg-turquoise hover:bg-turquoise/90 text-black">
              {t.backToCourses}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const firstLesson = getFirstLesson();
  const totalLessons = getTotalLessons();
  const totalDuration = getTotalDuration();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
      <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
        <div className="max-w-4xl mx-auto px-3 lg:px-6">
          <div className="space-y-6 pt-4 lg:pt-6">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link href="/patient/courses">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800/50 p-2">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Button>
              </Link>
              <span className="text-gray-400 text-sm">{t.backToCourses}</span>
            </div>

            {/* Course Header */}
            <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
              <div className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  
                  {/* Course Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl lg:text-3xl font-light text-white">
                        {course.name}
                      </h1>
                      {getStatusBadge()}
                    </div>

                    {course.description && (
                      <p className="text-gray-300 leading-relaxed">
                        {course.description}
                      </p>
                    )}

                    {/* Course Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4" />
                        <span>{totalLessons} {totalLessons === 1 ? t.lesson : t.lessons}</span>
                      </div>
                      {totalDuration > 0 && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4" />
                          <span>{formatDuration(totalDuration)}</span>
                        </div>
                      )}
                    </div>

                    {/* Assignment Info */}
                    {course.assignment && (
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>
                          {t.enrolledOn}: {formatDate(course.assignment.enrolledAt)}
                        </div>
                        {course.assignment.completedAt && (
                          <div>
                            {t.completedOn}: {formatDate(course.assignment.completedAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {firstLesson ? (
                      <Link href={`/patient/courses/${courseId}/lessons/${firstLesson.id}`}>
                        <Button className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold px-8 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                          <PlayIcon className="h-5 w-5 mr-2" />
                          {getButtonText()}
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="bg-gray-600 text-gray-400 font-semibold px-8 py-3 rounded-xl">
                        {t.startCourse}
                      </Button>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Course Content */}
            <div className="space-y-4">
              <h2 className="text-xl font-light text-white mb-4">{t.courseOverview}</h2>

              {/* Modules */}
              {course.modules.map((module) => (
                <div key={module.id} className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                  
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full p-6 text-left hover:bg-gray-800/30 transition-colors rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <AcademicCapIcon className="h-5 w-5 text-turquoise" />
                          <h3 className="text-lg font-medium text-white">
                            {t.module} {module.order}: {module.name}
                          </h3>
                        </div>
                        {isModuleCompleted(module) && (
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400">
                          {getModuleProgress(module)}% {t.progress}
                        </span>
                        {expandedModules.has(module.id) ? (
                          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    {module.description && (
                      <p className="text-gray-400 text-sm mt-2 ml-8">
                        {module.description}
                      </p>
                    )}
                  </button>

                  {/* Module Lessons */}
                  {expandedModules.has(module.id) && (
                    <div className="border-t border-gray-800/40">
                      {module.lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/patient/courses/${courseId}/lessons/${lesson.id}`}
                            className="block border-b border-gray-800/40 last:border-b-0 hover:bg-gray-800/30 transition-colors"
                          >
                            <div className="p-4 ml-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                    lesson.completed 
                                      ? "bg-green-500 border-green-500" 
                                      : "border-gray-600"
                                  )}>
                                    {lesson.completed && (
                                      <CheckCircleIcon className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-white font-medium">
                                      {lesson.title}
                                    </h4>
                                    {lesson.description && (
                                      <p className="text-gray-400 text-sm mt-1">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  {lesson.duration && (
                                    <>
                                      <ClockIcon className="h-4 w-4" />
                                      <span>{formatDuration(lesson.duration)}</span>
                                    </>
                                  )}
                                  <ChevronRightIcon className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}

                </div>
              ))}

              {/* Direct Lessons */}
              {course.lessons.length > 0 && (
                <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-3">
                      <BookOpenIcon className="h-5 w-5 text-turquoise" />
                      {t.additionalLessons}
                    </h3>
                    <div className="space-y-2">
                      {course.lessons
                        .sort((a, b) => a.order - b.order)
                        .map((lesson) => (
                          <Link
                            key={lesson.id}
                            href={`/patient/courses/${courseId}/lessons/${lesson.id}`}
                            className="block p-4 rounded-lg hover:bg-gray-800/30 transition-colors border border-gray-800/40"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                  lesson.completed 
                                    ? "bg-green-500 border-green-500" 
                                    : "border-gray-600"
                                )}>
                                  {lesson.completed && (
                                    <CheckCircleIcon className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">
                                    {lesson.title}
                                  </h4>
                                  {lesson.description && (
                                    <p className="text-gray-400 text-sm mt-1">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                {lesson.duration && (
                                  <>
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{formatDuration(lesson.duration)}</span>
                                  </>
                                )}
                                <ChevronRightIcon className="h-4 w-4" />
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 