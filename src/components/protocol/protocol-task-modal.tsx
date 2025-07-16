'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ProtocolTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    title: string;
    description?: string;
    hasMoreInfo?: boolean;
    videoUrl?: string;
    fullExplanation?: string;
    modalTitle?: string;
    modalButtonText?: string;
    modalButtonUrl?: string;
  };
  dayNumber: number;
  sessionTitle?: string;
}

export function ProtocolTaskModal({
  isOpen,
  onClose,
  task,
  dayNumber,
  sessionTitle
}: ProtocolTaskModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-gray-600">
              Day {dayNumber}
            </Badge>
            {sessionTitle && (
              <Badge variant="outline" className="text-[#5154e7]">
                {sessionTitle}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {task.description && (
            <div className="text-gray-600">
              {task.description}
            </div>
          )}

          {/* Video */}
          {task.videoUrl && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <PlayIcon className="h-5 w-5 text-[#5154e7]" />
                Video Guide
              </h4>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-100">
                <iframe
                  src={task.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Full Explanation */}
          {task.fullExplanation && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5 text-[#5154e7]" />
                Detailed Instructions
              </h4>
              <div className="text-gray-600 bg-gray-50 p-4 rounded-xl">
                {task.fullExplanation}
              </div>
            </div>
          )}

          {/* External Link */}
          {task.modalButtonUrl && (
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={() => window.open(task.modalButtonUrl, '_blank')}
                className="w-full bg-[#5154e7] hover:bg-[#4145d1] text-white"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-2" />
                {task.modalButtonText || 'Learn More'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 