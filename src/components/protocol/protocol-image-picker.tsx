'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const PREDEFINED_IMAGES = [
  {
    id: 'protocol-1',
    src: '/images/protocol-1.jpg',
    alt: 'Medical Protocol 1',
    thumbnail: '/images/protocol-1-thumb.jpg'
  },
  {
    id: 'protocol-2',
    src: '/images/protocol-2.jpg',
    alt: 'Medical Protocol 2',
    thumbnail: '/images/protocol-2-thumb.jpg'
  },
  {
    id: 'protocol-3',
    src: '/images/protocol-3.jpg',
    alt: 'Medical Protocol 3',
    thumbnail: '/images/protocol-3-thumb.jpg'
  },
  {
    id: 'protocol-4',
    src: '/images/protocol-4.jpg',
    alt: 'Medical Protocol 4',
    thumbnail: '/images/protocol-4-thumb.jpg'
  }
];

interface ProtocolImagePickerProps {
  selectedImage: string;
  onSelectImage: (imageSrc: string) => void;
}

export function ProtocolImagePicker({ selectedImage, onSelectImage }: ProtocolImagePickerProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload image
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const { url } = await response.json();
        onSelectImage(url);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {PREDEFINED_IMAGES.map((image) => (
          <Button
            key={image.id}
            type="button"
            variant="outline"
            className={`h-40 relative hover:border-blue-500 hover:bg-blue-50 p-0 overflow-hidden ${
              selectedImage === image.src ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onSelectImage(image.src)}
          >
            <Image
              src={image.thumbnail}
              alt={image.alt}
              fill
              className="object-cover"
            />
          </Button>
        ))}
        
        <label className="relative block">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            className="h-40 w-full relative hover:border-blue-500 hover:bg-blue-50"
            disabled={isUploading}
          >
            <PhotoIcon className="h-8 w-8 text-gray-400" />
            <span className="sr-only">Upload custom image</span>
            {isUploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            )}
          </Button>
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Select a pre-made image or upload your own
      </p>
    </div>
  );
} 