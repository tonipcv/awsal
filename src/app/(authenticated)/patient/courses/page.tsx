'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { 
  PlayIcon, 
  ClockIcon, 
  BookOpenIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Translations for internationalization
const translations = {
  pt: {
    yourCourses: 'Seus Cursos',
    continueJourney: 'Continue sua jornada de aprendizado',
    activeCourse: 'Curso Ativo',
    activeCourses: 'Cursos Ativos',
    totalAvailable: 'Total Disponível',
    totalLessons: 'Total de Aulas',
    noCoursesAvailable: 'Nenhum curso disponível',
    contactDoctorCourses: 'Você ainda não possui cursos disponíveis. Entre em contato com seu médico para obter acesso aos cursos.',
    activeCoursesSection: 'Cursos Ativos',
    unavailableCoursesSection: 'Cursos Indisponíveis',
    active: 'Ativo',
    completed: 'Concluído',
    unavailable: 'Indisponível',
    lessons: 'Aulas',
    duration: 'Duração',
    modules: 'Módulos',
    additionalModules: (count: number) => `+${count} módulos adicionais`,
    viewCourse: 'Ver Curso',
    seeDetails: 'Ver detalhes',
    courseUnavailable: 'Curso Indisponível',
    courseUnavailableDescription: 'Este curso ainda não está disponível para você. Entre em contato com seu médico para mais informações.',
    close: 'Fechar',
    learnMore: 'Saber mais',
    lessonsCount: (count: number) => `${count} aulas`,
    hours: 'h',
    minutes: 'min'
  },
  en: {
    yourCourses: 'Your Courses',
    continueJourney: 'Continue your learning journey',
    activeCourse: 'Active Course',
    activeCourses: 'Active Courses',
    totalAvailable: 'Total Available',
    totalLessons: 'Total Lessons',
    noCoursesAvailable: 'No courses available',
    contactDoctorCourses: 'You don\'t have any courses available yet. Contact your doctor to get access to courses.',
    activeCoursesSection: 'Active Courses',
    unavailableCoursesSection: 'Unavailable Courses',
    active: 'Active',
    completed: 'Completed',
    unavailable: 'Unavailable',
    lessons: 'Lessons',
    duration: 'Duration',
    modules: 'Modules',
    additionalModules: (count: number) => `+${count} additional modules`,
    viewCourse: 'View Course',
    seeDetails: 'See details',
    courseUnavailable: 'Course Unavailable',
    courseUnavailableDescription: 'This course is not yet available to you. Contact your doctor for more information.',
    close: 'Close',
    learnMore: 'Learn more',
    lessonsCount: (count: number) => `${count} lessons`,
    hours: 'h',
    minutes: 'min'
  }
};

interface Course {
  id: string;
  name: string;
  description: string | null;
  status: string;
  modalTitle: string | null;
  modalVideoUrl: string | null;
  modalDescription: string | null;
  modalButtonText: string | null;
  modalButtonUrl: string | null;
  modules: Array<{
    id: string;
    name: string;
    lessons: Array<{
      id: string;
      title: string;
      duration: number | null;
    }>;
  }>;
  _count: {
    modules: number;
  };
}

interface CoursesData {
  active: Course[];
  unavailable: Course[];
}

