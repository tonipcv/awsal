import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, TrashIcon, AcademicCapIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Link from 'next/link';
import { toast } from 'sonner';

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
  // Filter out courses that are already assigned
  const availableCoursesToAdd = availableCourses.filter(
    course => !protocolCourses.some(pc => pc.courseId === course.id)
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
      <div className="flex items-center justify-between mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Courses */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium mb-4">Available Courses</h4>
            <div className="space-y-3">
              {availableCoursesToAdd.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No courses available to add. Create a new course first.
                </p>
              ) : (
                availableCoursesToAdd.map(course => (
                  <div
                    key={course.id}
                    className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium truncate">{course.title}</h5>
                        {course.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            course.isPublished 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => onAddCourse(course.id)}
                          size="sm"
                          className="gap-1"
                        >
                          Add to Protocol
                          <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Protocol Courses */}
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium mb-4">Selected Courses</h4>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="courses">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {protocolCourses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No courses added to this protocol yet. Add courses from the available list.
                      </p>
                    ) : (
                      protocolCourses.map((protocolCourse, index) => (
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
                              className="flex items-start justify-between p-4 bg-white rounded-lg border group hover:border-primary/50 transition-colors"
                          >
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium truncate">
                                  {protocolCourse.course.title}
                                </h5>
                                {protocolCourse.course.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {protocolCourse.course.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-3">
                                  <div className="flex items-center gap-2">
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
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                  href={`/doctor/courses/${protocolCourse.courseId}/edit`}
                                className="text-blue-600 hover:text-blue-800"
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                  <Button variant="ghost" size="icon" title="Edit Course">
                                  <AcademicCapIcon className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveCourse(protocolCourse.id)}
                                  title="Remove from Protocol"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 