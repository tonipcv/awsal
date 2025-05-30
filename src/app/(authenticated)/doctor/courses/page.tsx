'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  PlusIcon,
  BookOpenIcon,
  PlayIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
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
    assignments: number;
  };
}

export default function DoctorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
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
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="text-xs text-slate-600">Carregando cursos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4 lg:p-6 pt-[88px] lg:pt-6 lg:pl-72 lg:pl-72">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-light text-slate-800">
              Cursos
            </h1>
            <p className="text-sm text-slate-600">
              Gerencie seus cursos e conteúdos educacionais
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>{courses.length} {courses.length === 1 ? 'curso' : 'cursos'}</span>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/doctor/courses/create">
                <PlusIcon className="h-4 w-4 mr-2" />
                Novo Curso
              </Link>
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <Card className="bg-white/80 border-slate-200/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">
                <BookOpenIcon className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-slate-800">
                  Nenhum curso encontrado
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Comece criando seu primeiro curso educacional.
                </p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/doctor/courses/create">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Criar Primeiro Curso
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const totalLessons = getTotalLessons(course);
              const totalDuration = getTotalDuration(course);

              return (
                <Card key={course.id} className="bg-white/80 border-slate-200/50 backdrop-blur-sm hover:bg-slate-50/80 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-medium text-slate-800 truncate mb-1">
                          {course.name}
                        </CardTitle>
                        {course.description && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-1 text-slate-500">
                        <BookOpenIcon className="h-3 w-3" />
                        <span>{course._count.modules} módulos</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <PlayIcon className="h-3 w-3" />
                        <span>{totalLessons} aulas</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <UsersIcon className="h-3 w-3" />
                        <span>{course._count.assignments} alunos</span>
                      </div>
                    </div>

                    {totalDuration > 0 && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <ClockIcon className="h-3 w-3" />
                        <span>Duração: {formatDuration(totalDuration)}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Link href={`/doctor/courses/${course.id}`}>
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Ver
                        </Link>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Link href={`/doctor/courses/${course.id}/edit`}>
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Editar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 