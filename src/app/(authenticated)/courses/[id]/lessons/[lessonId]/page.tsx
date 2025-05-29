'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-300">Carregando aula...</span>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-300">Aula não encontrada</span>
      </div>
    );
  }

  const currentModule = getCurrentModule();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/80 z-10 border-b border-zinc-600/30">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-[88px] lg:pt-6 pb-3 lg:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>{course.name}</span>
              {currentModule && (
                <>
                  <span>•</span>
                  <span>{currentModule.name}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentLesson.duration && (
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  {formatDuration(currentLesson.duration)}
                </span>
              )}
              {isCompleted && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  Concluída
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        <div className="space-y-8 lg:space-y-12">
          
          {/* Lesson Header */}
          <div className="pt-8 lg:pt-12">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-4xl font-light text-white leading-tight">
                  {currentLesson.title}
                </h1>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-zinc-300 hover:text-white flex-shrink-0">
                <Link href={`/courses/${courseId}`}>
                  <ArrowLeftIcon className="h-4 w-4 mr-1 lg:mr-2" />
                  <span className="hidden sm:inline">Voltar</span>
                </Link>
              </Button>
            </div>
            <div className="space-y-4">
              {currentLesson.description && (
                <p className="text-lg lg:text-xl text-zinc-300 leading-relaxed max-w-4xl">
                  {currentLesson.description}
                </p>
              )}
              {currentLesson.duration && (
                <div className="text-sm text-zinc-400">
                  Duração: {formatDuration(currentLesson.duration)}
                </div>
              )}
            </div>
          </div>

          {/* Video Player */}
          {currentLesson.videoUrl && (
            <div className="flex justify-center">
              <div className="w-full max-w-4xl bg-white/[0.08] border border-zinc-600/30 rounded-lg overflow-hidden backdrop-blur-sm relative">
                <div className="aspect-video relative">
                  <iframe
                    src={processYouTubeUrl(currentLesson.videoUrl)}
                    className="w-full h-full"
                    allowFullScreen={false}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    referrerPolicy="no-referrer"
                  />
                  {/* Overlay to prevent right-click and other interactions */}
                  <div 
                    className="absolute inset-0 bg-transparent"
                    onContextMenu={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ 
                      zIndex: 1,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Lesson Content */}
          {currentLesson.content && (
            <div className="bg-white/[0.08] border border-zinc-600/30 rounded-lg p-6 lg:p-8 backdrop-blur-sm">
              <h3 className="text-xl font-light text-white mb-6">Conteúdo da Aula</h3>
              <div className="prose prose-lg prose-invert max-w-none">
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-base lg:text-lg">
                  {currentLesson.content}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={markAsCompleted}
              disabled={isCompleted || isMarkingComplete}
              className="bg-[#76e1d8] hover:bg-[#8ae8df] text-white disabled:opacity-50 px-8 py-3 text-base"
            >
              {isMarkingComplete ? 'Marcando...' : isCompleted ? 'Aula Concluída' : 'Marcar como Concluída'}
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-3 pt-8 border-t border-zinc-600/30">
            <div className="flex-1">
              {navigation.previous ? (
                <Button variant="ghost" asChild className="w-full text-zinc-300 hover:text-white hover:bg-zinc-700/30 p-3 h-auto justify-start">
                  <Link href={`/courses/${courseId}/lessons/${navigation.previous.id}`}>
                    <ChevronLeftIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <div className="text-xs text-zinc-400 hidden sm:block">Anterior</div>
                      <div className="text-sm font-light truncate">{navigation.previous.title}</div>
                    </div>
                  </Link>
                </Button>
              ) : (
                <div></div>
              )}
            </div>
            
            <div className="flex-1">
              {navigation.next ? (
                <Button variant="ghost" asChild className="w-full text-zinc-300 hover:text-white hover:bg-zinc-700/30 p-3 h-auto justify-end">
                  <Link href={`/courses/${courseId}/lessons/${navigation.next.id}`}>
                    <div className="text-right min-w-0">
                      <div className="text-xs text-zinc-400 hidden sm:block">Próxima</div>
                      <div className="text-sm font-light truncate">{navigation.next.title}</div>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" asChild className="w-full text-[#76e1d8] hover:text-[#8ae8df] hover:bg-[#76e1d8]/10 p-3 h-auto justify-end">
                  <Link href={`/courses/${courseId}`}>
                    <div className="text-right">
                      <div className="text-xs text-[#76e1d8] hidden sm:block">Finalizar</div>
                      <div className="text-sm font-light">Voltar ao Curso</div>
                    </div>
                    <CheckCircleIcon className="h-4 w-4 ml-2 flex-shrink-0" />
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