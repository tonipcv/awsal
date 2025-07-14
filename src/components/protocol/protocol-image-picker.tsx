'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PhotoIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ProtocolImagePickerProps {
  selectedImage: string;
  onSelectImage: (imageSrc: string) => void;
  mode?: 'full' | 'upload-only';
}

export function ProtocolImagePicker({ 
  selectedImage, 
  onSelectImage,
  mode = 'full'
}: ProtocolImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload image
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        onSelectImage(url);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset the input
      e.target.value = '';
    }
  };

  // Upload-only mode (for new protocol page)
  if (mode === 'upload-only') {
    return (
      <div className="space-y-4">
        {selectedImage ? (
          <div className="relative h-[200px] w-full rounded-xl overflow-hidden border border-gray-200">
            <Image
              src={selectedImage}
              alt="Selected cover image"
              fill
              className="object-cover"
            />
            <div className="absolute top-2 right-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onSelectImage('')}
                className="bg-white/90 hover:bg-white text-gray-900"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="sr-only"
              disabled={isUploading}
            />
            <div className="h-[200px] w-full border-2 border-dashed border-gray-300 rounded-xl hover:border-[#5154e7] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
              <span className="text-xs text-gray-500">(max 5MB)</span>
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              )}
            </div>
          </label>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Full mode with predefined images (for edit page)
  return (
    <div className="space-y-4">
      <div className="relative h-[200px] w-full rounded-xl overflow-hidden border border-gray-200">
        {selectedImage ? (
          <>
            <Image
              src={selectedImage}
              alt="Current cover image"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white text-gray-900"
                >
                  Change Image
                </Button>
              </label>
            </div>
          </>
        ) : (
          <label className="block h-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="sr-only"
              disabled={isUploading}
            />
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Click to upload image</span>
              <span className="text-xs text-gray-500">(max 5MB)</span>
            </div>
          </label>
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
} 