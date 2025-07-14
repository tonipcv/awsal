'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeftIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  DocumentTextIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

export default function UploadProtocolPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const pdf = acceptedFiles[0];
    if (pdf) setFile(pdf);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/protocols/pdf-upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload PDF');
      }

      const protocol = await response.json();
      router.push(`/doctor/protocols/${protocol.id}/edit`);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:ml-64">
        <div className="container mx-auto p-6 lg:p-8 pt-24 pb-24 space-y-8">
          {/* Header */}
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="sm" asChild className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl h-10 px-3">
              <Link href="/doctor/protocols">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Create Protocol from PDF
              </h1>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                Upload a PDF file to automatically create a protocol based on its content.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <div className="p-8">
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-[#5154e7] bg-[#5154e7]/5' : 'border-gray-300 hover:border-[#5154e7] hover:bg-[#5154e7]/5'}
                `}
              >
                <input {...getInputProps()} />
                
                {file ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-[#5154e7]/10 rounded-2xl flex items-center justify-center mx-auto">
                      <DocumentTextIcon className="h-8 w-8 text-[#5154e7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                      <DocumentIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Drop your PDF here</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        or click to select a file (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XMarkIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-900">Upload failed</h4>
                      <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="bg-[#5154e7] hover:bg-[#4145d1] text-white rounded-xl h-12 px-6 font-semibold"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      Upload PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 