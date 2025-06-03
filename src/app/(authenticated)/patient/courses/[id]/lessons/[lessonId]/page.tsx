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
          alert('Aula não encontrada');
          router.push(`/courses/${courseId}`);
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
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
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
        alert(error.error || 'Erro ao marcar aula como concluída');
      }
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      alert('Erro ao marcar aula como concluída');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const getCurrentModule = (): Module | null => {
    if (!course || !currentLesson?.moduleId) return null;
    return course.modules.find(module => module.id === currentLesson.moduleId) || null;
  };

  const processYouTubeUrl = (url: string): string => {
    try {
      // Convert various YouTube URL formats to privacy-enhanced embed format
      let videoId = '';
      
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
      } else {
        return url; // Return original if not a recognized YouTube URL
      }
      
      // Use privacy-enhanced mode (youtube-nocookie.com) with restrictive parameters
      const params = [
        'modestbranding=1',    // Hide YouTube logo
        'rel=0',               // Don't show related videos
        'showinfo=0',          // Hide video info
        'controls=1',          // Show player controls
        'disablekb=1',         // Disable keyboard controls
        'fs=0',                // Disable fullscreen
        'iv_load_policy=3',    // Hide annotations
        'cc_load_policy=0',    // Hide captions by default
        'autohide=1',          // Auto-hide controls
        'color=white',         // White progress bar
        'theme=dark',          // Dark theme
        'playsinline=1',       // Play inline on mobile
        'origin=awlov',        // Set origin
        'enablejsapi=0'        // Disable JS API
      ].join('&');
      
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
    } catch (error) {
      console.error('Error processing YouTube URL:', error);
      return url;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-20 lg:pt-[88px] lg:pb-4 lg:ml-64">
          <div className="max-w-4xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
            
            {/* Header Skeleton */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-5 w-5 bg-gray-800/50 rounded animate-pulse"></div>
                <div className="h-6 w-px bg-gray-700/50"></div>
                <div className="h-5 bg-gray-800/50 rounded w-48 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="h-7 bg-gray-800/50 rounded w-80 animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded w-64 animate-pulse"></div>
              </div>
            </div>

            {/* Video Skeleton */}
            <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="aspect-video bg-gray-800/50 rounded-lg animate-pulse"></div>
            </div>

            {/* Content Skeleton */}
            <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <div className="h-5 bg-gray-800/50 rounded w-32 mb-3 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-700/50 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded w-5/6 animate-pulse"></div>
              </div>
            </div>

            {/* Action Button Skeleton */}
            <div className="flex justify-center mb-6">
              <div className="h-10 bg-gray-800/50 rounded w-48 animate-pulse"></div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-[88px] pb-20 lg:pt-[88px] lg:pb-4 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Aula não encontrada</h2>
            <Button asChild className="bg-turquoise hover:bg-turquoise/90 text-black font-semibold">
              <Link href={`/patient/courses/${courseId}`}>Voltar ao Curso</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentModule = getCurrentModule();

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[88px] pb-20 lg:pt-[88px] lg:pb-4 lg:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-4 lg:px-6 lg:py-6">
          
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-turquoise transition-colors -ml-2">
                <Link href={`/patient/courses/${courseId}`}>
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-700/50" />
              <div className="flex items-center gap-2 text-sm text-gray-400 min-w-0 flex-1">
              <span className="truncate">{course.name}</span>
              {currentModule && (
                <>
                  <span>•</span>
                  <span className="truncate">{currentModule.name}</span>
                </>
              )}
            </div>
              <div className="flex items-center gap-3">
              {currentLesson.duration && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <ClockIcon className="h-4 w-4" />
                  {formatDuration(currentLesson.duration)}
                  </div>
              )}
              {isCompleted && (
                  <Badge className="bg-turquoise/20 text-turquoise border-turquoise/30 text-sm">
                  Concluída
                </Badge>
              )}
            </div>
          </div>

            {/* Lesson Title and Description */}
            <div className="space-y-3">
              <h1 className="text-xl lg:text-2xl font-medium text-white leading-tight">
                  {currentLesson.title}
                </h1>
            {currentLesson.description && (
                <p className="text-gray-300 leading-relaxed">
                {currentLesson.description}
              </p>
            )}
              </div>
          </div>

          {/* Video Player */}
          {currentLesson.videoUrl && (
            <div className="mb-6">
              <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                <div className="aspect-video rounded-lg overflow-hidden bg-gray-900/50">
                  <iframe
                    src={processYouTubeUrl(currentLesson.videoUrl)}
                    className="w-full h-full"
                    allowFullScreen={false}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lesson Content */}
          {currentLesson.content && (
            <div className="mb-6">
              <div className="bg-white/[0.02] border border-gray-800/60 rounded-xl p-4 lg:p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    Conteúdo da Aula
                  </h3>
                  {/* Button only visible on desktop */}
                  <Button 
                    onClick={markAsCompleted}
                    disabled={isCompleted || isMarkingComplete}
                    size="sm"
                    className={cn(
                      "hidden lg:flex px-4 py-2 text-sm font-medium transition-all duration-200",
                      isCompleted 
                        ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30" 
                        : "bg-turquoise/90 hover:bg-turquoise text-black hover:scale-105"
                    )}
                  >
                    {isMarkingComplete ? 'Marcando...' : isCompleted ? 'Concluída ✓' : 'Marcar como Concluída'}
                  </Button>
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentLesson.content}
                </p>
                </div>
              </div>
            </div>
          )}

          {/* Button for mobile (always) and desktop (only when no content) */}
          <div className="flex justify-center mb-6 lg:hidden">
            <Button 
              onClick={markAsCompleted}
              disabled={isCompleted || isMarkingComplete}
              size="sm"
              className={cn(
                "px-4 py-2 text-sm font-medium transition-all duration-200",
                isCompleted 
                  ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30" 
                  : "bg-turquoise/90 hover:bg-turquoise text-black hover:scale-105"
              )}
            >
              {isMarkingComplete ? 'Marcando...' : isCompleted ? 'Concluída ✓' : 'Marcar como Concluída'}
            </Button>
          </div>

          {/* If no content, show button separately on desktop */}
          {!currentLesson.content && (
            <div className="hidden lg:flex justify-center mb-6">
              <Button 
                onClick={markAsCompleted}
                disabled={isCompleted || isMarkingComplete}
                size="sm"
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all duration-200",
                  isCompleted 
                    ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600/30" 
                    : "bg-turquoise/90 hover:bg-turquoise text-black hover:scale-105"
                )}
              >
                {isMarkingComplete ? 'Marcando...' : isCompleted ? 'Concluída ✓' : 'Marcar como Concluída'}
              </Button>
            </div>
          )}

        </div>
      </div>

      {/* Fixed Navigation at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800/60 lg:ml-64 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 lg:px-6">
          <div className="grid grid-cols-2 gap-3">
            {/* Previous Lesson */}
            <div>
              {navigation.previous ? (
                <Button 
                  variant="ghost" 
                  asChild 
                  className="w-full h-auto p-3 text-left bg-white/[0.02] border border-gray-800/60 rounded-lg hover:border-turquoise/30 hover:bg-white/[0.01] transition-all duration-200"
                >
                  <Link href={`/patient/courses/${courseId}/lessons/${navigation.previous.id}`}>
                    <div className="flex items-center gap-2">
                      <ChevronLeftIcon className="h-4 w-4 text-turquoise flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-turquoise font-medium">Anterior</div>
                        <div className="text-sm text-white font-medium truncate">{navigation.previous.title}</div>
                      </div>
                    </div>
                  </Link>
                </Button>
              ) : (
                <div></div>
              )}
            </div>
            
            {/* Next Lesson */}
            <div>
              {navigation.next ? (
                <Button 
                  variant="ghost" 
                  asChild 
                  className="w-full h-auto p-3 text-right bg-white/[0.02] border border-gray-800/60 rounded-lg hover:border-turquoise/30 hover:bg-white/[0.01] transition-all duration-200"
                >
                  <Link href={`/patient/courses/${courseId}/lessons/${navigation.next.id}`}>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="min-w-0">
                        <div className="text-xs text-turquoise font-medium">Próxima</div>
                        <div className="text-sm text-white font-medium truncate">{navigation.next.title}</div>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-turquoise flex-shrink-0" />
                    </div>
                  </Link>
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  asChild 
                  className="w-full h-auto p-3 text-right bg-turquoise/10 border border-turquoise/30 rounded-lg hover:bg-turquoise/20 transition-all duration-200"
                >
                  <Link href={`/patient/courses/${courseId}`}>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="min-w-0">
                        <div className="text-xs text-turquoise font-medium">Finalizar</div>
                        <div className="text-sm text-turquoise font-medium">Voltar ao Curso</div>
                      </div>
                      <CheckCircleIcon className="h-4 w-4 text-turquoise flex-shrink-0" />
                    </div>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 