'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from 'next/link';

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
  lessons: Array<{
    id: string;
    title: string;
    duration: number | null;
  }>;
  _count: {
    modules: number;
    lessons: number;
  };
}

interface CoursesData {
  active: Course[];
  unavailable: Course[];
}

export default function CoursesPage() {
  const [coursesData, setCoursesData] = useState<CoursesData>({ active: [], unavailable: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnavailableCourse, setSelectedUnavailableCourse] = useState<Course | null>(null);

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
    const moduleLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    return moduleLessons + course.lessons.length;
  };

  const getTotalDuration = (course: Course) => {
    const moduleDuration = course.modules.reduce((acc, module) => 
      acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 0), 0), 0
    );
    const directDuration = course.lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);
    return moduleDuration + directDuration;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const openUnavailableModal = (course: Course) => {
    setSelectedUnavailableCourse(course);
  };

  const closeUnavailableModal = () => {
    setSelectedUnavailableCourse(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <span className="text-xs text-zinc-300">Carregando cursos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-zinc-800/10 to-zinc-900/20" />
        <div className="relative pt-[88px] lg:pt-16 pb-12 lg:pb-16">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl lg:text-5xl font-light text-white mb-4 tracking-tight">
                Seus Cursos
              </h1>
              <p className="text-lg lg:text-xl text-zinc-300 mb-8 font-light leading-relaxed">
                Continue sua jornada de aprendizado
              </p>
              
              {/* Stats */}
              <div className="flex items-center justify-center gap-8 lg:gap-12">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-light text-white mb-1">
                    {coursesData.active.length}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {coursesData.active.length === 1 ? 'Curso Ativo' : 'Cursos Ativos'}
                  </div>
                </div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-light text-white mb-1">
                    {coursesData.active.length + coursesData.unavailable.length}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Total Disponível
                  </div>
                </div>
                <div className="w-px h-8 bg-zinc-700" />
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-light text-[#76e1d8] mb-1">
                    {coursesData.active.reduce((acc, course) => acc + getTotalLessons(course), 0)}
                  </div>
                  <div className="text-sm text-zinc-400">
                    Total de Aulas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-8 pb-24">
        {coursesData.active.length === 0 && coursesData.unavailable.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-light text-white mb-3">
                Nenhum curso disponível
              </h3>
              <p className="text-zinc-300 mb-6 leading-relaxed">
                Você ainda não possui cursos disponíveis. Entre em contato com seu médico para obter acesso aos cursos.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Courses */}
            {coursesData.active.length > 0 && (
              <section>
                <h2 className="text-xl lg:text-2xl font-light text-white mb-6">
                  Cursos Ativos
                </h2>
                
                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {coursesData.active.map(course => (
                    <div 
                      key={course.id} 
                      className="group bg-zinc-900/50 border border-zinc-800/50 rounded-lg hover:border-[#76e1d8]/30 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                    >
                      <div className="p-6 lg:p-8">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg lg:text-xl font-light text-white group-hover:text-[#76e1d8] transition-colors">
                                {course.name}
                              </h3>
                              <Badge className="bg-[#76e1d8]/20 text-[#76e1d8] border-[#76e1d8]/30 text-xs">
                                {course.status === 'active' ? 'Ativo' : 'Concluído'}
                              </Badge>
                            </div>
                            
                            {course.description && (
                              <p className="text-zinc-300 leading-relaxed line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>

                          {/* Course Stats */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-zinc-400">Aulas</div>
                              <div className="text-white">
                                {getTotalLessons(course)} {getTotalLessons(course) === 1 ? 'aula' : 'aulas'}
                              </div>
                            </div>
                            
                            {getTotalDuration(course) > 0 && (
                              <div>
                                <div className="text-zinc-400">Duração</div>
                                <div className="text-white">
                                  {formatDuration(getTotalDuration(course))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Modules Preview */}
                          {course.modules.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-zinc-300">Módulos</h4>
                              <div className="space-y-2">
                                {course.modules.slice(0, 3).map(module => (
                                  <div key={module.id} className="text-sm text-zinc-400 flex items-center gap-2">
                                    <div className="w-1 h-1 bg-[#76e1d8] rounded-full" />
                                    {module.name} ({module.lessons.length})
                                  </div>
                                ))}
                                {course.modules.length > 3 && (
                                  <div className="text-sm text-zinc-500">
                                    +{course.modules.length - 3} módulos adicionais
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-2">
                            <Button asChild className="w-full bg-[#76e1d8] hover:bg-[#5dd4c8] text-white">
                              <Link href={`/courses/${course.id}`}>
                                Ver Curso
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
                <h2 className="text-xl lg:text-2xl font-light text-white mb-6">
                  Cursos Indisponíveis
                </h2>
                
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                  {coursesData.unavailable.map(course => (
                    <div 
                      key={course.id} 
                      className="group bg-zinc-900/30 border border-zinc-800/30 rounded-lg hover:border-zinc-700/50 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                      onClick={() => openUnavailableModal(course)}
                    >
                      <div className="p-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-light text-white group-hover:text-zinc-300 transition-colors">
                                {course.name}
                              </h3>
                              <Badge className="bg-zinc-700/20 text-zinc-400 border-zinc-700/30 text-xs">
                                Indisponível
                              </Badge>
                            </div>
                            
                            {course.description && (
                              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                              <span>{getTotalLessons(course)} aulas</span>
                              {getTotalDuration(course) > 0 && (
                                <span>{formatDuration(getTotalDuration(course))}</span>
                              )}
                            </div>

                            <Button 
                              variant="outline"
                              size="sm"
                              className="border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/10 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                              Ver detalhes
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

      {/* Unavailable Course Modal */}
      {selectedUnavailableCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-zinc-900/95 border border-zinc-700/30 rounded-lg backdrop-blur-sm">
            <div className="p-6">
              <h3 className="text-lg font-light text-white mb-4">
                {selectedUnavailableCourse.modalTitle || 'Curso Indisponível'}
              </h3>
              
              {selectedUnavailableCourse.modalVideoUrl && (
                <div className="aspect-video rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={selectedUnavailableCourse.modalVideoUrl}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
              
              <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
                {selectedUnavailableCourse.modalDescription || 
                 'Este curso ainda não está disponível para você. Entre em contato com seu médico para mais informações.'}
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={closeUnavailableModal}
                  className="flex-1 border-zinc-700/30 text-zinc-300 hover:bg-zinc-800/30"
                >
                  Fechar
                </Button>
                {selectedUnavailableCourse.modalButtonUrl && (
                  <Button asChild className="flex-1 bg-[#76e1d8] hover:bg-[#5dd4c8] text-white">
                    <Link href={selectedUnavailableCourse.modalButtonUrl} target="_blank" rel="noopener noreferrer">
                      {selectedUnavailableCourse.modalButtonText || 'Saber mais'}
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