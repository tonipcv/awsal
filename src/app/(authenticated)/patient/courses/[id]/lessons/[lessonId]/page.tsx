'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { cn } from "@/lib/utils";

// Translations for internationalization
const translations = {
  pt: {
    backToCourse: 'Voltar ao Curso',
    lessonNotFound: 'Aula não encontrada',
    errorLoadingCourse: 'Erro ao carregar curso',
    backToCourses: 'Voltar aos Cursos',
    markAsCompleted: 'Marcar como Concluída',
    markAsIncomplete: 'Marcar como Incompleta',
    completed: 'Concluída',
    previousLesson: 'Aula Anterior',
    nextLesson: 'Próxima Aula',
    minutes: 'min',
    hours: 'h',
    loadingLesson: 'Carregando aula...',
    errorMarkingComplete: 'Erro ao marcar como concluída',
    errorMarkingIncomplete: 'Erro ao marcar como incompleta',
    module: 'Módulo',
    lesson: 'Aula'
  },
  en: {
    backToCourse: 'Back to Course',
    lessonNotFound: 'Lesson not found',
    errorLoadingCourse: 'Error loading course',
    backToCourses: 'Back to Courses',
    markAsCompleted: 'Mark as Completed',
    markAsIncomplete: 'Mark as Incomplete',
    completed: 'Completed',
    previousLesson: 'Previous Lesson',
    nextLesson: 'Next Lesson',
    minutes: 'min',
    hours: 'h',
    loadingLesson: 'Loading lesson...',
    errorMarkingComplete: 'Error marking as complete',
    errorMarkingIncomplete: 'Error marking as incomplete',
    module: 'Module',
    lesson: 'Lesson'
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
  moduleId: string | null;
  completed?: boolean;
  completedAt?: Date | null;
}

interface Module {
  id: string;
  name: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
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

interface LessonNavigation {
  previous?: {
    id: string;
    title: string;
    moduleId?: string;
  };
  next?: {
    id: string;
    title: string;
    moduleId?: string;
  };
}

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [navigation, setNavigation] = useState<LessonNavigation>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'pt';
    const detectedLang = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt';
    setLanguage(detectedLang);
  }, []);

  const t = translations[language];

  useEffect(() => {
    loadCourseAndLesson();
  }, [courseId, lessonId]);

  const loadCourseAndLesson = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const courseData: Course = await response.json();
        setCourse(courseData);
        
        // Find the current lesson
        const lesson = findLessonById(courseData, lessonId);
        if (lesson) {
          setCurrentLesson(lesson);
          setIsCompleted(lesson.completed || false);
          setNavigation(calculateNavigation(courseData, lessonId));
        } else {
          alert(t.lessonNotFound);
          router.push(`/courses/${courseId}`);
        }
      } else {
        alert(t.errorLoadingCourse);
        router.push('/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert(t.errorLoadingCourse);
      router.push('/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const findLessonById = (course: Course, lessonId: string): Lesson | null => {
    // Search in direct lessons
    const directLesson = course.lessons.find(lesson => lesson.id === lessonId);
    if (directLesson) return directLesson;
    
    // Search in module lessons
    for (const module of course.modules) {
      const moduleLesson = module.lessons.find(lesson => lesson.id === lessonId);
      if (moduleLesson) return moduleLesson;
    }
    
    return null;
  };

  const getAllLessonsInOrder = (course: Course): Lesson[] => {
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

  const calculateNavigation = (course: Course, currentLessonId: string): LessonNavigation => {
    const allLessons = getAllLessonsInOrder(course);
    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
    
    const navigation: LessonNavigation = {};
    
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      navigation.previous = {
        id: prevLesson.id,
        title: prevLesson.title,
        moduleId: prevLesson.moduleId || undefined
      };
    }
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      navigation.next = {
        id: nextLesson.id,
        title: nextLesson.title,
        moduleId: nextLesson.moduleId || undefined
      };
    }
    
    return navigation;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}${t.minutes}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}${t.hours} ${remainingMinutes}${t.minutes}` : `${hours}${t.hours}`;
  };

  const markAsCompleted = async () => {
    try {
      setIsMarkingComplete(true);
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsCompleted(data.completed);
        
        // Optionally reload course data to update progress
        loadCourseAndLesson();
      } else {
        const error = await response.json();
        alert(error.message || t.errorMarkingComplete);
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      alert(t.errorMarkingComplete);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const markAsIncomplete = async () => {
    try {
      setIsMarkingComplete(true);
      const response = await fetch(`/api/courses/${courseId}/lessons/${lessonId}/incomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsCompleted(data.completed);
        
        // Optionally reload course data to update progress
        loadCourseAndLesson();
      } else {
        const error = await response.json();
        alert(error.message || t.errorMarkingIncomplete);
      }
    } catch (error) {
      console.error('Error marking lesson as incomplete:', error);
      alert(t.errorMarkingIncomplete);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const getCurrentModule = (): Module | null => {
    if (!course || !currentLesson?.moduleId) return null;
    return course.modules.find(module => module.id === currentLesson.moduleId) || null;
  };

  const processYouTubeUrl = (url: string): string => {
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
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

              {/* Content Skeleton */}
              <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm p-6">
                <div className="space-y-4">
                  <div className="h-8 bg-gray-800/50 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-700/50 rounded w-1/2 animate-pulse"></div>
                  <div className="h-64 bg-gray-800/50 rounded animate-pulse"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101010' }}>
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-4">{t.lessonNotFound}</h1>
          <Link href="/patient/courses">
            <Button className="bg-turquoise hover:bg-turquoise/90 text-black">
              {t.backToCourses}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentModule = getCurrentModule();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101010' }}>
      <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
        <div className="max-w-4xl mx-auto px-3 lg:px-6">
          <div className="space-y-6 pt-4 lg:pt-6">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Link href={`/patient/courses/${courseId}`}>
                <Button size="sm" className="bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white border border-gray-700/50 hover:border-gray-600/50 p-2 transition-all duration-200">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Button>
              </Link>
              <span className="text-gray-400 text-sm">{t.backToCourse}</span>
            </div>

            {/* Lesson Header */}
            <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
              <div className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  
                  {/* Lesson Info */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      {currentModule && (
                        <div className="text-sm text-turquoise font-medium">
                          {t.module}: {currentModule.name}
                        </div>
                      )}
                      <h1 className="text-2xl lg:text-3xl font-light text-white">
                        {currentLesson.title}
                      </h1>
                      {isCompleted && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm font-medium">
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          {t.completed}
                        </Badge>
                      )}
                    </div>

                    {currentLesson.description && (
                      <p className="text-gray-300 leading-relaxed">
                        {currentLesson.description}
                      </p>
                    )}

                    {/* Lesson Stats */}
                    {currentLesson.duration && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ClockIcon className="h-4 w-4" />
                        <span>{formatDuration(currentLesson.duration)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <Button
                        onClick={markAsIncomplete}
                        disabled={isMarkingComplete}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white font-semibold px-6 py-3 rounded-xl"
                      >
                        {isMarkingComplete ? '...' : t.markAsIncomplete}
                      </Button>
                    ) : (
                      <Button
                        onClick={markAsCompleted}
                        disabled={isMarkingComplete}
                        className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                      >
                        {isMarkingComplete ? '...' : t.markAsCompleted}
                      </Button>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="space-y-6">
              
              {/* Video Content */}
              {currentLesson.videoUrl && (
                <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm overflow-hidden">
                  <div className="aspect-video">
                    <iframe
                      src={processYouTubeUrl(currentLesson.videoUrl)}
                      title={currentLesson.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>
              )}

              {/* Text Content */}
              {currentLesson.content && (
                <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl backdrop-blur-sm">
                  <div className="p-6 lg:p-8">
                    <div 
                      className="prose prose-invert prose-gray max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6">
              
              {/* Previous Lesson */}
              <div className="flex-1">
                {navigation.previous ? (
                  <Link href={`/patient/courses/${courseId}/lessons/${navigation.previous.id}`}>
                    <Button 
                      className="w-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 text-gray-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 justify-start"
                    >
                      <ChevronLeftIcon className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="text-xs text-gray-400 hover:text-gray-300">{t.previousLesson}</div>
                        <div className="truncate">{navigation.previous.title}</div>
                      </div>
                    </Button>
                  </Link>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Next Lesson */}
              <div className="flex-1">
                {navigation.next ? (
                  <Link href={`/patient/courses/${courseId}/lessons/${navigation.next.id}`}>
                    <Button 
                      className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 justify-end"
                    >
                      <div className="text-right">
                        <div className="text-xs text-black/70">{t.nextLesson}</div>
                        <div className="truncate">{navigation.next.title}</div>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <div></div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 