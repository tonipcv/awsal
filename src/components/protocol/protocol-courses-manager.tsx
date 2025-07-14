import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, TrashIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  isPublished?: boolean;
}

interface ProtocolCourse {
  id: string;
  courseId: string;
  orderIndex: number;
  isRequired: boolean;
  course: Course;
}

interface ProtocolCoursesManagerProps {
  protocolCourses: ProtocolCourse[];
  availableCourses: Course[];
  onAddCourse: (courseId: string) => void;
  onRemoveCourse: (protocolCourseId: string) => void;
  onUpdateCourse: (protocolCourseId: string, field: string, value: any) => void;
  onReorderCourses: (courses: ProtocolCourse[]) => void;
}

export default function ProtocolCoursesManager({
  protocolCourses = [],
  availableCourses = [],
  onAddCourse,
  onRemoveCourse,
  onUpdateCourse,
  onReorderCourses
}: ProtocolCoursesManagerProps) {
  const availableCoursesToAdd = availableCourses.filter(
    course => !protocolCourses.some(pc => pc.courseId === course.id) && course.isPublished
  );

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(protocolCourses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index
    }));

    onReorderCourses(updatedItems);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium leading-none">Protocol Courses</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage the courses that will be part of this protocol
                </p>
              </div>
              <Link href="/doctor/courses/create" target="_blank" rel="noopener noreferrer">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Course
                </Button>
              </Link>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="courses">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-4"
                  >
                    {protocolCourses.map((protocolCourse, index) => (
                      <Draggable
                        key={protocolCourse.id}
                        draggableId={protocolCourse.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium leading-none">
                                  {protocolCourse.course.title}
                                </h3>
                                {protocolCourse.course.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {protocolCourse.course.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={protocolCourse.isRequired}
                                  onCheckedChange={(checked) =>
                                    onUpdateCourse(protocolCourse.id, 'isRequired', checked)
                                  }
                                />
                                <span className="text-sm text-muted-foreground">
                                  {protocolCourse.isRequired ? 'Required' : 'Optional'}
                                </span>
                              </div>
                              <Link
                                href={`/doctor/courses/${protocolCourse.course.id}/edit`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Button variant="ghost" size="icon">
                                  <AcademicCapIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveCourse(protocolCourse.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium leading-none">Available Courses</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add existing courses to this protocol
                </p>
              </div>

              {availableCoursesToAdd.length > 0 ? (
                <Select onValueChange={onAddCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCoursesToAdd.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No courses available to add. Create a new course or publish existing ones.
                </p>
              )}

              <div className="space-y-2">
                {availableCourses.map(course => (
                  <div
                    key={course.id}
                    className="p-4 rounded-lg border"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium leading-none">
                        {course.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          course.isPublished 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <Link href={`/doctor/courses/${course.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {course.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 