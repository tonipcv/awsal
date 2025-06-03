'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

interface Course {
  id: string;
  name: string;
  description: string | null;
  modalTitle: string | null;
  modalDescription: string | null;
  modalVideoUrl: string | null;
  modalButtonText: string | null;
  modalButtonUrl: string | null;
  createdAt: string;
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  modules: Array<{
    id: string;
    name: string;
    description: string | null;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      videoUrl: string | null;
      duration: number | null;
      order: number;
    }>;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    videoUrl: string | null;
    duration: number | null;
    order: number;
  }>;
  assignments: Array<{
    id: string;
    status: string;
    startDate: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function CourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      } else {
        alert('Error loading course');
        router.push('/doctor/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Error loading course');
      router.push('/doctor/courses');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async () => {
    if (!course) return;
    
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/doctor/courses');
      } else {
        const error = await response.json();
        alert(error.error || 'Error deleting course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="w-48 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Course Info Skeleton */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="w-80 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="w-96 h-5 bg-gray-100 rounded animate-pulse"></div>
                  <div className="w-32 h-4 bg-gray-100 rounded animate-pulse"></div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                      <div className="w-8 h-6 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                      <div className="w-12 h-4 bg-gray-100 rounded animate-pulse mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections Skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <div className="w-40 h-6 bg-gray-200 rounded-lg animate-pulse border-b border-gray-200 pb-2"></div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="space-y-3">
                      <div className="w-64 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-80 h-4 bg-gray-100 rounded animate-pulse"></div>
                      <div className="space-y-2">
                        {[1, 2].map((j) => (
                          <div key={j} className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                            <div className="flex-1 space-y-2">
                              <div className="w-48 h-4 bg-gray-200 rounded animate-pulse"></div>
                              <div className="w-32 h-3 bg-gray-100 rounded animate-pulse"></div>
                            </div>
                            <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Loading Indicator */}
            <div className="fixed bottom-8 right-8 bg-white border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#5154e7] border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Loading course...</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Course not found
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  The requested course was not found or does not exist.
                </p>
                <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl">
                  <Link href="/doctor/courses">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back to Courses
                  </Link>
                </Button>
              </div>
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
          <div className="flex items-center gap-6 mb-8">
            <Button variant="ghost" size="sm" asChild className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/courses">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <BookOpenIcon className="h-6 w-6 text-[#5154e7]" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
              {course.name}
              </h1>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl">
              <Link href={`/doctor/courses/${courseId}/edit`}>
                  Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={deleteCourse}
                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
                Delete
            </Button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Course Info */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6 space-y-6">
              <div>
                {course.description && (
                    <p className="text-gray-700 text-lg mb-4">{course.description}</p>
                )}
                  <p className="text-sm text-gray-500 font-medium">
                    Created on {formatDate(course.createdAt)}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gray-50 border-gray-200 rounded-2xl">
                  <CardContent className="p-4 text-center">
                      <BookOpenIcon className="h-6 w-6 text-[#5154e7] mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{course.modules.length}</div>
                      <div className="text-sm text-gray-600 font-medium">Modules</div>
                  </CardContent>
                </Card>
                
                  <Card className="bg-gray-50 border-gray-200 rounded-2xl">
                  <CardContent className="p-4 text-center">
                      <PlayIcon className="h-6 w-6 text-[#5154e7] mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{getTotalLessons()}</div>
                      <div className="text-sm text-gray-600 font-medium">Lessons</div>
                  </CardContent>
                </Card>
                
                  <Card className="bg-gray-50 border-gray-200 rounded-2xl">
                  <CardContent className="p-4 text-center">
                      <ClockIcon className="h-6 w-6 text-[#5154e7] mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{formatDuration(getTotalDuration())}</div>
                      <div className="text-sm text-gray-600 font-medium">Duration</div>
                  </CardContent>
                </Card>
                
                  <Card className="bg-gray-50 border-gray-200 rounded-2xl">
                  <CardContent className="p-4 text-center">
                      <UsersIcon className="h-6 w-6 text-[#5154e7] mx-auto mb-2" />
                      <div className="text-lg font-bold text-gray-900">{course.assignments.length}</div>
                      <div className="text-sm text-gray-600 font-medium">Students</div>
                  </CardContent>
                </Card>
              </div>
              </CardContent>
            </Card>

            {/* Modal Configuration */}
            {(course.modalTitle || course.modalDescription || course.modalVideoUrl) && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Modal Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {course.modalTitle && (
                      <div>
                      <span className="text-sm font-semibold text-gray-900">Title:</span>
                      <p className="text-gray-700 mt-1">{course.modalTitle}</p>
                      </div>
                    )}
                    {course.modalDescription && (
                      <div>
                      <span className="text-sm font-semibold text-gray-900">Description:</span>
                      <p className="text-gray-700 mt-1">{course.modalDescription}</p>
                      </div>
                    )}
                    {course.modalVideoUrl && (
                      <div>
                      <span className="text-sm font-semibold text-gray-900">Video:</span>
                      <p className="text-gray-600 break-all mt-1 font-mono text-sm">{course.modalVideoUrl}</p>
                      </div>
                    )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">Button:</span>
                    <span className="text-gray-700">{course.modalButtonText || 'Learn more'}</span>
                      {course.modalButtonUrl && (
                      <span className="text-gray-600 break-all font-mono">{course.modalButtonUrl}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Modules */}
            {course.modules.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Modules ({course.modules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.modules.map((module, index) => (
                    <Card key={module.id} className="bg-gray-50 border-gray-200 rounded-2xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900">
                          {index + 1}. {module.name}
                        </CardTitle>
                        {module.description && (
                          <p className="text-sm text-gray-600 font-medium">{module.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{lessonIndex + 1}. {lesson.title}</span>
                              {lesson.description && (
                                <p className="text-xs text-gray-600 mt-1">{lesson.description}</p>
                              )}
                            </div>
                            {lesson.duration && (
                              <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-white">
                                {lesson.duration}min
                              </Badge>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Direct Lessons */}
            {course.lessons.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Direct Lessons ({course.lessons.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{index + 1}. {lesson.title}</span>
                        {lesson.description && (
                          <p className="text-xs text-gray-600 mt-1">{lesson.description}</p>
                        )}
                      </div>
                      {lesson.duration && (
                        <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-white">
                          {lesson.duration}min
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Assigned Students */}
            {course.assignments.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold text-gray-900">
                    Assigned Students ({course.assignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{assignment.user.name}</span>
                        <p className="text-xs text-gray-600">{assignment.user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium ${
                            assignment.status === 'active' ? 'text-green-700 border-green-300 bg-green-50' :
                            assignment.status === 'completed' ? 'text-blue-700 border-blue-300 bg-blue-50' :
                            assignment.status === 'paused' ? 'text-yellow-700 border-yellow-300 bg-yellow-50' :
                            assignment.status === 'unavailable' ? 'text-orange-700 border-orange-300 bg-orange-50' :
                            'text-gray-700 border-gray-300 bg-gray-50'
                          }`}
                        >
                          {assignment.status === 'active' ? 'Active' :
                           assignment.status === 'completed' ? 'Completed' :
                           assignment.status === 'paused' ? 'Paused' :
                           assignment.status === 'unavailable' ? 'Unavailable' :
                           'Inactive'}
                        </Badge>
                        <span className="text-xs text-gray-500 font-medium">
                          Since {formatDate(assignment.startDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {course.modules.length === 0 && course.lessons.length === 0 && (
              <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="text-center py-12">
                  <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Course without content
                </h3>
                  <p className="text-sm text-gray-600 mb-6 font-medium">
                    This course does not have modules or lessons yet.
                </p>
                  <Button asChild className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 font-semibold">
                  <Link href={`/doctor/courses/${courseId}/edit`}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                      Add Content
                  </Link>
                </Button>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  );
} 