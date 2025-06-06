'use client';

import { useState } from 'react';
import { XMarkIcon, PlayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  videoUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export default function ProtocolModal({
  isOpen,
  onClose,
  title,
  description,
  videoUrl,
  buttonText = "Saber mais",
  buttonUrl
}: ProtocolModalProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  if (!isOpen) return null;

  const handleButtonClick = () => {
    if (buttonUrl) {
      window.open(buttonUrl, '_blank');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900 backdrop-blur border border-gray-700 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-light text-white">
            {title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Video */}
          {videoUrl && (
            <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-turquoise/20 rounded-full flex items-center justify-center">
                    <PlayIcon className="h-8 w-8 text-turquoise ml-1" />
                  </div>
                </div>
              )}
              <iframe
                src={videoUrl}
                title={title}
                className={cn(
                  "w-full h-full border-0 transition-opacity duration-300",
                  isVideoLoaded ? "opacity-100" : "opacity-0"
                )}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoLoaded(true)}
              />
            </div>
          )}

          {/* Description */}
          {description && (
            <div className="prose prose-invert max-w-none">
              <p className="text-sm text-gray-300 leading-relaxed">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            Fechar
          </Button>
          {buttonUrl && (
            <Button
              onClick={handleButtonClick}
              className="bg-turquoise hover:bg-turquoise/90 text-black font-medium"
            >
              <span className="mr-2">{buttonText}</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 