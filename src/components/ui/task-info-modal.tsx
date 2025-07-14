import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';

interface TaskInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  videoUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export function TaskInfoModal({
  isOpen,
  onClose,
  title,
  description,
  videoUrl,
  buttonText,
  buttonUrl,
}: TaskInfoModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-lg lg:text-2xl font-bold text-white">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Section */}
          {videoUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-800">
              {isPlaying ? (
                <iframe
                  src={videoUrl}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="flex items-center justify-center h-16 w-16 rounded-full bg-turquoise text-black hover:bg-turquoise/90 transition-colors"
                  >
                    <PlayIcon className="h-8 w-8" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <DialogDescription className="text-sm lg:text-base text-gray-300 leading-relaxed">
              {description}
            </DialogDescription>
          )}

          {/* Action Button */}
          {buttonText && buttonUrl && (
            <div className="pt-2">
              <Button
                onClick={() => window.open(buttonUrl, '_blank')}
                className="w-full bg-turquoise hover:bg-turquoise/90 text-black font-medium"
              >
                {buttonText}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 