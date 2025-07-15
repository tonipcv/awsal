'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  InformationCircleIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import CheckinQuestionsManager from '@/components/protocol/checkin-questions-manager';
import ProtocolCoursesManager from '@/components/protocol/protocol-courses-manager';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProtocolDatePicker } from './protocol-date-picker';

interface ProtocolEditTabsProps {
  protocol: any;
  setProtocol: (protocol: any) => void;
  availableCourses: any[];
  addCourse: (courseId: string) => void;
  removeCourse: (protocolCourseId: string) => void;
  updateCourse: (protocolCourseId: string, field: string, value: any) => void;
  reorderCourses: (courses: any[]) => void;
  protocolId: string;
  children: {
    basicInfo: React.ReactNode;
    modalConfig: React.ReactNode;
    days: React.ReactNode;
    products?: React.ReactNode;
  };
}

export function ProtocolEditTabs({ 
  protocol, 
  setProtocol, 
  availableCourses,
  addCourse,
  removeCourse,
  updateCourse,
  reorderCourses,
  protocolId,
  children 
}: ProtocolEditTabsProps) {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
        <TabsList className="grid w-full grid-cols-4 gap-4">
          <TabsTrigger 
            value="basic" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <InformationCircleIcon className="h-4 w-4" />
            <span>Information</span>
          </TabsTrigger>
          <TabsTrigger 
            value="days" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            <span>Tasks</span>
            <Badge variant="secondary" className="bg-[#51e790] text-black text-xs">
              {protocol.days.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="courses" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <AcademicCapIcon className="h-4 w-4" />
            <span>Training</span>
            {protocol.courses?.length > 0 && (
              <Badge variant="secondary" className="bg-[#5154e7] text-white text-xs">
                {protocol.courses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#5154e7] font-semibold"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span>Check-in</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="basic">
        {children.basicInfo}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">Prescription Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProtocolDatePicker
                label="Available from"
                date={protocol.availableFrom ? new Date(protocol.availableFrom) : null}
                onDateChange={(date) => setProtocol({ ...protocol, availableFrom: date?.toISOString() })}
              />
              
              <ProtocolDatePicker
                label="Available until"
                date={protocol.availableUntil ? new Date(protocol.availableUntil) : null}
                onDateChange={(date) => setProtocol({ ...protocol, availableUntil: date?.toISOString() })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="days">
        {children.days}
      </TabsContent>

      <TabsContent value="courses">
        <ProtocolCoursesManager
          protocolCourses={protocol.courses || []}
          availableCourses={availableCourses}
          onAddCourse={addCourse}
          onRemoveCourse={removeCourse}
          onUpdateCourse={updateCourse}
          onReorderCourses={reorderCourses}
        />
      </TabsContent>

      <TabsContent value="settings">
        {protocolId ? (
          <CheckinQuestionsManager protocolId={protocolId} />
        ) : (
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="text-center">
                <Cog6ToothIcon className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-medium text-gray-900 mb-3">Protocol ID Required</h3>
                <p className="text-gray-600">Save the protocol first to configure settings.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
} 