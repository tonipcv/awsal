import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ClockIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ProtocolAnalysis } from '@/lib/ai-service';

interface ProtocolPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  protocol: ProtocolAnalysis;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ProtocolPreviewModal({
  isOpen,
  onClose,
  protocol,
  onConfirm,
  isLoading = false
}: ProtocolPreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Protocol Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">{protocol.name}</h2>
            <p className="text-gray-600">{protocol.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                <span>{protocol.duration} days</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                <span>
                  {protocol.days.reduce((total, day) => 
                    total + day.sessions.reduce((sessionTotal, session) => 
                      sessionTotal + session.tasks.length, 0
                    ), 0
                  )} tasks
                </span>
              </div>
            </div>
          </div>

          {/* Days Preview */}
          <div className="space-y-4">
            {protocol.days.map((day) => (
              <Card key={day.dayNumber}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">{day.title}</h3>
                  <div className="space-y-3">
                    {day.sessions.map((session, sessionIndex) => (
                      <div key={sessionIndex} className="pl-4 border-l-2 border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">{session.name}</h4>
                        <ul className="space-y-2">
                          {session.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-start gap-2">
                              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                              <div>
                                <p className="text-gray-900">{task.title}</p>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                                {task.hasMoreInfo && (
                                  <Badge variant="secondary" className="mt-1">Has additional info</Badge>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recommended Products */}
          {protocol.recommendedProducts && protocol.recommendedProducts.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recommended Products</h3>
              <ul className="space-y-2">
                {protocol.recommendedProducts.map((product, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-gray-900">{product}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-gray-700 hover:text-gray-900"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              className="bg-[#5154e7] hover:bg-[#4145d1] text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Create Protocol
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 