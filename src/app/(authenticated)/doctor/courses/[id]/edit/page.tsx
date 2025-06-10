'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  PlusIcon,
  TrashIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  XMarkIcon,
  CheckIcon,
  PhotoIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';

interface Lesson {
  id?: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  duration: number;
}

interface Module {
  id?: string;
  name: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  modalTitle: string | null;
  modalVideoUrl: string | null;
  modalDescription: string | null;
  modalButtonText: string | null;
  modalButtonUrl: string | null;
  modules: Array<{
    id: string;
    name: string;
    description: string | null;
    lessons: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      videoUrl: string | null;
      duration: number | null;
    }>;
  }>;
  lessons: Array<{
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    videoUrl: string | null;
    duration: number | null;
  }>;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Course basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  
  // Modal configuration for unavailable courses
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalVideoUrl, setModalVideoUrl] = useState('');
  const [modalButtonText, setModalButtonText] = useState('Saber mais');
  const [modalButtonUrl, setModalButtonUrl] = useState('');
  
  // Course structure
  const [modules, setModules] = useState<Module[]>([]);
  const [directLessons, setDirectLessons] = useState<Lesson[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setIsLoadingCourse(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (response.ok) {
        const course: Course = await response.json();
        
        // Set basic info
        setName(course.name);
        setDescription(course.description || '');
        setCoverImage(course.coverImage || '');
        
        // Set modal config
        setModalTitle(course.modalTitle || '');
        setModalDescription(course.modalDescription || '');
        setModalVideoUrl(course.modalVideoUrl || '');
        setModalButtonText(course.modalButtonText || 'Saber mais');
        setModalButtonUrl(course.modalButtonUrl || '');
        
        // Set modules and lessons
        setModules(course.modules.map(module => ({
          id: module.id,
          name: module.name,
          description: module.description || '',
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            description: lesson.description || '',
            content: lesson.content || '',
            videoUrl: lesson.videoUrl || '',
            duration: lesson.duration || 0
          }))
        })));
        
        setDirectLessons(course.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description || '',
          content: lesson.content || '',
          videoUrl: lesson.videoUrl || '',
          duration: lesson.duration || 0
        })));
      } else {
        alert('Error loading course');
        router.push('/doctor/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert('Error loading course');
      router.push('/doctor/courses');
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const addModule = () => {
    setModules([...modules, {
      name: '',
      description: '',
      lessons: []
    }]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof Module, value: string) => {
    const updated = [...modules];
    if (field === 'lessons') return; // Lessons are handled separately
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const addLessonToModule = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons.push({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0
    });
    setModules(updated);
  };

  const removeLessonFromModule = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].lessons = updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updated);
  };

  const updateModuleLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: string | number) => {
    const updated = [...modules];
    if (field === 'duration') {
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      updated[moduleIndex].lessons[lessonIndex] = {
        ...updated[moduleIndex].lessons[lessonIndex],
        [field]: numValue > 0 ? numValue : 0
      };
    } else {
      updated[moduleIndex].lessons[lessonIndex] = {
        ...updated[moduleIndex].lessons[lessonIndex],
        [field]: value
      };
    }
    setModules(updated);
  };

  const addDirectLesson = () => {
    setDirectLessons([...directLessons, {
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      duration: 0
    }]);
  };

  const removeDirectLesson = (index: number) => {
    setDirectLessons(directLessons.filter((_, i) => i !== index));
  };

  const updateDirectLesson = (index: number, field: keyof Lesson, value: string | number) => {
    const updated = [...directLessons];
    if (field === 'duration') {
      const numValue = typeof value === 'string' ? parseInt(value) : value;
      updated[index] = { 
        ...updated[index], 
        [field]: numValue > 0 ? numValue : 0
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDirectLessons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Course name is required');
      return;
    }

    try {
      setIsLoading(true);
      
      const courseData = {
        name: name.trim(),
        description: description.trim() || null,
        coverImage: (coverImage || '').trim() || null,
        modalTitle: (modalTitle || '').trim() || null,
        modalDescription: (modalDescription || '').trim() || null,
        modalVideoUrl: (modalVideoUrl || '').trim() || null,
        modalButtonText: (modalButtonText || '').trim() || null,
        modalButtonUrl: (modalButtonUrl || '').trim() || null,
        modules: modules.map(module => ({
          id: module.id,
          name: (module.name || '').trim(),
          description: (module.description || '').trim() || null,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: (lesson.title || '').trim(),
            description: (lesson.description || '').trim() || null,
            content: (lesson.content || '').trim() || null,
            videoUrl: (lesson.videoUrl || '').trim() || null,
            duration: lesson.duration
          }))
        })),
        directLessons: directLessons.map(lesson => ({
          id: lesson.id,
          title: (lesson.title || '').trim(),
          description: (lesson.description || '').trim() || null,
          content: (lesson.content || '').trim() || null,
          videoUrl: (lesson.videoUrl || '').trim() || null,
          duration: lesson.duration
        }))
      };

      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      if (response.ok) {
        router.push('/doctor/courses');
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating course');
      }
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Error updating course');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async () => {
    try {
      setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setCoverImage(url);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setIsUploadingImage(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeCoverImage = () => {
    setCoverImage('');
  };

  if (isLoadingCourse) {
    return (
      <div className="min-h-screen bg-white">
        <div className="lg:ml-64">
          <div className="p-4 pt-[88px] lg:pl-6 lg:pr-4 lg:pt-6 lg:pb-4 pb-24">
            
            {/* Header Skeleton */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex-1">
                <div className="w-32 h-6 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
              </div>
            </div>

            {/* Form Skeleton */}
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Basic Information Skeleton */}
              <div className="space-y-6">
                <div className="w-48 h-6 bg-gray-200 rounded-lg animate-pulse border-b border-gray-200 pb-2"></div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Modules Skeleton */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-20 h-6 bg-gray-200 rounded-lg animate-pulse border-b border-gray-200 pb-2"></div>
                  <div className="w-36 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-20 h-5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                        <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-4">
                          <div className="space-y-3">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                              <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                            </div>
                            <div className="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                            <div className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
                Edit Course
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            
            {/* Basic Information */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-900 font-semibold">Course Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mindfulness Course"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    required
                  />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-900 font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the course..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl min-h-[100px]"
                  />
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-900 font-semibold">Cover Image</Label>
                  <div className="space-y-3">
                    {coverImage ? (
                      <div className="relative group">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
                          <Image
                            src={coverImage}
                            alt="Course cover"
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeCoverImage}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                            >
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#5154e7] transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="cover-image-upload"
                          disabled={isUploadingImage}
                        />
                        {isUploadingImage ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5154e7] border-t-transparent"></div>
                            <p className="text-sm text-gray-600 font-medium">Uploading...</p>
                          </div>
                        ) : (
                          <label
                            htmlFor="cover-image-upload"
                            className="cursor-pointer flex flex-col items-center gap-3"
                          >
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <PhotoIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Upload cover image</p>
                              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                            </div>
                            <div className="border border-[#5154e7] text-[#5154e7] hover:bg-[#5154e7] hover:text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
                              <CloudArrowUpIcon className="h-4 w-4" />
                              Choose File
                            </div>
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Modal Configuration */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-gray-900">Modal Configuration (Optional)</CardTitle>
                <p className="text-sm text-gray-600 font-medium">
                  Configure an informational modal that will be displayed when the course is unavailable to a patient.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modalTitle" className="text-gray-900 font-semibold">Modal Title</Label>
                    <Input
                      id="modalTitle"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      placeholder="e.g. Course Coming Soon"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modalVideoUrl" className="text-gray-900 font-semibold">Video URL</Label>
                    <Input
                      id="modalVideoUrl"
                      value={modalVideoUrl}
                      onChange={(e) => setModalVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modalDescription" className="text-gray-900 font-semibold">Modal Description</Label>
                  <Textarea
                    id="modalDescription"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="Message for the patient..."
                    className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="modalButtonText" className="text-gray-900 font-semibold">Button Text</Label>
                    <Input
                      id="modalButtonText"
                      value={modalButtonText}
                      onChange={(e) => setModalButtonText(e.target.value)}
                      placeholder="Saber mais"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="modalButtonUrl" className="text-gray-900 font-semibold">Button URL</Label>
                    <Input
                      id="modalButtonUrl"
                      value={modalButtonUrl}
                      onChange={(e) => setModalButtonUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">Modules</CardTitle>
                <Button
                  type="button"
                  onClick={addModule}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-4 py-2 font-semibold"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                    Add Module
                </Button>
              </div>
              </CardHeader>
              <CardContent className="space-y-6">
              {modules.map((module, moduleIndex) => (
                  <Card key={moduleIndex} className="bg-gray-50 border-gray-200 rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-gray-900">Module {moduleIndex + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeModule(moduleIndex)}
                          className="text-red-600 border-red-300 hover:bg-red-50 rounded-xl"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                          <Label className="text-gray-900 font-semibold">Module Name</Label>
                        <Input
                          value={module.name}
                          onChange={(e) => updateModule(moduleIndex, 'name', e.target.value)}
                            placeholder="e.g. Fundamentals"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                          <Label className="text-gray-900 font-semibold">Description</Label>
                        <Input
                          value={module.description}
                          onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                            placeholder="Module description"
                            className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                        />
                      </div>
                    </div>

                    {/* Module Lessons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900">Module Lessons</h4>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addLessonToModule(moduleIndex)}
                            className="bg-[#5154e7]/10 hover:bg-[#5154e7]/20 text-[#5154e7] border-[#5154e7]/30 rounded-xl"
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                            Lesson
                        </Button>
                      </div>

                      {module.lessons.map((lesson, lessonIndex) => (
                          <Card key={lessonIndex} className="bg-white border-gray-200 rounded-xl">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Lesson {lessonIndex + 1}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeLessonFromModule(moduleIndex, lessonIndex)}
                                  className="text-red-600 border-red-300 hover:bg-red-50 rounded-xl h-6 w-6 p-0"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="grid gap-3 md:grid-cols-2">
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                  placeholder="Lesson title"
                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl text-sm h-10"
                              />
                              <Input
                                type="number"
                                min="0"
                                value={lesson.duration}
                                onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                  placeholder="Duration (min)"
                                  className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl text-sm h-10"
                              />
                            </div>
                            
                            <Input
                              value={lesson.description}
                              onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                                placeholder="Lesson description"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl text-sm h-10"
                            />
                            
                            <Input
                              value={lesson.videoUrl}
                              onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'videoUrl', e.target.value)}
                                placeholder="Video URL"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl text-sm h-10"
                            />
                            
                            <Textarea
                              value={lesson.content}
                              onChange={(e) => updateModuleLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                                placeholder="Lesson content"
                                className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl text-sm min-h-[60px]"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </CardContent>
            </Card>

            {/* Direct Lessons */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900">Direct Lessons (without module)</CardTitle>
                <Button
                  type="button"
                  onClick={addDirectLesson}
                    className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-4 py-2 font-semibold"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                    Add Lesson
                </Button>
              </div>
              </CardHeader>
              <CardContent className="space-y-6">
              {directLessons.map((lesson, index) => (
                  <Card key={index} className="bg-gray-50 border-gray-200 rounded-2xl">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Lesson {index + 1}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDirectLesson(index)}
                          className="text-red-600 border-red-300 hover:bg-red-50 rounded-xl"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        value={lesson.title}
                        onChange={(e) => updateDirectLesson(index, 'title', e.target.value)}
                          placeholder="Lesson title"
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={lesson.duration}
                        onChange={(e) => updateDirectLesson(index, 'duration', parseInt(e.target.value) || 0)}
                          placeholder="Duration (min)"
                          className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                      />
                    </div>
                    
                    <Input
                      value={lesson.description}
                      onChange={(e) => updateDirectLesson(index, 'description', e.target.value)}
                        placeholder="Lesson description"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                    
                    <Input
                      value={lesson.videoUrl}
                      onChange={(e) => updateDirectLesson(index, 'videoUrl', e.target.value)}
                        placeholder="Video URL"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl h-12"
                    />
                    
                    <Textarea
                      value={lesson.content}
                      onChange={(e) => updateDirectLesson(index, 'content', e.target.value)}
                        placeholder="Lesson content"
                        className="border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] bg-white text-gray-900 placeholder:text-gray-500 rounded-xl min-h-[80px]"
                    />
                  </CardContent>
                </Card>
              ))}
              </CardContent>
            </Card>

            {/* Form Actions */}
            <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                        className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl px-6 font-semibold sm:w-auto"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Course
                  </Button>
                </DialogTrigger>
                    <DialogContent className="bg-white border-gray-200 rounded-2xl">
                  <DialogHeader>
                        <DialogTitle className="text-gray-900">Delete Course</DialogTitle>
                        <DialogDescription className="text-gray-600">
                          Are you sure you want to delete the course "{name}"? 
                          This action cannot be undone and all course data will be permanently lost.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDeleteDialogOpen(false)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                    >
                          Cancel
                    </Button>
                    <Button 
                      onClick={deleteCourse}
                      disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                    >
                          {isDeleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            'Delete Course'
                          )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex gap-2 sm:ml-auto">
                    <Button variant="outline" asChild className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 font-semibold">
                  <Link href="/doctor/courses">
                        Cancel
                  </Link>
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                      className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl px-6 font-semibold"
                >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                </Button>
              </div>
            </div>
              </CardContent>
            </Card>
          </form>

        </div>
      </div>
    </div>
  );
} 