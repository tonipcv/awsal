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
import Image from 'next/image';

interface Course {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
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
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded-lg w-32 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="h-5 bg-gray-100 rounded-lg w-20 animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-32 animate-pulse"></div>
              </div>
            </div>

            {/* Courses Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-white border-gray-200 shadow-lg rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse"></div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse"></div>
                      <div className="h-4 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-lg w-1/2 animate-pulse"></div>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <div className="h-10 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:ml-64">
        <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
        
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
                Courses
              </h1>
              <p className="text-gray-600 font-medium">
                Manage your courses and educational content
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-gray-600 font-medium">
                <span>{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>
              </div>
              <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 shadow-md font-semibold">
                <Link href="/doctor/courses/create">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Course
                </Link>
              </Button>
            </div>
          </div>

          {/* Courses Grid */}
          {courses.length === 0 ? (
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    No courses found
                  </h3>
                  <p className="text-gray-600 font-medium mb-8">
                    Start by creating your first educational course.
                  </p>
                  <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 shadow-md font-semibold">
                    <Link href="/doctor/courses/create">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create First Course
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const totalLessons = getTotalLessons(course);
                const totalDuration = getTotalDuration(course);

                return (
                  <Card key={course.id} className="bg-white border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200">
                    {/* Cover Image */}
                    {course.coverImage && (
                      <div className="relative w-full h-48 rounded-t-2xl overflow-hidden">
                        <Image
                          src={course.coverImage}
                          alt={course.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-gray-900 truncate mb-2">
                            {course.name}
                          </CardTitle>
                          {course.description && (
                            <p className="text-gray-600 font-medium line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <BookOpenIcon className="h-4 w-4 text-teal-500" />
                          <span className="text-sm">{course._count.modules}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <PlayIcon className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">{totalLessons}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <UsersIcon className="h-4 w-4 text-orange-500" />
                          <span className="text-sm">{course._count.assignments}</span>
                        </div>
                      </div>

                      {totalDuration > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <ClockIcon className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm">Duration: {formatDuration(totalDuration)}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 shadow-md font-semibold"
                        >
                          <Link href={`/doctor/courses/${course.id}`}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 shadow-md font-semibold"
                        >
                          <Link href={`/doctor/courses/${course.id}/edit`}>
                            <PencilIcon className="h-4 w-4 mr-2" />
                            Edit
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
    </div>
  );
} 