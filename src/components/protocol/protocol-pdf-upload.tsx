'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DocumentIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export function ProtocolPDFUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const pdf = acceptedFiles[0];
    if (pdf.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    if (pdf.size > 10 * 1024 * 1024) { // 10MB
      setError('File size must be less than 10MB');
      return;
    }
    setFile(pdf);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleUpload = async (confirm: boolean = false) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      if (confirm) {
        formData.append('confirmCreate', 'true');
      }

      const response = await fetch('/api/protocols/create-from-pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload PDF');
      }

      const data = await response.json();

      if (data.preview) {
        setPreviewData(data.data);
      } else {
        router.push(`/doctor/protocols/${data.id}/edit`);
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setError(error instanceof Error ? error.message : 'Error uploading PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreviewData(null);
    setError(null);
  };

  if (previewData) {
    return (
      <Card className="bg-white border-gray-200 shadow-lg rounded-2xl p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Preview Protocol</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetUpload}
              className="text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700">Name</h4>
              <p className="text-gray-900">{previewData.name}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700">Description</h4>
              <p className="text-gray-900">{previewData.description}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700">Days</h4>
              <div className="space-y-4 mt-2">
                {previewData.days.map((day: any) => (
                  <div key={day.dayNumber} className="bg-gray-50 rounded-xl p-4">
                    <h5 className="font-semibold text-gray-900 mb-2">{day.title}</h5>
                    {day.sessions.map((session: any, sessionIndex: number) => (
                      <div key={sessionIndex} className="ml-4 mt-2">
                        <h6 className="font-medium text-gray-700">{session.name}</h6>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {session.tasks.map((task: any, taskIndex: number) => (
                            <li key={taskIndex} className="text-gray-600">{task.title}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
              Please review the protocol before confirming
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={resetUpload}
                className="border border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpload(true)}
                disabled={isUploading}
                className="bg-[#5154e7] hover:bg-[#4145d1] text-white"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Confirm & Create
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-8
          ${isDragActive ? 'border-[#5154e7] bg-[#5154e7]/5' : 'border-gray-300 hover:border-[#5154e7] hover:bg-[#5154e7]/5'}
          transition-colors duration-200 cursor-pointer
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-[#5154e7]/10 rounded-xl flex items-center justify-center mb-4">
            {file ? (
              <DocumentIcon className="h-6 w-6 text-[#5154e7]" />
            ) : (
              <ArrowUpTrayIcon className="h-6 w-6 text-[#5154e7]" />
            )}
          </div>
          {file ? (
            <div>
              <p className="text-sm font-semibold text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Drop your PDF here, or <span className="text-[#5154e7]">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {file && !error && (
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={resetUpload}
            className="border border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUpload(false)}
            disabled={isUploading}
            className="bg-[#5154e7] hover:bg-[#4145d1] text-white"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Upload & Preview
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 