export default function CoursesPage() {
  const [coursesData, setCoursesData] = useState<CoursesData>({ active: [], unavailable: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'pt' | 'en'>('pt');
  const [selectedUnavailableCourse, setSelectedUnavailableCourse] = useState<Course | null>(null);

  // Detect browser language
  useEffect(() => {
    const browserLanguage = navigator.language || navigator.languages?.[0] || 'pt';
    const detectedLang = browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt';
    setLanguage(detectedLang);
  }, []);

  const t = translations[language];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/courses/available');
      if (response.ok) {
        const data = await response.json();
        setCoursesData(data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalLessons = (course: Course) => {
    return course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
  };

  const getTotalDuration = (course: Course) => {
    return course.modules.reduce((acc, module) => 
      acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}${t.hours} ${mins}${t.minutes}`;
    }
    return `${mins}${t.minutes}`;
  };

  const openUnavailableModal = (course: Course) => {
    setSelectedUnavailableCourse(course);
  };

  const closeUnavailableModal = () => {
    setSelectedUnavailableCourse(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Padding para menu lateral no desktop e header no mobile */}
        <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
          <div className="max-w-6xl mx-auto px-3 py-2 lg:px-6 lg:py-4">
            
            {/* Hero Skeleton */}
            <div className="mb-6 lg:mb-8">
              <div className="text-center max-w-3xl mx-auto">
                <div className="h-8 lg:h-12 bg-gray-800/50 rounded-lg w-48 mx-auto mb-3 lg:mb-4 animate-pulse"></div>
                <div className="h-4 lg:h-6 bg-gray-700/50 rounded w-64 mx-auto mb-6 lg:mb-8 animate-pulse"></div>
                
                {/* Stats Skeleton */}
                <div className="flex items-center justify-center gap-6 lg:gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center">
                      <div className="h-6 lg:h-8 bg-gray-800/50 rounded w-8 mx-auto mb-1 animate-pulse"></div>
                      <div className="h-3 lg:h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Courses Grid Skeleton */}
            <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-3 lg:p-4">
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 lg:gap-3">
                      <div className="h-5 lg:h-6 bg-gray-800/50 rounded w-32 animate-pulse"></div>
                      <div className="h-4 bg-gray-700/50 rounded w-12 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-700/50 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-3/4 animate-pulse"></div>
                    
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <div>
                        <div className="h-3 bg-gray-800/50 rounded w-8 mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-12 animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-3 bg-gray-800/50 rounded w-12 mb-1 animate-pulse"></div>
                        <div className="h-4 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="h-8 lg:h-9 bg-gray-800/50 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Padding para menu lateral no desktop e header no mobile */}
      <div className="pt-[88px] pb-24 lg:pt-6 lg:pb-4 lg:ml-64">
        
        {/* Hero Section Compacto */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-800/10 to-gray-900/20" />
          <div className="relative py-6 lg:py-8">
            <div className="max-w-6xl mx-auto px-3 lg:px-6">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-2xl lg:text-4xl font-light text-white mb-2 lg:mb-3 tracking-tight">
                  {t.yourCourses}
                </h1>
                <p className="text-sm lg:text-lg text-gray-300 mb-4 lg:mb-6 font-light leading-relaxed">
                  {t.continueJourney}
                </p>
                
                {/* Stats Compactas */}
                <div className="flex items-center justify-center gap-4 lg:gap-8">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-white mb-0.5">
                      {coursesData.active.length}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {coursesData.active.length === 1 ? t.activeCourse : t.activeCourses}
                    </div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-700" />
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-white mb-0.5">
                      {coursesData.active.length + coursesData.unavailable.length}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {t.totalAvailable}
                    </div>
                  </div>
                  <div className="w-px h-6 lg:h-8 bg-gray-700" />
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-light text-turquoise mb-0.5">
                      {coursesData.active.reduce((acc, course) => acc + getTotalLessons(course), 0)}
                    </div>
                    <div className="text-xs lg:text-sm text-gray-400">
                      {t.totalLessons}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-3 lg:px-6">
          {coursesData.active.length === 0 && coursesData.unavailable.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 lg:py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpenIcon className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                </div>
                <h3 className="text-lg lg:text-xl font-light text-white mb-2 lg:mb-3">
                  {t.noCoursesAvailable}
                </h3>
                <p className="text-sm lg:text-base text-gray-300 leading-relaxed">
                  {t.contactDoctorCourses}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-8">
              {/* Active Courses */}
              {coursesData.active.length > 0 && (
                <section>
                  <h2 className="text-lg lg:text-xl font-light text-white mb-3 lg:mb-4 flex items-center gap-2">
                    <AcademicCapIcon className="h-4 w-4 lg:h-5 lg:w-5 text-turquoise" />
                    {t.activeCoursesSection}
                  </h2>
                  
                  <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {coursesData.active.map(course => (
                      <div 
                        key={course.id} 
                        className="group bg-gray-900/40 border border-gray-800/40 rounded-xl hover:border-turquoise/30 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                      >
                        <div className="p-3 lg:p-4">
                          <div className="space-y-3 lg:space-y-4">
                            <div>
                              <div className="flex items-center gap-2 lg:gap-3 mb-2">
                                <h3 className="text-sm lg:text-base font-medium text-white group-hover:text-turquoise transition-colors line-clamp-1">
                                  {course.name}
                                </h3>
                                <Badge className="bg-turquoise/15 text-turquoise border-turquoise/25 text-xs px-1.5 py-0.5 lg:px-2 lg:py-1">
                                  {course.status === 'active' ? t.active : t.completed}
                                </Badge>
                              </div>
                              
                              {course.description && (
                                <p className="text-xs lg:text-sm text-gray-300 leading-relaxed line-clamp-2">
                                  {course.description}
                                </p>
                              )}
                            </div>

                            {/* Course Stats Compactas */}
                            <div className="grid grid-cols-2 gap-3 lg:gap-4 text-xs lg:text-sm">
                              <div className="flex items-center gap-1.5 lg:gap-2">
                                <PlayIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                                <div>
                                  <div className="text-gray-400">{t.lessons}</div>
                                  <div className="text-white font-medium">
                                    {getTotalLessons(course)}
                                  </div>
                                </div>
                              </div>
                              
                              {getTotalDuration(course) > 0 && (
                                <div className="flex items-center gap-1.5 lg:gap-2">
                                  <ClockIcon className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                                  <div>
                                    <div className="text-gray-400">{t.duration}</div>
                                    <div className="text-white font-medium">
                                      {formatDuration(getTotalDuration(course))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Modules Preview Compacto */}
                            {course.modules.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs lg:text-sm font-medium text-gray-300 flex items-center gap-1.5">
                                  <BookOpenIcon className="h-3 w-3 lg:h-4 lg:w-4 text-turquoise" />
                                  {t.modules}
                                </h4>
                                <div className="space-y-1">
                                  {course.modules.slice(0, 2).map(module => (
                                    <div key={module.id} className="text-xs lg:text-sm text-gray-400 flex items-center gap-2">
                                      <div className="w-1 h-1 bg-turquoise rounded-full flex-shrink-0" />
                                      <span className="line-clamp-1">{module.name}</span>
                                      <span className="text-gray-500">({module.lessons.length})</span>
                                    </div>
                                  ))}
                                  {course.modules.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                      {t.additionalModules(course.modules.length - 2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Button Compacto */}
                            <div className="pt-1">
                              <Button asChild className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9 shadow-md shadow-turquoise/25 hover:shadow-turquoise/40 transition-all duration-200">
                                <Link href={`/patient/courses/${course.id}`}>
                                  <PlayIcon className="h-3 w-3 lg:h-4 lg:w-4 mr-1.5 lg:mr-2" />
                                  {t.viewCourse}
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Unavailable Courses */}
              {coursesData.unavailable.length > 0 && (
                <section>
                  <h2 className="text-lg lg:text-xl font-light text-white mb-3 lg:mb-4 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                    {t.unavailableCoursesSection}
                  </h2>
                  
                  <div className="grid gap-3 lg:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {coursesData.unavailable.map(course => (
                      <div 
                        key={course.id} 
                        className="group bg-gray-900/20 border border-gray-800/30 rounded-xl hover:border-gray-700/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                        onClick={() => openUnavailableModal(course)}
                      >
                        <div className="p-3 lg:p-4">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2 lg:gap-3 mb-2">
                                <h3 className="text-sm lg:text-base font-medium text-white group-hover:text-gray-300 transition-colors line-clamp-1">
                                  {course.name}
                                </h3>
                                <Badge className="bg-gray-700/20 text-gray-400 border-gray-700/30 text-xs px-1.5 py-0.5 lg:px-2 lg:py-1">
                                  {t.unavailable}
                                </Badge>
                              </div>
                              
                              {course.description && (
                                <p className="text-xs lg:text-sm text-gray-400 leading-relaxed line-clamp-2">
                                  {course.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 lg:gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <PlayIcon className="h-3 w-3 text-gray-500" />
                                  <span>{t.lessonsCount(getTotalLessons(course))}</span>
                                </div>
                                {getTotalDuration(course) > 0 && (
                                  <div className="flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3 text-gray-500" />
                                    <span>{formatDuration(getTotalDuration(course))}</span>
                                  </div>
                                )}
                              </div>

                              <Button 
                                variant="outline"
                                size="sm"
                                className="border-gray-700/30 text-gray-400 hover:bg-gray-800/10 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 lg:h-7 px-2 lg:px-3"
                              >
                                {t.seeDetails}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Unavailable Course Modal */}
      {selectedUnavailableCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 lg:p-4 z-50">
          <div className="w-full max-w-md bg-gray-900/95 border border-gray-700/30 rounded-xl backdrop-blur-sm">
            <div className="p-4 lg:p-6">
              <h3 className="text-base lg:text-lg font-medium text-white mb-3 lg:mb-4">
                {selectedUnavailableCourse.modalTitle || t.courseUnavailable}
              </h3>
              
              {selectedUnavailableCourse.modalVideoUrl && (
                <div className="aspect-video rounded-lg overflow-hidden mb-3 lg:mb-4">
                  <iframe
                    src={selectedUnavailableCourse.modalVideoUrl}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              
              <p className="text-xs lg:text-sm text-gray-300 mb-4 lg:mb-6 leading-relaxed">
                {selectedUnavailableCourse.modalDescription || t.courseUnavailableDescription}
              </p>
              
              <div className="flex gap-2 lg:gap-3">
                <Button 
                  variant="outline" 
                  onClick={closeUnavailableModal}
                  className="flex-1 border-gray-700/30 text-gray-300 hover:bg-gray-800/30 text-xs lg:text-sm h-8 lg:h-9"
                >
                  {t.close}
                </Button>
                {selectedUnavailableCourse.modalButtonUrl && (
                  <Button asChild className="flex-1 bg-turquoise hover:bg-turquoise/90 text-black font-medium text-xs lg:text-sm h-8 lg:h-9">
                    <Link href={selectedUnavailableCourse.modalButtonUrl} target="_blank" rel="noopener noreferrer">
                      {selectedUnavailableCourse.modalButtonText || t.learnMore}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 